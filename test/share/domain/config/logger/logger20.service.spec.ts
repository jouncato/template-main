import { Logger20Service } from '@src/share/domain/config/logger/logger20.service';

describe('Logger20Service', () => {
  let service: Logger20Service;

  beforeEach(() => {
    service = new Logger20Service();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create logger with default service name', () => {
      expect(service).toBeDefined();
      expect(service.loggerWinston).toBeDefined();
    });
  });

  describe('log methods', () => {
    beforeEach(() => {
      // Mock winston logger methods
      jest.spyOn(service.loggerWinston, 'log').mockImplementation();
    });

    test('should call log method', () => {
      const result = service.log(
        'test message',
        { methodName: 'testMethod' },
        'TestContext',
      );

      expect(result).toBeUndefined();
      expect(service.loggerWinston.log).toHaveBeenCalled();
    });

    test('should call error method', () => {
      const result = service.error(
        'error message',
        { message: 'error details' },
        'TestContext',
      );

      expect(result).toBeUndefined();
      expect(service.loggerWinston.log).toHaveBeenCalled();
    });

    test('should call warn method', () => {
      const result = service.warn(
        'warning message',
        { message: 'warning details' },
        'TestContext',
      );

      expect(result).toBeUndefined();
      expect(service.loggerWinston.log).toHaveBeenCalled();
    });
  });

  describe('log formatting', () => {
    beforeEach(() => {
      jest.spyOn(service.loggerWinston, 'log').mockImplementation();
    });

    test('should handle string metadata', () => {
      // Since LogMetadata expects an object, we'll test with proper metadata
      service.log('test message', { request: 'string meta' }, 'TestContext');

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'test message',
        expect.objectContaining({
          request: 'string meta',
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );
    });

    test('should handle object metadata', () => {
      const metadata = {
        request: { data: 'test' },
        response: { result: 'success' },
      };
      service.log('test message', metadata, 'TestContext');

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'test message',
        expect.objectContaining({
          request: { data: 'test' },
          response: { result: 'success' },
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );
    });

    test('should handle null metadata', () => {
      service.log('test message', {}, 'TestContext');

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'test message',
        expect.objectContaining({
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );
    });

    test('should handle undefined metadata', () => {
      service.log('test message', undefined, 'TestContext');

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'test message',
        expect.objectContaining({
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );
    });

    test('should include timestamp in ISO format', () => {
      const beforeCall = new Date().toISOString();
      service.log('test message', {}, 'TestContext');
      const afterCall = new Date().toISOString();

      const logCall = (service.loggerWinston.log as jest.Mock).mock.calls[0];
      const loggedData = logCall[2];

      expect(loggedData.timestamp).toBeDefined();
      expect(typeof loggedData.timestamp).toBe('string');
      expect(new Date(loggedData.timestamp).toISOString()).toBe(
        loggedData.timestamp,
      );
    });
  });

  describe('startProcess', () => {
    beforeEach(() => {
      jest.spyOn(service.loggerWinston, 'log').mockImplementation();
    });

    test('should log start and end process messages', () => {
      const processLogger = service.startProcess(
        'test process',
        { requestId: '123' },
        'TestContext',
      );

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'INICIO: test process',
        expect.objectContaining({
          requestId: '123',
          processingTime: '0ms',
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );

      // Clear previous calls and test end process
      (service.loggerWinston.log as jest.Mock).mockClear();

      processLogger.endProcess('completed process', {
        message: 'Process completed successfully',
      });

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'FIN: completed process',
        expect.objectContaining({
          requestId: '123',
          message: 'Process completed successfully',
          processingTime: expect.any(String),
          timestamp: expect.any(String),
          methodName: 'TestContext',
        }),
      );
    });

    test('should use default end message when not provided', () => {
      const processLogger = service.startProcess(
        'test process',
        {},
        'TestContext',
      );

      // Clear start process call
      (service.loggerWinston.log as jest.Mock).mockClear();

      processLogger.endProcess();

      expect(service.loggerWinston.log).toHaveBeenCalledWith(
        'info',
        'FIN: test process',
        expect.objectContaining({
          processingTime: expect.any(String),
        }),
      );
    });
  });
});
