import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from '@src/app/application/job.service';
import { Logger20Service } from '@src/share/domain/config/logger/logger20.service';
import { ApmService } from '@src/share/domain/config/apm/apm.service';
import { HttpService } from '@src/share/infrastructure/http/http.service';
import { LogLevel } from '@src/share/domain/config/logger/types/logger20.type';
import * as alsModule from '@src/share/domain/config/txid/als';
import * as txidUtils from '@src/share/domain/config/txid/txid.utils';
import apm from 'elastic-apm-node';

// Mock elastic-apm-node
jest.mock('elastic-apm-node');

// Mock the als and txid utils modules
jest.mock('@src/share/domain/config/txid/als');
jest.mock('@src/share/domain/config/txid/txid.utils');

describe('JobService', () => {
  let service: JobService;
  let mockLogger: jest.Mocked<Logger20Service>;
  let mockApmService: jest.Mocked<ApmService>;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockTransaction: jest.Mocked<apm.Transaction>;
  let mockProcessLogger: jest.Mocked<any>;

  const mockRunWithTx = alsModule.runWithTx as jest.MockedFunction<typeof alsModule.runWithTx>;
  const mockGenerateTxId = txidUtils.generateTxId as jest.MockedFunction<typeof txidUtils.generateTxId>;

  beforeEach(async () => {
    // Mock ProcessLogger
    mockProcessLogger = {
      endProcess: jest.fn(),
    };

    // Mock Logger20Service
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      startProcess: jest.fn().mockReturnValue(mockProcessLogger),
    } as any;

    // Mock ApmService
    mockApmService = {
      isStarted: jest.fn(),
      startTransaction: jest.fn(),
      captureError: jest.fn(),
    } as any;

    // Mock HttpService
    mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Mock APM Transaction
    mockTransaction = {
      end: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: ApmService,
          useValue: mockApmService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);

    // Setup default mocks
    mockGenerateTxId.mockReturnValue('test-tx-id-123');
    mockRunWithTx.mockImplementation(async (fn) => await fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCron', () => {
    it('should execute successfully with APM transaction', async () => {
      // Arrange
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);

      // Act
      await service.executeCron();

      // Assert
      expect(mockGenerateTxId).toHaveBeenCalledTimes(1);
      expect(mockRunWithTx).toHaveBeenCalledWith(expect.any(Function), 'test-tx-id-123');
      expect(mockApmService.isStarted).toHaveBeenCalledTimes(1);
      expect(mockApmService.startTransaction).toHaveBeenCalledWith('Cron Job');
      expect(mockLogger.startProcess).toHaveBeenCalledWith('Cron Job', {
        methodName: 'executeCron',
        request: {},
      });
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Cron Job completado exitosamente',
        { response: {} }
      );
      expect(mockTransaction.end).toHaveBeenCalledTimes(1);
    });

    it('should execute successfully without APM transaction when APM is not started', async () => {
      // Arrange
      mockApmService.isStarted.mockReturnValue(false);

      // Act
      await service.executeCron();

      // Assert
      expect(mockGenerateTxId).toHaveBeenCalledTimes(1);
      expect(mockRunWithTx).toHaveBeenCalledWith(expect.any(Function), 'test-tx-id-123');
      expect(mockApmService.isStarted).toHaveBeenCalledTimes(1);
      expect(mockApmService.startTransaction).not.toHaveBeenCalled();
      expect(mockLogger.startProcess).toHaveBeenCalledWith('Cron Job', {
        methodName: 'executeCron',
        request: {},
      });
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Cron Job completado exitosamente',
        { response: {} }
      );
    });

    it('should handle errors and capture them in APM', async () => {
      // Arrange
      const testError = new Error('Test error');
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);
      
      // Mock performTask to throw error
      jest.spyOn(service as any, 'performTask').mockRejectedValue(testError);

      // Act
      await service.executeCron();

      // Assert
      expect(mockGenerateTxId).toHaveBeenCalledTimes(1);
      expect(mockRunWithTx).toHaveBeenCalledWith(expect.any(Function), 'test-tx-id-123');
      expect(mockApmService.captureError).toHaveBeenCalledWith(testError);
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Error en Cron Job',
        { message: 'Error: Test error' },
        LogLevel.ERROR
      );
      expect(mockTransaction.end).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const testError = 'String error';
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);
      
      // Mock performTask to throw string error
      jest.spyOn(service as any, 'performTask').mockRejectedValue(testError);

      // Act
      await service.executeCron();

      // Assert
      expect(mockApmService.captureError).toHaveBeenCalledWith(testError);
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Error en Cron Job',
        { message: 'Error: String error' },
        LogLevel.ERROR
      );
      expect(mockTransaction.end).toHaveBeenCalledTimes(1);
    });

    it('should ensure transaction is ended even if error occurs', async () => {
      // Arrange
      const testError = new Error('Test error');
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);
      
      // Mock performTask to throw error
      jest.spyOn(service as any, 'performTask').mockRejectedValue(testError);

      // Act
      await service.executeCron();

      // Assert
      expect(mockTransaction.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('performTask', () => {
    it('should execute debug log', async () => {
      // Act
      await (service as any).performTask();

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith('Ejecutando tarea personalizada...');
    });

    it('should handle case when debug method is not available', async () => {
      // Arrange
      mockLogger.debug = undefined as any;

      // Act & Assert
      await expect((service as any).performTask()).resolves.not.toThrow();
    });
  });

  describe('Integration with ALS and TxId', () => {
    it('should call runWithTx with generated transaction ID', async () => {
      // Arrange
      const testTxId = 'integration-test-tx-id';
      mockGenerateTxId.mockReturnValue(testTxId);

      // Act
      await service.executeCron();

      // Assert
      expect(mockGenerateTxId).toHaveBeenCalledTimes(1);
      expect(mockRunWithTx).toHaveBeenCalledWith(expect.any(Function), testTxId);
    });

    it('should execute the job logic within ALS context', async () => {
      // Arrange
      let executionContext: any = null;
      mockRunWithTx.mockImplementation(async (fn) => {
        executionContext = 'within-als-context';
        return await fn();
      });

      // Act
      await service.executeCron();

      // Assert
      expect(executionContext).toBe('within-als-context');
      expect(mockLogger.startProcess).toHaveBeenCalled();
    });
  });

  describe('Error scenarios', () => {
    it('should handle performTask throwing undefined', async () => {
      // Arrange
      jest.spyOn(service as any, 'performTask').mockRejectedValue(undefined);
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);

      // Act
      await service.executeCron();

      // Assert
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Error en Cron Job',
        { message: 'Error: undefined' },
        LogLevel.ERROR
      );
    });

    it('should handle performTask throwing null', async () => {
      // Arrange
      jest.spyOn(service as any, 'performTask').mockRejectedValue(null);
      mockApmService.isStarted.mockReturnValue(true);
      mockApmService.startTransaction.mockReturnValue(mockTransaction);

      // Act
      await service.executeCron();

      // Assert
      expect(mockProcessLogger.endProcess).toHaveBeenCalledWith(
        'Error en Cron Job',
        { message: 'Error: null' },
        LogLevel.ERROR
      );
    });
  });
});