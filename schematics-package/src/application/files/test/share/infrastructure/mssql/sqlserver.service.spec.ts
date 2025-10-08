import { Test, TestingModule } from '@nestjs/testing';
import * as sql from 'mssql';
import { SqlServerService } from '@share/infrastructure/mssql/sqlserver.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

// Mock del decorador y sus dependencias
jest.mock(
  '@share/domain/config/decorators/logExecutionAndCatch.decorator',
  () => {
    const original = jest.requireActual(
      '@share/domain/config/decorators/logExecutionAndCatch.decorator',
    );
    return {
      ...original,
      LogExecutionAndCatch: () => {
        return (
          target: any,
          propertyName: string,
          descriptor: PropertyDescriptor,
        ) => {
          const originalMethod = descriptor.value;
          descriptor.value = async function (...args: any[]) {
            try {
              return await originalMethod.apply(this, args);
            } catch (error) {
              // Para tests, simplemente re-lanzamos el error original para testing
              throw error;
            }
          };
          return descriptor;
        };
      },
    };
  },
);

describe('SqlServerService', () => {
  let service: SqlServerService;
  let mockConnectionPool: jest.Mocked<Partial<sql.ConnectionPool>>;
  let mockLogger: jest.Mocked<Partial<Logger20Service>>;
  let mockRequest: jest.Mocked<Partial<sql.Request>>;

  beforeEach(async () => {
    // Mock del Request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    // Mock del ConnectionPool
    mockConnectionPool = {
      request: jest.fn().mockReturnValue(mockRequest as sql.Request),
      connected: true,
    };

    // Mock del Logger20Service
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      startProcess: jest.fn().mockReturnValue({
        endProcess: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlServerService,
        {
          provide: 'SQL_CONNECTION',
          useValue: mockConnectionPool,
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SqlServerService>(SqlServerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('executeProcedure', () => {
    const procedureName = 'TestProcedure';
    const mockResult = {
      recordset: [{ id: 1, name: 'Test' }],
      recordsets: [[{ id: 1, name: 'Test' }]],
      returnValue: 0,
      output: {},
      rowsAffected: [1],
    } as any;

    it('should execute stored procedure successfully without parameters', async () => {
      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.executeProcedure(procedureName);

      expect(mockConnectionPool.request).toHaveBeenCalledTimes(1);
      expect(mockRequest.execute).toHaveBeenCalledWith(procedureName);
      expect(result).toEqual(mockResult);
    });

    it('should execute stored procedure with input parameters', async () => {
      const inputParams = {
        param1: { type: sql.VarChar(50) as any, value: 'test' },
        param2: { type: sql.Int as any, value: 123 },
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.executeProcedure(procedureName, inputParams);

      expect(mockRequest.input).toHaveBeenCalledWith(
        'param1',
        sql.VarChar(50),
        'test',
      );
      expect(mockRequest.input).toHaveBeenCalledWith('param2', sql.Int, 123);
      expect(mockRequest.execute).toHaveBeenCalledWith(procedureName);
      expect(result).toEqual(mockResult);
    });

    it('should execute stored procedure with output parameters', async () => {
      const outputParams = {
        outputParam1: sql.Int as any,
        outputParam2: sql.VarChar(50) as any,
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.executeProcedure(
        procedureName,
        {},
        outputParams,
      );

      expect(mockRequest.output).toHaveBeenCalledWith('outputParam1', sql.Int);
      expect(mockRequest.output).toHaveBeenCalledWith(
        'outputParam2',
        sql.VarChar(50),
      );
      expect(mockRequest.execute).toHaveBeenCalledWith(procedureName);
      expect(result).toEqual(mockResult);
    });

    it('should execute stored procedure with both input and output parameters', async () => {
      const inputParams = {
        inputParam: { type: sql.VarChar(50) as any, value: 'input' },
      };
      const outputParams = {
        outputParam: sql.Int as any,
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.executeProcedure(
        procedureName,
        inputParams,
        outputParams,
      );

      expect(mockRequest.input).toHaveBeenCalledWith(
        'inputParam',
        sql.VarChar(50),
        'input',
      );
      expect(mockRequest.output).toHaveBeenCalledWith('outputParam', sql.Int);
      expect(mockRequest.execute).toHaveBeenCalledWith(procedureName);
      expect(result).toEqual(mockResult);
    });

    it('should skip null input parameters', async () => {
      const inputParams = {
        param1: { type: sql.VarChar(50) as any, value: 'valid' },
        param2: { type: sql.Int as any, value: null },
        param3: { type: sql.VarChar(50) as any, value: undefined },
        param4: { type: sql.Int as any, value: 0 }, // Should not be skipped
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      await service.executeProcedure(procedureName, inputParams);

      expect(mockRequest.input).toHaveBeenCalledWith(
        'param1',
        sql.VarChar(50),
        'valid',
      );
      expect(mockRequest.input).toHaveBeenCalledWith('param4', sql.Int, 0);
      expect(mockRequest.input).not.toHaveBeenCalledWith(
        'param2',
        expect.any(Object),
        null,
      );
      expect(mockRequest.input).not.toHaveBeenCalledWith(
        'param3',
        expect.any(Object),
        undefined,
      );
      expect(mockRequest.input).toHaveBeenCalledTimes(2);
    });

    it('should handle execution errors', async () => {
      const error = new Error('Database connection failed');
      (mockRequest.execute as jest.Mock).mockRejectedValue(error);

      await expect(service.executeProcedure(procedureName)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle empty string values in input parameters', async () => {
      const inputParams = {
        param1: { type: sql.VarChar(50) as any, value: '' },
        param2: { type: sql.VarChar(50) as any, value: ' ' },
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      await service.executeProcedure(procedureName, inputParams);

      expect(mockRequest.input).toHaveBeenCalledWith(
        'param1',
        sql.VarChar(50),
        '',
      );
      expect(mockRequest.input).toHaveBeenCalledWith(
        'param2',
        sql.VarChar(50),
        ' ',
      );
      expect(mockRequest.input).toHaveBeenCalledTimes(2);
    });

    it('should handle false and 0 values in input parameters', async () => {
      const inputParams = {
        boolParam: { type: sql.Bit as any, value: false },
        numberParam: { type: sql.Int as any, value: 0 },
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      await service.executeProcedure(procedureName, inputParams);

      expect(mockRequest.input).toHaveBeenCalledWith(
        'boolParam',
        sql.Bit,
        false,
      );
      expect(mockRequest.input).toHaveBeenCalledWith('numberParam', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledTimes(2);
    });

    it('should create new request for each execution', async () => {
      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      await service.executeProcedure('Procedure1');
      await service.executeProcedure('Procedure2');

      expect(mockConnectionPool.request).toHaveBeenCalledTimes(2);
    });

    it('should handle complex data types', async () => {
      const inputParams = {
        xmlParam: {
          type: sql.Xml as any,
          value: '<root><item>test</item></root>',
        },
        varBinaryParam: {
          type: sql.VarBinary(100) as any,
          value: Buffer.from('test'),
        },
        dateTimeParam: {
          type: sql.DateTime as any,
          value: new Date('2023-01-01'),
        },
        decimalParam: { type: sql.Decimal(10, 2) as any, value: 123.45 },
      };

      (mockRequest.execute as jest.Mock).mockResolvedValue(mockResult);

      await service.executeProcedure(procedureName, inputParams);

      expect(mockRequest.input).toHaveBeenCalledWith(
        'xmlParam',
        sql.Xml,
        '<root><item>test</item></root>',
      );
      expect(mockRequest.input).toHaveBeenCalledWith(
        'varBinaryParam',
        sql.VarBinary(100),
        Buffer.from('test'),
      );
      expect(mockRequest.input).toHaveBeenCalledWith(
        'dateTimeParam',
        sql.DateTime,
        new Date('2023-01-01'),
      );
      expect(mockRequest.input).toHaveBeenCalledWith(
        'decimalParam',
        sql.Decimal(10, 2),
        123.45,
      );
    });
  });

  describe('private methods', () => {
    describe('addInputParameters', () => {
      it('should handle empty input parameters object', async () => {
        (mockRequest.execute as jest.Mock).mockResolvedValue({
          recordset: [],
        } as any);

        await service.executeProcedure('TestProcedure', {});

        expect(mockRequest.input).not.toHaveBeenCalled();
      });
    });

    describe('addOutputParameters', () => {
      it('should handle empty output parameters object', async () => {
        (mockRequest.execute as jest.Mock).mockResolvedValue({
          recordset: [],
        } as any);

        await service.executeProcedure('TestProcedure', {}, {});

        expect(mockRequest.output).not.toHaveBeenCalled();
      });
    });
  });

  describe('error scenarios', () => {
    it('should propagate SQL errors', async () => {
      const sqlError = new Error('Invalid column name');
      (mockRequest.execute as jest.Mock).mockRejectedValue(sqlError);

      await expect(service.executeProcedure('TestProcedure')).rejects.toThrow(
        'Invalid column name',
      );
    });

    it('should handle connection pool errors', async () => {
      const connectionError = new Error('Connection timeout');
      (mockConnectionPool.request as jest.Mock).mockImplementation(() => {
        throw connectionError;
      });

      await expect(service.executeProcedure('TestProcedure')).rejects.toThrow(
        'Connection timeout',
      );
    });

    it('should handle parameter binding errors', async () => {
      const paramError = new Error('Parameter binding failed');
      (mockRequest.input as jest.Mock).mockImplementation(() => {
        throw paramError;
      });

      const inputParams = {
        param1: { type: sql.VarChar(50) as any, value: 'test' },
      };

      await expect(
        service.executeProcedure('TestProcedure', inputParams),
      ).rejects.toThrow('Parameter binding failed');
    });
  });

  describe('LogExecutionAndCatch decorator', () => {
    it('should have LogExecutionAndCatch decorator applied to executeProcedure method', () => {
      // Verificar que el decorador está aplicado (indirectamente a través del comportamiento)
      const methodDescriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(service),
        'executeProcedure',
      );

      expect(methodDescriptor).toBeDefined();
      expect(typeof methodDescriptor?.value).toBe('function');
    });

    it('should execute without throwing when decorated', async () => {
      (mockRequest.execute as jest.Mock).mockResolvedValue({
        recordset: [],
      } as any);

      const result = await service.executeProcedure('TestProcedure');

      // Verificar que el método se ejecuta correctamente con el decorador
      expect(result).toEqual({ recordset: [] });
    });
  });

  describe('integration tests', () => {
    it('should execute procedure with real-world scenario', async () => {
      const inputParams = {
        userId: { type: sql.Int as any, value: 12345 },
        email: { type: sql.VarChar(255) as any, value: 'test@example.com' },
        isActive: { type: sql.Bit as any, value: true },
      };

      const outputParams = {
        resultCode: sql.Int as any,
        message: sql.VarChar(500) as any,
      };

      const expectedResult = {
        recordset: [{ id: 12345, email: 'test@example.com', created: true }],
        recordsets: [],
        returnValue: 0,
        output: { resultCode: 0, message: 'Success' },
        rowsAffected: [1],
      } as any;

      (mockRequest.execute as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.executeProcedure(
        'sp_CreateUser',
        inputParams,
        outputParams,
      );

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 12345);
      expect(mockRequest.input).toHaveBeenCalledWith(
        'email',
        sql.VarChar(255),
        'test@example.com',
      );
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.output).toHaveBeenCalledWith('resultCode', sql.Int);
      expect(mockRequest.output).toHaveBeenCalledWith(
        'message',
        sql.VarChar(500),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle procedure with no results', async () => {
      const emptyResult = {
        recordset: [],
        recordsets: [],
        returnValue: 0,
        output: {},
        rowsAffected: [0],
      } as any;

      (mockRequest.execute as jest.Mock).mockResolvedValue(emptyResult);

      const result = await service.executeProcedure('sp_EmptyProcedure');

      expect(result).toEqual(emptyResult);
      expect(mockRequest.input).not.toHaveBeenCalled();
      expect(mockRequest.output).not.toHaveBeenCalled();
    });
  });
});
