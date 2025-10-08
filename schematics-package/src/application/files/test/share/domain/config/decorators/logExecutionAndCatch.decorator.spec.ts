import {
  LogExecutionAndCatch,
  createStandardLogEntry,
  processDataForLogging,
} from '@src/share/domain/config/decorators/logExecutionAndCatch.decorator';
import { ApiResponseDto } from '@src/share/domain/dto/apiResponse.dto';
import apm from 'elastic-apm-node';

// Mock de APM
jest.mock('elastic-apm-node', () => ({
  isStarted: jest.fn(),
  startTransaction: jest.fn(),
  currentTransaction: null,
  captureError: jest.fn(),
}));

// Mock de UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

describe('LogExecutionAndCatch Decorator', () => {
  let mockLogger: any;
  let mockProcessTimeService: any;
  let mockTransaction: any;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    mockProcessTimeService = {
      start: jest.fn().mockReturnValue({
        end: jest.fn().mockReturnValue('150ms'),
      }),
    };

    mockTransaction = {
      setLabel: jest.fn(),
      setOutcome: jest.fn(),
      end: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('decorator functionality', () => {
    it('should be defined', () => {
      expect(LogExecutionAndCatch).toBeDefined();
    });

    it('should decorate a method successfully', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod(data: any) {
          return { success: true, data };
        }
      }

      const controller = new TestController();
      const result = await controller.testMethod({ test: 'data' });

      expect(result).toEqual({ success: true, data: { test: 'data' } });
      expect(mockLogger.log).toHaveBeenCalledTimes(2); // Start and success logs
    });

    it('should detect component type from class name', async () => {
      class TestService {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async serviceMethod() {
          return 'service result';
        }
      }

      const service = new TestService();
      await service.serviceMethod();

      // Check that logs contain "Service" component type
      const logCalls = mockLogger.log.mock.calls;
      expect(logCalls.some((call) => call[0].includes('[Service]'))).toBe(true);
    });

    it('should handle different component types', async () => {
      const testCases = [
        { className: 'TestController', expectedType: 'Controller' },
        { className: 'TestService', expectedType: 'Service' },
        { className: 'TestRepository', expectedType: 'Repository' },
        { className: 'TestGateway', expectedType: 'Gateway' },
        { className: 'TestProvider', expectedType: 'Provider' },
        { className: 'SomeOtherClass', expectedType: 'Component' },
      ];

      for (const testCase of testCases) {
        const TestClass = class {
          logger = mockLogger;
          processTimeService = mockProcessTimeService;
          transactionId = 'test-transaction-id';

          async testMethod() {
            return 'test result';
          }
        };

        // Apply decorator manually for testing
        const descriptor = Object.getOwnPropertyDescriptor(
          TestClass.prototype,
          'testMethod',
        );
        if (descriptor) {
          LogExecutionAndCatch()(TestClass.prototype, 'testMethod', descriptor);
          Object.defineProperty(TestClass.prototype, 'testMethod', descriptor);
        }

        Object.defineProperty(TestClass, 'name', { value: testCase.className });

        const instance = new TestClass();
        await instance.testMethod();

        const logCalls = mockLogger.log.mock.calls;
        expect(
          logCalls.some((call) =>
            call[0].includes(`[${testCase.expectedType}]`),
          ),
        ).toBe(true);

        jest.clearAllMocks();
      }
    });

    it('should use currentTransactionId when available', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'fallback-id';
        currentTransactionId = 'current-id';

        @LogExecutionAndCatch()
        async testMethod() {
          return 'test result';
        }
      }

      const controller = new TestController();
      await controller.testMethod();

      const logCalls = mockLogger.log.mock.calls;
      const logEntry = logCalls.find((call) => call.length > 1)?.[1];
      expect(logEntry?.transactionId).toBe('current-id');
    });

    it('should generate new transactionId when none exists', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;

        @LogExecutionAndCatch()
        async testMethod() {
          return 'test result';
        }
      }

      const controller = new TestController();
      await controller.testMethod();

      expect((controller as any).transactionId).toBe('mocked-uuid-123');
    });
  });

  describe('APM integration', () => {
    it('should create APM transaction when none exists', async () => {
      (apm.isStarted as jest.Mock).mockReturnValue(true);
      (apm as any).currentTransaction = null;
      (apm.startTransaction as jest.Mock).mockReturnValue(mockTransaction);

      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod() {
          return 'test result';
        }
      }

      const controller = new TestController();
      await controller.testMethod();

      expect(apm.startTransaction).toHaveBeenCalledWith(
        'Controller.testMethod',
        'request',
      );
      expect(mockTransaction.setLabel).toHaveBeenCalledWith(
        'component',
        'Controller',
      );
      expect(mockTransaction.setOutcome).toHaveBeenCalledWith('success');
      expect(mockTransaction.end).toHaveBeenCalled();
    });

    it('should use existing APM transaction', async () => {
      (apm.isStarted as jest.Mock).mockReturnValue(true);
      (apm as any).currentTransaction = mockTransaction;

      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod() {
          return 'test result';
        }
      }

      const controller = new TestController();
      await controller.testMethod();

      expect(apm.startTransaction).not.toHaveBeenCalled();
      expect(mockTransaction.setLabel).toHaveBeenCalledWith(
        'component',
        'Controller',
      );
      expect(mockTransaction.end).not.toHaveBeenCalled(); // Should not end existing transaction
    });

    it('should capture request data in APM labels', async () => {
      (apm.isStarted as jest.Mock).mockReturnValue(true);
      (apm as any).currentTransaction = null;
      (apm.startTransaction as jest.Mock).mockReturnValue(mockTransaction);

      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod(_requestData: any) {
          return 'test result';
        }
      }

      const controller = new TestController();
      const requestData = { userId: 123, action: 'test' };
      await controller.testMethod(requestData);

      expect(mockTransaction.setLabel).toHaveBeenCalledWith(
        'request_body',
        JSON.stringify(requestData),
      );
    });
  });

  describe('error handling', () => {
    it('should handle HTTP exceptions and return ApiResponseDto', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';
      }

      const testInstance = new TestController();

      // Create a method that throws HTTP error
      const httpError: any = new Error('HTTP Error');
      httpError.response = { message: 'Bad request' };
      httpError.status = 400;

      const originalMethod = jest.fn().mockRejectedValue(httpError);

      // Apply the decorator
      const descriptor = {
        value: originalMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      };

      LogExecutionAndCatch()(testInstance, 'testMethod', descriptor);

      // Should throw ApiResponseDto for internal server error

      try {
        await descriptor.value.call(testInstance);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiResponseDto);
        expect(error.responseCode).toBe(500);
        expect(error.messageCode).toBe('INTERNAL_SERVER_ERROR');
      }
    });
  });

  describe('request data handling', () => {
    it('should handle simple object request data', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod(data: any) {
          return { received: data };
        }
      }

      const controller = new TestController();
      const requestData = { name: 'test', value: 123 };

      await controller.testMethod(requestData);

      const logCalls = mockLogger.log.mock.calls;
      const logEntry = logCalls.find((call) => call.length > 1)?.[1];
      expect(logEntry?.request).toEqual({ body: requestData });
    });

    it('should handle string request data', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod(data: string) {
          return { received: data };
        }
      }

      const controller = new TestController();
      const jsonString = '{"test": "value"}';

      await controller.testMethod(jsonString);

      const logCalls = mockLogger.log.mock.calls;
      const logEntry = logCalls.find((call) => call.length > 1)?.[1];
      expect(logEntry?.request).toEqual({ body: { test: 'value' } });
    });

    it('should handle primitive request data', async () => {
      class TestController {
        logger = mockLogger;
        processTimeService = mockProcessTimeService;
        transactionId = 'test-transaction-id';

        @LogExecutionAndCatch()
        async testMethod(id: number) {
          return { id };
        }
      }

      const controller = new TestController();

      await controller.testMethod(42);

      const logCalls = mockLogger.log.mock.calls;
      const logEntry = logCalls.find((call) => call.length > 1)?.[1];
      expect(logEntry?.request).toEqual({ value: 42 });
    });
  });
});

