import { Test, TestingModule } from '@nestjs/testing';
import { ConfigType } from '@nestjs/config';
import * as oracledb from 'oracledb';
import { OracleService } from '@share/infrastructure/oracle/oracle.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { ApmService } from '@share/domain/config/apm/apm.service';
import config from '@share/domain/resources/env.config';
import { LogLevel } from '@share/domain/config/logger/types/logger20.type';

// Mock oracledb module
jest.mock('oracledb', () => ({
  createPool: jest.fn(),
  getPool: jest.fn(),
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 4001,
  CURSOR: 2021,
}));

describe('OracleService', () => {
  let service: OracleService;
  let mockLogger: jest.Mocked<Logger20Service>;
  let mockApmService: jest.Mocked<ApmService>;
  let mockConfigService: ConfigType<typeof config>;
  let mockPool: any;
  let mockConnection: any;
  let mockProcessLogger: any;
  let mockSpan: any;
  let mockCursor: any;

  beforeEach(async () => {
    // Mock del ProcessLogger
    mockProcessLogger = {
      endProcess: jest.fn(),
    };

    // Mock del Span
    mockSpan = {
      end: jest.fn(),
    };

    // Mock del Cursor
    mockCursor = {
      getRows: jest.fn(),
      close: jest.fn(),
    };

    // Mock del Connection
    mockConnection = {
      execute: jest.fn(),
      close: jest.fn(),
    };

    // Mock del Pool
    mockPool = {
      close: jest.fn(),
      getStatistics: jest.fn().mockReturnValue({
        connectionsInUse: 1,
        connectionsOpen: 2,
        poolAlias: 'test-pool',
      }),
    };

    // Mock del Logger20Service
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      startProcess: jest.fn().mockReturnValue(mockProcessLogger),
    } as any;

    // Mock del ApmService
    mockApmService = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      setCustomContext: jest.fn(),
      setLabel: jest.fn(),
      captureError: jest.fn(),
    } as any;

    // Mock del ConfigService
    mockConfigService = {
      SERVICE_NAME: 'test-service',
      CONNECTION_ORACLE: {
        DB_USERNAME: 'testuser',
        DB_PASSWORD: 'testpass',
        DB_CONNECTSTRING: 'localhost:1521/XE',
      },
      POOL: {
        DB_POOL_ALIAS: 'test-pool',
        DB_POOL_MIN: 1,
        DB_POOL_MAX: 10,
        DB_POOL_INCREMENT: 1,
        DB_POOL_TIMEOUT: 60,
        DB_QUEUE_TIMEOUT: 60000,
        DB_STMT_CACHE_SIZE: 30,
      },
    } as any;

    // Setup oracledb mocks
    (oracledb.createPool as jest.Mock).mockResolvedValue(undefined);
    (oracledb.getPool as jest.Mock).mockReturnValue(mockPool);
    (oracledb.getConnection as jest.Mock).mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OracleService,
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: config.KEY,
          useValue: mockConfigService,
        },
        {
          provide: ApmService,
          useValue: mockApmService,
        },
      ],
    }).compile();

    service = module.get<OracleService>(OracleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create pool and validate connection successfully', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({
        rows: [[1]],
      });

      // Act
      await service.onModuleInit();

      // Assert
      expect(oracledb.createPool).toHaveBeenCalledWith({
        poolAlias: 'test-pool',
        user: 'testuser',
        password: 'testpass',
        connectString: 'localhost:1521/XE',
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 60,
        queueTimeout: 60000,
        stmtCacheSize: 30,
        enableStatistics: true,
      });
      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT 1 FROM DUAL');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Pool de conexiones creado y validado para la base de datos principal',
      );
    });

    it('should handle authentication error', async () => {
      // Arrange
      const authError = new Error('ORA-01017: invalid username/password');
      (oracledb.createPool as jest.Mock).mockRejectedValue(authError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Error de autenticación: Usuario o contraseña incorrectos para Oracle',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error detallado al crear y validar el pool de conexiones:',
        expect.objectContaining({
          message: authError.message,
        }),
      );
    });

    it('should handle connectivity error', async () => {
      // Arrange
      const connectError = new Error(
        'ORA-12541: listener does not currently know',
      );
      (oracledb.createPool as jest.Mock).mockRejectedValue(connectError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Error de conectividad: No se puede conectar al servidor Oracle',
      );
    });

    it('should handle connection string error', async () => {
      // Arrange
      const connectStringError = new Error('ORA-12154: could not resolve');
      (oracledb.createPool as jest.Mock).mockRejectedValue(connectStringError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Error de configuración: String de conexión Oracle inválido',
      );
    });

    it('should handle generic error', async () => {
      // Arrange
      const genericError = new Error('Some other error');
      (oracledb.createPool as jest.Mock).mockRejectedValue(genericError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Error al inicializar la conexión Oracle: Some other error',
      );
    });

    it('should not reinitialize if pool is already initialized', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });
      await service.onModuleInit(); // First initialization
      jest.clearAllMocks();

      // Act
      await service.onModuleInit(); // Second call

      // Assert
      expect(oracledb.createPool).not.toHaveBeenCalled();
    });

    it('should handle validation connection failure', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] }); // Empty result

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Fallo en la validación de conexión a Oracle: La consulta de validación no retornó resultados esperados',
      );
      expect(mockPool.close).toHaveBeenCalledWith(0);
    });

    it('should handle validation connection failure and pool close error', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [] }); // Empty result
      const poolCloseError = new Error('Failed to close pool');
      mockPool.close.mockRejectedValue(poolCloseError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Fallo en la validación de conexión a Oracle: La consulta de validación no retornó resultados esperados',
      );
      expect(mockPool.close).toHaveBeenCalledWith(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al cerrar el pool después de validación fallida:',
        poolCloseError,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close pool successfully', async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(oracledb.getPool).toHaveBeenCalledWith('test-pool');
      expect(mockPool.close).toHaveBeenCalledWith(10);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Pool de conexiones cerrado para la base de datos principal',
      );
    });

    it('should handle pool close error', async () => {
      // Arrange
      const closeError = new Error('Failed to close pool');
      mockPool.close.mockRejectedValue(closeError);

      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al cerrar los pools de conexiones',
        closeError,
      );
    });
  });

  describe('getConnection', () => {
    it('should get connection successfully', async () => {
      // Act
      const result = await service.getConnection('test-pool');

      // Assert
      expect(oracledb.getConnection).toHaveBeenCalledWith('test-pool');
      expect(result).toBe(mockConnection);
    });

    it('should handle connection error', async () => {
      // Arrange
      const connectionError = new Error('Connection failed');
      (oracledb.getConnection as jest.Mock).mockRejectedValue(connectionError);

      // Act & Assert
      await expect(service.getConnection('test-pool')).rejects.toThrow(
        connectionError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al obtener la conexión del pool por test-pool',
        connectionError,
      );
    });
  });

  describe('closeConnection', () => {
    it('should close connection successfully', async () => {
      // Act
      await service.closeConnection(mockConnection);

      // Assert
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle connection close error', async () => {
      // Arrange
      const closeError = new Error('Failed to close connection');
      mockConnection.close.mockRejectedValue(closeError);

      // Act & Assert
      await expect(service.closeConnection(mockConnection)).rejects.toThrow(
        closeError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al cerrar la conexión',
        closeError,
      );
    });
  });

  describe('callProcedure', () => {
    const procedureName = 'test_procedure';
    const binds = {
      param1: { type: oracledb.STRING, value: 'test' },
      param2: { type: oracledb.NUMBER, value: 123 },
    };
    const mockResult = {
      outBinds: {},
      rows: [],
    };

    beforeEach(() => {
      // Setup for successful initialization
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });
    });

    it('should execute procedure successfully', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue(mockResult);

      // Act
      const result = await service.callProcedure(procedureName, binds);

      // Assert
      expect(mockApmService.startSpan).toHaveBeenCalledWith(
        procedureName,
        'db',
        'oracle',
        'procedure',
      );
      expect(mockLogger.startProcess).toHaveBeenCalledWith(
        `Consumo Procedimiento ${procedureName}`,
        { request: binds },
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'BEGIN test_procedure(:param1,:param2); END;',
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        `Ejecución de procedimiento almacenado ${procedureName} exitoso`,
        {
          response: mockResult,
          methodName: 'callProcedure',
        },
      );
      expect(mockSpan.end).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    it('should handle cursor result correctly', async () => {
      // Arrange
      const bindsWithCursor = {
        ...binds,
        cursor_out: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      };
      const mockResultWithCursor = {
        outBinds: {
          cursor_out: mockCursor,
        },
        rows: [],
      };
      const cursorData = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ];

      mockConnection.execute.mockResolvedValue(mockResultWithCursor);
      mockCursor.getRows
        .mockResolvedValueOnce(cursorData)
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.callProcedure(
        procedureName,
        bindsWithCursor,
      );

      // Assert
      expect(mockCursor.getRows).toHaveBeenCalledWith(0);
      expect(mockCursor.close).toHaveBeenCalled();
      expect((result.outBinds as any).cursor_out).toEqual(cursorData);
    });

    it('should handle procedure execution error', async () => {
      // Arrange
      const executionError = new Error('Procedure execution failed');
      mockConnection.execute.mockRejectedValue(executionError);

      // Act & Assert
      await expect(service.callProcedure(procedureName, binds)).rejects.toThrow(
        executionError,
      );
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        `Error en la ejecución del procedimiento ${procedureName}`,
        {
          response: executionError.message,
        },
        LogLevel.ERROR,
      );
      expect(mockApmService.setLabel).toHaveBeenCalledWith(
        'db.operation',
        procedureName,
      );
      expect(mockApmService.captureError).toHaveBeenCalledWith(executionError);
      expect(mockSpan.end).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle custom execution options', async () => {
      // Arrange
      const customOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
      };
      mockConnection.execute.mockResolvedValue(mockResult);

      // Act
      await service.callProcedure(procedureName, binds, customOptions);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'BEGIN test_procedure(:param1,:param2); END;',
        binds,
        customOptions,
      );
    });

    it('should handle empty binds', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue(mockResult);

      // Act
      await service.callProcedure(procedureName, {});

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'BEGIN test_procedure(); END;',
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
    });

    it('should set APM context correctly', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue(mockResult);

      // Act
      await service.callProcedure(procedureName, binds);

      // Assert
      expect(mockApmService.setCustomContext).toHaveBeenCalledWith({
        database: { operation: procedureName, pool: 'test-pool' },
      });
    });
  });

  describe('fetchAllFromCursor (private method)', () => {
    it('should fetch all rows from cursor', async () => {
      // Arrange
      const bindsWithCursor = {
        cursor_out: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      };
      const mockResultWithCursor = {
        outBinds: {
          cursor_out: mockCursor,
        },
        rows: [],
      };
      const firstChunk = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];
      const secondChunk = [{ id: 3, name: 'test3' }];

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [[1]] }) // for validation
        .mockResolvedValueOnce(mockResultWithCursor);

      mockCursor.getRows
        .mockResolvedValueOnce(firstChunk)
        .mockResolvedValueOnce(secondChunk)
        .mockResolvedValueOnce([]); // End of cursor

      // Act
      await service.onModuleInit(); // Initialize first
      const result = await service.callProcedure('test_proc', bindsWithCursor);

      // Assert
      expect((result.outBinds as any).cursor_out).toEqual([
        ...firstChunk,
        ...secondChunk,
      ]);
      expect(mockCursor.close).toHaveBeenCalled();
    });

    it('should handle cursor fetch error', async () => {
      // Arrange
      const bindsWithCursor = {
        cursor_out: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      };
      const mockResultWithCursor = {
        outBinds: {
          cursor_out: mockCursor,
        },
        rows: [],
      };
      const fetchError = new Error('Cursor fetch failed');

      mockConnection.execute
        .mockResolvedValueOnce({ rows: [[1]] }) // for validation
        .mockResolvedValueOnce(mockResultWithCursor);

      mockCursor.getRows.mockRejectedValue(fetchError);

      // Act & Assert
      await service.onModuleInit(); // Initialize first
      await expect(
        service.callProcedure('test_proc', bindsWithCursor),
      ).rejects.toThrow(fetchError);
      expect(mockCursor.close).toHaveBeenCalled();
    });
  });

  describe('registerPoolStatistics (private method)', () => {
    it('should register pool statistics in APM', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });
      const poolStats = {
        connectionsInUse: 1,
        connectionsOpen: 2,
        poolAlias: 'test-pool',
      };
      mockPool.getStatistics.mockReturnValue(poolStats);

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockPool.getStatistics).toHaveBeenCalled();
      expect(mockApmService.setCustomContext).toHaveBeenCalledWith({
        poolStats,
      });
    });

    it('should handle pool statistics error', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });
      const statsError = new Error('Stats error');
      mockPool.getStatistics.mockImplementation(() => {
        throw statsError;
      });

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al registrar las estadísticas del pool en APM',
        statsError,
      );
    });
  });

  describe('Service with fallback pool alias', () => {
    it('should use service name as pool alias when DB_POOL_ALIAS is not configured', async () => {
      // Arrange
      const configWithoutPoolAlias = {
        ...mockConfigService,
        SERVICE_NAME: 'fallback-service',
        POOL: {
          ...mockConfigService.POOL,
          DB_POOL_ALIAS: undefined,
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OracleService,
          {
            provide: Logger20Service,
            useValue: mockLogger,
          },
          {
            provide: config.KEY,
            useValue: configWithoutPoolAlias,
          },
          {
            provide: ApmService,
            useValue: mockApmService,
          },
        ],
      }).compile();

      const serviceWithFallback = module.get<OracleService>(OracleService);
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });

      // Act
      await serviceWithFallback.onModuleInit();

      // Assert
      expect(oracledb.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          poolAlias: 'fallback-service',
        }),
      );
    });
  });

  describe('isPoolInitialized', () => {
    it('should return false when pool is not initialized', () => {
      // Act
      const result = service.isPoolInitialized();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when pool is initialized', async () => {
      // Arrange
      mockConnection.execute.mockResolvedValue({ rows: [[1]] });

      // Act
      await service.onModuleInit();
      const result = service.isPoolInitialized();

      // Assert
      expect(result).toBe(true);
    });
  });
});
