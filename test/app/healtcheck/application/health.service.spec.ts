import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as sql from 'mssql';
import { HealthService } from '@src/app/healtcheck/application/health.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { OracleService } from '@share/infrastructure/oracle/oracle.service';
import config from '@share/domain/resources/env.config';

describe('HealthService', () => {
  let service: HealthService;
  let mockConnectionPool: jest.Mocked<sql.ConnectionPool>;
  let mockLogger: jest.Mocked<Logger20Service>;
  let configService: ConfigType<typeof config>;

  const mockConfigService = {
    SERVICE_NAME: 'test-service',
    CONNECTION_MSSQL: {
      DB_SERVER: 'test-server.example.com',
      DB_DATABASE: 'TestDatabase',
      DB_USERNAME: 'testuser',
      DB_PASSWORD: 'testpass',
      DB_PORT: '1433',
    },
    CONNECTION_ORACLE: {
      DB_USERNAME: 'oracle_user',
      DB_PASSWORD: 'oracle_pass',
      DB_CONNECTSTRING: 'localhost:1521/XE',
    },
    POOL: {
      DB_POOL_MIN: 5,
      DB_POOL_MAX: 20,
      DB_POOL_INCREMENT: 5,
      DB_POOL_TIMEOUT: 30000,
      DB_QUEUE_TIMEOUT: 60000,
      DB_STMT_CACHE_SIZE: 100,
      DB_POOL_ALIAS: 'test-pool',
    },
  };

  const mockLogger20Service = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockOracleConnection = {
    execute: jest.fn(),
    close: jest.fn(),
  };

  const mockOracleService = {
    isPoolInitialized: jest.fn().mockReturnValue(true),
    getConnection: jest.fn().mockResolvedValue(mockOracleConnection),
    closeConnection: jest.fn(),
  };

  const mockRequest = {
    query: jest.fn(),
  };

  const createMockConnectionPool = (connected: boolean = true) => ({
    connected,
    request: jest.fn().mockReturnValue(mockRequest),
  });

  beforeEach(async () => {
    // Mock del ConnectionPool
    mockConnectionPool = createMockConnectionPool() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: 'SQL_CONNECTION',
          useValue: mockConnectionPool,
        },
        {
          provide: config.KEY,
          useValue: mockConfigService,
        },
        {
          provide: Logger20Service,
          useValue: mockLogger20Service,
        },
        {
          provide: OracleService,
          useValue: mockOracleService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigType<typeof config>>(config.KEY);
    mockLogger = module.get<Logger20Service>(
      Logger20Service,
    ) as jest.Mocked<Logger20Service>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset Oracle mocks
    mockOracleService.isPoolInitialized.mockReturnValue(true);
    mockOracleConnection.execute.mockResolvedValue({ rows: [[1]] });
  });

  describe('check', () => {
    it('should return ok status when both databases are healthy', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });
      mockOracleConnection.execute.mockResolvedValue({
        rows: [[1]],
      });

      // Act
      const result = await service.check();

      // Assert
      expect(result.httpCode).toBe(HttpStatus.OK);
      expect(result.status).toBe('ok');
      expect(result.info.mssql).toEqual({
        status: 'up',
        isConnected: true,
        message: 'Database is connected and responsive',
      });
      expect(result.info.oracle).toEqual({
        status: 'up',
        isConnected: true,
        message: 'Oracle database is connected and responsive',
      });
      expect(result.error).toEqual({});
      expect(result.details.mssql).toEqual(result.info.mssql);
      expect(result.details.oracle).toEqual(result.info.oracle);
    });

    it('should throw HttpException when MSSQL database is down', async () => {
      // Arrange - crear un módulo con pool desconectado
      const disconnectedPool = createMockConnectionPool(false);
      const moduleWithDisconnectedPool: TestingModule =
        await Test.createTestingModule({
          providers: [
            HealthService,
            {
              provide: 'SQL_CONNECTION',
              useValue: disconnectedPool,
            },
            {
              provide: config.KEY,
              useValue: mockConfigService,
            },
            {
              provide: Logger20Service,
              useValue: mockLogger20Service,
            },
            {
              provide: OracleService,
              useValue: mockOracleService,
            },
          ],
        }).compile();

      const serviceWithDisconnectedPool =
        moduleWithDisconnectedPool.get<HealthService>(HealthService);

      // Act & Assert
      await expect(serviceWithDisconnectedPool.check()).rejects.toThrow(
        HttpException,
      );

      try {
        await serviceWithDisconnectedPool.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql).toEqual({
          status: 'down',
          isConnected: false,
          message: 'Database connection pool is not connected',
        });
      }
    });

    it('should throw HttpException when MSSQL database query error occurs', async () => {
      // Arrange
      const dbError = new Error('Database connection timeout');
      mockRequest.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.check()).rejects.toThrow(HttpException);

      try {
        await service.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql).toEqual({
          status: 'down',
          isConnected: false,
          message: 'Database health check failed: Database connection timeout',
          error: 'Database connection timeout',
        });
      }
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking database health',
        dbError,
      );
    });

    it('should throw HttpException when MSSQL query returns unexpected result', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [],
      });

      // Act & Assert
      await expect(service.check()).rejects.toThrow(HttpException);

      try {
        await service.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql).toEqual({
          status: 'down',
          isConnected: false,
          message: 'Database query returned unexpected result',
        });
      }
    });

    it('should throw HttpException when MSSQL returns null recordset', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: null,
      });

      // Act & Assert
      await expect(service.check()).rejects.toThrow(HttpException);

      try {
        await service.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql).toEqual({
          status: 'down',
          isConnected: false,
          message: 'Database query returned unexpected result',
        });
      }
    });

    it('should throw HttpException when MSSQL pool is null', async () => {
      // Arrange
      const moduleWithNullPool: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: 'SQL_CONNECTION',
            useValue: null,
          },
          {
            provide: config.KEY,
            useValue: mockConfigService,
          },
          {
            provide: Logger20Service,
            useValue: mockLogger20Service,
          },
          {
            provide: OracleService,
            useValue: mockOracleService,
          },
        ],
      }).compile();

      const serviceWithNullPool =
        moduleWithNullPool.get<HealthService>(HealthService);

      // Act & Assert
      await expect(serviceWithNullPool.check()).rejects.toThrow(HttpException);

      try {
        await serviceWithNullPool.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql).toEqual({
          status: 'down',
          isConnected: false,
          message: 'Database connection pool is not connected',
        });
      }
    });

    it('should throw HttpException when there is an unexpected error during check', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected system error');
      mockRequest.query.mockRejectedValue(unexpectedError);

      // Mock para que ambos checkMssql y checkOracle fallen de forma inesperada
      jest
        .spyOn(service as any, 'checkMssql')
        .mockRejectedValue(unexpectedError);
      jest
        .spyOn(service as any, 'checkOracle')
        .mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(service.check()).rejects.toThrow(HttpException);
    });

    it('should handle missing database configuration gracefully', async () => {
      // Arrange
      const moduleWithoutDbConfig: TestingModule =
        await Test.createTestingModule({
          providers: [
            HealthService,
            {
              provide: 'SQL_CONNECTION',
              useValue: mockConnectionPool,
            },
            {
              provide: config.KEY,
              useValue: {
                SERVICE_NAME: 'test-service',
                CONNECTION_MSSQL: undefined,
                CONNECTION_ORACLE: undefined,
                POOL: {
                  DB_POOL_ALIAS: 'test-pool',
                },
              },
            },
            {
              provide: Logger20Service,
              useValue: mockLogger20Service,
            },
            {
              provide: OracleService,
              useValue: mockOracleService,
            },
          ],
        }).compile();

      const serviceWithoutDbConfig =
        moduleWithoutDbConfig.get<HealthService>(HealthService);
      mockRequest.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });

      // Act
      const result = await serviceWithoutDbConfig.check();

      // Assert
      expect(result.status).toBe('ok');
    });
  });

  describe('MSSQL Database Health Check - checkMssql', () => {
    it('should return up status when connection pool is connected and query succeeds', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'up',
        isConnected: true,
        message: 'Database is connected and responsive',
      });
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT 1 as test');
    });

    it('should return down status when connection pool is not connected', async () => {
      // Arrange - crear un servicio con pool desconectado
      const disconnectedPool = createMockConnectionPool(false);
      const moduleWithDisconnectedPool: TestingModule =
        await Test.createTestingModule({
          providers: [
            HealthService,
            {
              provide: 'SQL_CONNECTION',
              useValue: disconnectedPool,
            },
            {
              provide: config.KEY,
              useValue: mockConfigService,
            },
            {
              provide: Logger20Service,
              useValue: mockLogger20Service,
            },
            {
              provide: OracleService,
              useValue: mockOracleService,
            },
          ],
        }).compile();

      const serviceWithDisconnectedPool =
        moduleWithDisconnectedPool.get<HealthService>(HealthService);

      // Act
      const result = await (serviceWithDisconnectedPool as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Database connection pool is not connected',
      });
      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should return down status when query fails', async () => {
      // Arrange
      const dbError = new Error('Connection refused');
      mockRequest.query.mockRejectedValue(dbError);

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Database health check failed: Connection refused',
        error: 'Connection refused',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking database health',
        dbError,
      );
    });

    it('should return down status when query returns no records', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [],
      });

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Database query returned unexpected result',
      });
    });

    it('should return down status when query returns null recordset', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: null,
      });

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Database query returned unexpected result',
      });
    });

    it('should return down status when query returns undefined recordset', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: undefined,
      });

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Database query returned unexpected result',
      });
    });

    it('should handle database configuration with null values', async () => {
      // Arrange
      const moduleWithNullConfig: TestingModule =
        await Test.createTestingModule({
          providers: [
            HealthService,
            {
              provide: 'SQL_CONNECTION',
              useValue: mockConnectionPool,
            },
            {
              provide: config.KEY,
              useValue: {
                SERVICE_NAME: 'test-service',
                CONNECTION_MSSQL: {
                  DB_SERVER: null,
                  DB_DATABASE: null,
                },
                CONNECTION_ORACLE: {
                  DB_USERNAME: 'oracle_user',
                  DB_PASSWORD: 'oracle_pass',
                  DB_CONNECTSTRING: 'localhost:1521/XE',
                },
                POOL: {
                  DB_POOL_ALIAS: 'test-pool',
                },
              },
            },
            {
              provide: Logger20Service,
              useValue: mockLogger20Service,
            },
            {
              provide: OracleService,
              useValue: mockOracleService,
            },
          ],
        }).compile();

      const serviceWithNullConfig =
        moduleWithNullConfig.get<HealthService>(HealthService);
      mockRequest.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });

      // Act
      const result = await (serviceWithNullConfig as any).checkMssql();

      // Assert
      expect(result.status).toBe('up');
      expect(result.isConnected).toBe(true);
      expect(result.message).toBe('Database is connected and responsive');
    });
  });

  describe('Oracle Database Health Check - checkOracle', () => {
    it('should return up status when Oracle pool is initialized and query succeeds', async () => {
      // Arrange
      mockOracleService.isPoolInitialized.mockReturnValue(true);
      mockOracleConnection.execute.mockResolvedValue({
        rows: [[1]],
      });

      // Act
      const result = await (service as any).checkOracle();

      // Assert
      expect(result).toEqual({
        status: 'up',
        isConnected: true,
        message: 'Oracle database is connected and responsive',
      });
      expect(mockOracleService.getConnection).toHaveBeenCalledWith('test-pool');
      expect(mockOracleConnection.execute).toHaveBeenCalledWith(
        'SELECT 1 FROM DUAL',
      );
      expect(mockOracleService.closeConnection).toHaveBeenCalledWith(
        mockOracleConnection,
      );
    });

    it('should return down status when Oracle pool is not initialized', async () => {
      // Arrange
      mockOracleService.isPoolInitialized.mockReturnValue(false);

      // Act
      const result = await (service as any).checkOracle();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Oracle connection pool is not initialized',
      });
      expect(mockOracleService.getConnection).not.toHaveBeenCalled();
    });

    it('should return down status when Oracle query fails', async () => {
      // Arrange
      const oracleError = new Error('Oracle connection timeout');
      mockOracleService.isPoolInitialized.mockReturnValue(true);
      mockOracleService.getConnection.mockRejectedValue(oracleError);

      // Act
      const result = await (service as any).checkOracle();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Oracle health check failed: Oracle connection timeout',
        error: 'Oracle connection timeout',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking Oracle health',
        oracleError,
      );
    });

    it('should return down status when Oracle query returns unexpected result', async () => {
      // Arrange
      mockOracleService.isPoolInitialized.mockReturnValue(true);
      mockOracleService.getConnection.mockResolvedValue(mockOracleConnection);
      mockOracleConnection.execute.mockResolvedValue({
        rows: [],
      });

      // Act
      const result = await (service as any).checkOracle();

      // Assert
      expect(result).toEqual({
        status: 'down',
        isConnected: false,
        message: 'Oracle query returned unexpected result',
      });
      expect(mockOracleService.closeConnection).toHaveBeenCalledWith(
        mockOracleConnection,
      );
    });

    it('should handle Oracle connection configuration with null values', async () => {
      // Arrange
      const moduleWithNullOracleConfig: TestingModule =
        await Test.createTestingModule({
          providers: [
            HealthService,
            {
              provide: 'SQL_CONNECTION',
              useValue: mockConnectionPool,
            },
            {
              provide: config.KEY,
              useValue: {
                SERVICE_NAME: 'test-service',
                CONNECTION_MSSQL: mockConfigService.CONNECTION_MSSQL,
                CONNECTION_ORACLE: {
                  DB_USERNAME: null,
                  DB_PASSWORD: 'oracle_pass',
                  DB_CONNECTSTRING: null,
                },
                POOL: {
                  DB_POOL_ALIAS: 'test-pool',
                },
              },
            },
            {
              provide: Logger20Service,
              useValue: mockLogger20Service,
            },
            {
              provide: OracleService,
              useValue: mockOracleService,
            },
          ],
        }).compile();

      const serviceWithNullOracleConfig =
        moduleWithNullOracleConfig.get<HealthService>(HealthService);
      mockOracleService.isPoolInitialized.mockReturnValue(true);
      mockOracleService.getConnection.mockResolvedValue(mockOracleConnection);
      mockOracleConnection.execute.mockResolvedValue({
        rows: [[1]],
      });

      // Act
      const result = await (serviceWithNullOracleConfig as any).checkOracle();

      // Assert
      expect(result.status).toBe('up');
      expect(result.isConnected).toBe(true);
      expect(result.message).toBe(
        'Oracle database is connected and responsive',
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle error without message property', async () => {
      // Arrange
      const errorWithoutMessage = { code: 'ECONNREFUSED' };
      mockRequest.query.mockRejectedValue(errorWithoutMessage);

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result.message).toContain(
        'Database health check failed: undefined',
      );
    });

    it('should handle string error instead of Error object', async () => {
      // Arrange
      mockRequest.query.mockRejectedValue('String error message');

      // Act
      const result = await (service as any).checkMssql();

      // Assert
      expect(result.message).toContain(
        'Database health check failed: undefined',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should properly integrate all components in successful scenario', async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });
      mockOracleService.isPoolInitialized.mockReturnValue(true);
      mockOracleService.getConnection.mockResolvedValue(mockOracleConnection);
      mockOracleConnection.execute.mockResolvedValue({
        rows: [[1]],
      });

      // Act
      const result = await service.check();

      // Assert
      expect(mockConnectionPool.request).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT 1 as test');
      expect(result.httpCode).toBe(HttpStatus.OK);
      expect(result.status).toBe('ok');
      expect(result.info.mssql && result.info.mssql.status).toBe('up');
      expect(result.info.oracle?.status).toBe('up');
      expect(result.error).toEqual({});
    });

    it('should properly integrate all components in failure scenario', async () => {
      // Arrange
      const dbError = new Error('Database unavailable');
      mockRequest.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.check()).rejects.toThrow(HttpException);

      try {
        await service.check();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        const response = error.getResponse();
        expect(response.status).toBe('error');
        expect(response.error.mssql.status).toBe('down');
      }

      expect(mockConnectionPool.request).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT 1 as test');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking database health',
        dbError,
      );
    });
  });
});