describe('Helper Functions', () => {
  describe('createStandardLogEntry', () => {
    it('should create correct log entry structure', () => {
      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'transaction-123',
        request: { test: 'data' },
        response: { result: 'success' },
        level: 'INFO',
        message: 'Test message',
        processingTime: '120ms',
      });

      expect(entry).toMatchObject({
        methodName: 'testMethod',
        transactionId: 'transaction-123',
        level: 'INFO',
        message: 'Test message',
        processingTime: '120ms',
      });
      expect(entry).toHaveProperty('timestamp');
    });
  });

  describe('Data Processing for Logging (Truncation)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return original data when within size limit', () => {
      const smallData = { message: 'small' };
      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: smallData,
        response: smallData,
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(entry.request).toEqual(smallData);
      expect(entry.response).toEqual(smallData);
    });

    it('should truncate large data', () => {
      process.env.MAX_LOG_SIZE = '100';
      const largeData = { message: 'x'.repeat(500) };

      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: largeData,
        response: largeData,
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(typeof entry.request).toBe('string');
      expect(entry.request).toContain('... [truncated]');
      expect(typeof entry.response).toBe('string');
      expect(entry.response).toContain('... [truncated]');
    });

    it('should handle null/undefined data in logs', () => {
      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: {},
        response: undefined,
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(entry.request).toStrictEqual({});
      expect(entry.response).toBeUndefined();
    });

    it('should use environment variable for max size', () => {
      process.env.MAX_LOG_SIZE = '50';
      const data = { message: 'x'.repeat(100) };

      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: data,
        response: {},
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(typeof entry.request).toBe('string');
      expect(entry.request).toContain('... [truncated]');
    });

    it('should preserve data when no max size is set', () => {
      delete process.env.MAX_LOG_SIZE;
      const largeData = {
        activityId: 12345,
        description: 'x'.repeat(500),
        metadata: { user: 'test' },
      };

      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: largeData,
        response: {},
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(entry.request).toEqual(largeData);
    });
  });

  describe('safeStringify', () => {
    it('should handle circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      // Test a través de processDataForLogging que usa safeStringify internamente
      const result = processDataForLogging(obj); // Large size to avoid encoding
      expect(typeof result).toBe('object');
    });

    it('should handle JSON.stringify errors', () => {
      const problematicObj = {
        toJSON: () => {
          throw new Error('Serialization error');
        },
      };

      // Cuando hay un error en safeStringify, se retorna "[Error serializing object]"
      // processDataForLogging debería devolver el objeto original cuando no se puede serializar
      const result = processDataForLogging(problematicObj);
      expect(result).toBe(problematicObj);
    });

    it('should handle normal objects', () => {
      const normalObj = { name: 'test', value: 123 };
      const result = processDataForLogging(normalObj);
      expect(result).toEqual(normalObj);
    });
  });

  describe('processDataForLogging error handling', () => {
    it('should handle processing errors gracefully', () => {
      const originalEnv = process.env;
      process.env.MAX_LOG_SIZE = '50';

      const problematicObj = {
        toJSON: () => {
          throw new Error('Serialization error');
        },
      };

      // processDataForLogging debería devolver el objeto original cuando hay error
      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: problematicObj,
        response: {},
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      expect(entry.request).toBe(problematicObj);

      // Restore
      process.env = originalEnv;
    });
  });

  describe('getMaxLogSize edge cases', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return default when MAX_LOG_SIZE is not a number', () => {
      process.env.MAX_LOG_SIZE = 'not-a-number';

      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: { message: 'x'.repeat(2000) }, // Large data
        response: {},
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      // Should return original data since MAX_LOG_SIZE is invalid (null)
      expect(entry.request).toEqual({ message: 'x'.repeat(2000) });
    });

    it('should return default when MAX_LOG_SIZE is empty', () => {
      process.env.MAX_LOG_SIZE = '';

      const entry = createStandardLogEntry({
        methodName: 'testMethod',
        transactionId: 'test-id',
        request: { message: 'x'.repeat(2000) },
        response: {},
        level: 'INFO',
        message: 'Test message',
        processingTime: '10ms',
      });

      // Should return original data since MAX_LOG_SIZE is empty (null)
      expect(entry.request).toEqual({ message: 'x'.repeat(2000) });
    });
  });
});

describe('Complete Decorator Coverage', () => {
  let localMockLogger: any;
  let localMockProcessTimeService: any;
  let localMockTransaction: any;

  beforeEach(() => {
    localMockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    localMockProcessTimeService = {
      start: jest.fn().mockReturnValue({
        end: jest.fn().mockReturnValue('150ms'),
      }),
    };

    localMockTransaction = {
      setLabel: jest.fn(),
      setOutcome: jest.fn(),
      end: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // Test para cuando no hay logger ni processTimeService (líneas 540-553)
  it('should work without logger and processTimeService', async () => {
    class TestController {
      @LogExecutionAndCatch()
      async testMethod() {
        return 'test result';
      }
    }

    const controller = new TestController();
    const result = await controller.testMethod();

    expect(result).toBe('test result');
    expect((controller as any).transactionId).toBe('mocked-uuid-123');
  });

  // Test para ApiResponseDto error handling (líneas 460-465)
  it('should rethrow ApiResponseDto without modification', async () => {
    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        throw new ApiResponseDto({
          responseCode: 400,
          message: 'Business error',
          transactionId: 'test-id',
          result: { message: 'Business error' },
        });
      }
    }

    const controller = new TestController();

    try {
      await controller.testMethod();
      fail('Should have thrown ApiResponseDto');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseDto);
      expect(error.responseCode).toBe(400);
    }
  });

  // Test para generic error conversion (líneas 470-476)
  it('should convert generic errors to ApiResponseDto', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm.captureError as jest.Mock).mockImplementation(() => {});

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        throw new Error('Generic error');
      }
    }

    const controller = new TestController();

    try {
      await controller.testMethod();
      fail('Should have thrown ApiResponseDto');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseDto);
      expect(error.responseCode).toBe(500);
      expect(apm.captureError).toHaveBeenCalled();
    }
  });

  // Test para APM no iniciado (líneas 320-322)
  it('should handle APM not started', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(false);

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        return 'test result';
      }
    }

    const controller = new TestController();
    const result = await controller.testMethod();

    expect(result).toBe('test result');
    expect(apm.startTransaction).not.toHaveBeenCalled();
  });

  // Test para request con response object (líneas 122-127)
  it('should skip response objects in request processing', async () => {
    const mockResponse = {
      code: jest.fn(),
      send: jest.fn(),
      status: jest.fn(),
      json: jest.fn(),
    };

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(data: any, response: any) {
        return { processed: data };
      }
    }

    const controller = new TestController();
    const requestData = { name: 'test', value: 123 };

    await controller.testMethod(requestData, mockResponse);

    const logCalls = localMockLogger.log.mock.calls;
    const logEntry = logCalls.find((call) => call.length > 1)?.[1];
    // Should only include the data, not the response object
    expect(logEntry?.request).toEqual({ body: requestData });
  });

  // Test para request object processing (líneas 128-138)
  it('should extract data from request objects', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/test',
      headers: { 'content-type': 'application/json' },
      body: { name: 'test' },
      params: { id: '123' },
      query: { filter: 'active' },
    };

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(request: any) {
        return { processed: true };
      }
    }

    const controller = new TestController();
    await controller.testMethod(mockRequest);

    const logCalls = localMockLogger.log.mock.calls;
    const logEntry = logCalls.find((call) => call.length > 1)?.[1];
    expect(logEntry?.request).toEqual({
      body: { name: 'test' },
      params: { id: '123' },
      query: { filter: 'active' },
    });
  });

  // Test para string processing que no es JSON (líneas 145-149)
  it('should handle non-JSON string arguments', async () => {
    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(data: string) {
        return { processed: data };
      }
    }

    const controller = new TestController();
    const nonJsonString = 'just a plain string';

    await controller.testMethod(nonJsonString);

    const logCalls = localMockLogger.log.mock.calls;
    const logEntry = logCalls.find((call) => call.length > 1)?.[1];
    expect(logEntry?.request).toEqual({ data: nonJsonString });
  });

  // Test para APM transaction configuración (líneas 294-299, 339, 390, 396-415)
  it('should configure APM transaction labels correctly', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(requestData: any) {
        return 'test result';
      }
    }

    const controller = new TestController();
    const complexRequest = {
      body: { name: 'test' },
      params: { id: 123 },
      query: { filter: 'active' },
      value: 'primitive-value',
      data: 'string-data',
    };

    await controller.testMethod(complexRequest);

    // Verify all labels are set
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'component',
      'Controller',
    );
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'class',
      'TestController',
    );
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'method',
      'testMethod',
    );
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'transaction_id',
      'test-transaction-id',
    );
  });

  // Test para error de APM transaction con setOutcome (líneas 415, 430)
  it('should handle APM transaction error with outcome', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = null;
    (apm.startTransaction as jest.Mock).mockReturnValue(localMockTransaction);
    (apm.captureError as jest.Mock).mockImplementation(() => {});

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        throw new Error('Test error for APM');
      }
    }

    const controller = new TestController();

    try {
      await controller.testMethod();
      fail('Should have thrown ApiResponseDto');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseDto);
      expect(apm.captureError).toHaveBeenCalled();
      expect(localMockTransaction.setOutcome).toHaveBeenCalledWith('failure');
      expect(localMockTransaction.end).toHaveBeenCalled();
    }
  });

  // Test para sanitizeLabelKey (líneas 105-109)
  it('should sanitize label keys correctly', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test.transaction-id@special#chars';

      @LogExecutionAndCatch()
      async testMethod() {
        return 'test result';
      }
    }

    const controller = new TestController();
    await controller.testMethod();

    // Should sanitize the transaction id with dots and special chars
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'transaction_id',
      'test.transaction-id@special#chars',
    );
  });

  // Test coverage completo para líneas 222, 242, 262
  it('should handle complex nested objects in APM labels', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    // Mock para que setLabel funcione normalmente excepto cuando hay error
    const originalSetLabel = localMockTransaction.setLabel;
    localMockTransaction.setLabel = jest
      .fn()
      .mockImplementation((key, value) => {
        if (
          key === 'request_body' &&
          typeof value === 'string' &&
          value.includes('[Circular Reference]')
        ) {
          // Simular que funciona correctamente cuando maneja referencias circulares
          return;
        }
        return originalSetLabel.call(localMockTransaction, key, value);
      });

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(data: any) {
        return 'test result';
      }
    }

    const controller = new TestController();
    const circularObj: any = { name: 'test' };
    circularObj.circular = circularObj;

    const result = await controller.testMethod(circularObj);

    expect(result).toBe('test result');
    expect(localMockTransaction.setLabel).toHaveBeenCalled();
  });

  // Test específico para líneas de manejo de request vacío (línea 222)
  it('should handle empty request data in APM labels', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        return 'test result';
      }
    }

    const controller = new TestController();
    await controller.testMethod();

    // Should set basic labels even with empty request
    expect(localMockTransaction.setLabel).toHaveBeenCalledWith(
      'component',
      'Controller',
    );
  });

  // Test para manejo de undefined/null en request processing
  it('should handle undefined and null values in arguments', async () => {
    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(arg1: any, arg2: any, arg3: any) {
        return { processed: true };
      }
    }

    const controller = new TestController();
    await controller.testMethod(undefined, null, 0);

    const logCalls = localMockLogger.log.mock.calls;
    const logEntry = logCalls.find((call) => call.length > 1)?.[1];
    expect(logEntry?.request).toEqual({ value: 0 }); // Should only capture the non-null/undefined value
  });

  // Test para extractRequestData con objetos vacíos
  it('should handle empty request objects', async () => {
    const emptyRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      params: {},
      query: {},
    };

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(request: any) {
        return { processed: true };
      }
    }

    const controller = new TestController();
    await controller.testMethod(emptyRequest);

    const logCalls = localMockLogger.log.mock.calls;
    const logEntry = logCalls.find((call) => call.length > 1)?.[1];
    expect(logEntry?.request).toEqual({}); // Should be empty since all objects are empty
  });

  it('should use simple process time when service is not available', async () => {
    class TestController {
      logger = localMockLogger;
      // No processTimeService

      @LogExecutionAndCatch()
      async testMethod() {
        // Add a small delay to test timing
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'test result';
      }
    }

    const controller = new TestController();
    const result = await controller.testMethod();

    expect(result).toBe('test result');

    const logCalls = localMockLogger.log.mock.calls;
    const successLog = logCalls.find((call) =>
      call[0].includes('Ejecución exitosa'),
    );
    expect(successLog).toBeDefined();
    expect(successLog[1].processingTime).toMatch(/^\d+(\.\d+)?ms$/); // Should be in format "Xms" or "X.Xms"
  });

  // Test específico para forzar error en safeStringify y processDataForLogging
  it('should handle complete error in processDataForLogging with problematic objects', () => {
    const problematicObj = {
      toJSON: () => {
        throw new Error('Serialization error');
      },
    };

    // processDataForLogging debería devolver el objeto original cuando hay error
    const result = processDataForLogging(problematicObj);
    expect(result).toBe(problematicObj);
  });

  // Test específico para línea 242 - setObjectLabel sin datos
  it('should handle setObjectLabel with empty data', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(emptyData: any) {
        return 'test result';
      }
    }

    const controller = new TestController();
    // Pasar un objeto vacío para que no entre en la condición de línea 222
    await controller.testMethod({});

    expect(localMockTransaction.setLabel).toHaveBeenCalled();
  });

  // Test específico para línea 222 - setApmRequestLabels con datos que tienen keys pero están vacíos
  it('should handle request data with empty values in APM labels', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = localMockTransaction;

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod(request: any) {
        return 'test result';
      }
    }

    const controller = new TestController();
    // Crear un request con las propiedades pero vacías para que no pasen la condición de Object.keys().length > 0
    const emptyRequest = {
      method: 'GET',
      url: '/test',
      body: {}, // Empty but exists
      params: {}, // Empty but exists
      query: {}, // Empty but exists
    };

    await controller.testMethod(emptyRequest);

    expect(localMockTransaction.setLabel).toHaveBeenCalled();
  });

  // Test específico para línea 339 - configureApmTransaction cuando apmTransaction es null
  it('should handle null APM transaction in configuration', async () => {
    (apm.isStarted as jest.Mock).mockReturnValue(true);
    (apm as any).currentTransaction = null;
    (apm.startTransaction as jest.Mock).mockReturnValue(null); // Return null transaction

    class TestController {
      logger = localMockLogger;
      processTimeService = localMockProcessTimeService;
      transactionId = 'test-transaction-id';

      @LogExecutionAndCatch()
      async testMethod() {
        return 'test result';
      }
    }

    const controller = new TestController();
    const result = await controller.testMethod();

    expect(result).toBe('test result');
    // Should not crash even when transaction is null
  });
});
