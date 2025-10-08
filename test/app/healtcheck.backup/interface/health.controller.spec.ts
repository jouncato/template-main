import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthController } from '@src/app/healtcheck/interface/health.controller';
import { HealthService } from '@src/app/healtcheck/application/health.service';
import { ApmInterceptor } from '@src/share/domain/config/interceptors/apm.interceptor';
import { ApmService } from '@src/share/domain/config/apm/apm.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    check: jest.fn(),
  };

  const mockApmService = {
    setLabel: jest.fn(),
    captureError: jest.fn(),
    isStarted: jest.fn().mockReturnValue(false),
  };

  const mockApmInterceptor = {
    intercept: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
        {
          provide: ApmService,
          useValue: mockApmService,
        },
        {
          provide: ApmInterceptor,
          useValue: mockApmInterceptor,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return healthy status when all services are up', async () => {
      // Arrange
      const mockHealthyResponse = {
        httpCode: HttpStatus.OK,
        status: 'ok',
        info: {
          mssql: {
            status: 'up',
            isConnected: true,
            message: 'Database is connected and responsive',
            server: 'db-server.example.com',
            database: 'ContractsDB',
          },
          oracle: {
            status: 'up',
            isConnected: true,
            message: 'Oracle database is connected and responsive',
            connectString: 'oracle-server.example.com:1521/XE',
            username: 'test_user',
          },
        },
        error: {},
        details: {
          mssql: {
            status: 'up',
            isConnected: true,
            message: 'Database is connected and responsive',
            server: 'db-server.example.com',
            database: 'ContractsDB',
          },
          oracle: {
            status: 'up',
            isConnected: true,
            message: 'Oracle database is connected and responsive',
            connectString: 'oracle-server.example.com:1521/XE',
            username: 'test_user',
          },
        },
      };

      mockHealthService.check.mockResolvedValue(mockHealthyResponse);

      // Act
      const result = await controller.checkHealth();

      // Assert
      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthyResponse);
      expect(result.status).toBe('ok');
      expect(result.httpCode).toBe(HttpStatus.OK);
    });

    it('should return error status when MSSQL service is down', async () => {
      // Arrange
      const mockUnhealthyResponse = {
        httpCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'error',
        info: {},
        error: {
          mssql: {
            status: 'down',
            isConnected: false,
            message: 'Database health check failed: Connection timeout',
            error: 'Connection timeout',
          },
        },
        details: {
          mssql: {
            status: 'down',
            isConnected: false,
            message: 'Database health check failed: Connection timeout',
            error: 'Connection timeout',
          },
          oracle: {
            status: 'up',
            isConnected: true,
            message: 'Oracle database is connected and responsive',
            connectString: 'oracle-server.example.com:1521/XE',
            username: 'test_user',
          },
        },
      };

      mockHealthService.check.mockResolvedValue(mockUnhealthyResponse);

      // Act
      const result = await controller.checkHealth();

      // Assert
      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUnhealthyResponse);
      expect(result.status).toBe('error');
      expect(result.httpCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.error.mssql).toBeDefined();
      if (result.error.mssql) {
        expect(result.error.mssql.status).toBe('down');
      }
    });

    it('should return error status when Oracle service is down', async () => {
      // Arrange
      const mockUnhealthyResponse = {
        httpCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'error',
        info: {},
        error: {
          oracle: {
            status: 'down',
            isConnected: false,
            message: 'Oracle health check failed: Pool is not initialized',
            error: 'Pool is not initialized',
          },
        },
        details: {
          mssql: {
            status: 'up',
            isConnected: true,
            message: 'Database is connected and responsive',
            server: 'db-server.example.com',
            database: 'ContractsDB',
          },
          oracle: {
            status: 'down',
            isConnected: false,
            message: 'Oracle health check failed: Pool is not initialized',
            error: 'Pool is not initialized',
          },
        },
      };

      mockHealthService.check.mockResolvedValue(mockUnhealthyResponse);

      // Act
      const result = await controller.checkHealth();

      // Assert
      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUnhealthyResponse);
      expect(result.status).toBe('error');
      expect(result.httpCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.error.oracle).toBeDefined();
      if (result.error.oracle) {
        expect(result.error.oracle.status).toBe('down');
      }
    });

    it('should return error status when both services are down', async () => {
      // Arrange
      const mockUnhealthyResponse = {
        httpCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'error',
        info: {},
        error: {
          mssql: {
            status: 'down',
            isConnected: false,
            message: 'Database health check failed: Connection timeout',
            error: 'Connection timeout',
          },
          oracle: {
            status: 'down',
            isConnected: false,
            message: 'Oracle health check failed: Pool is not initialized',
            error: 'Pool is not initialized',
          },
        },
        details: {
          mssql: {
            status: 'down',
            isConnected: false,
            message: 'Database health check failed: Connection timeout',
            error: 'Connection timeout',
          },
          oracle: {
            status: 'down',
            isConnected: false,
            message: 'Oracle health check failed: Pool is not initialized',
            error: 'Pool is not initialized',
          },
        },
      };

      mockHealthService.check.mockResolvedValue(mockUnhealthyResponse);

      // Act
      const result = await controller.checkHealth();

      // Assert
      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUnhealthyResponse);
      expect(result.status).toBe('error');
      expect(result.httpCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.error.mssql).toBeDefined();
      expect(result.error.oracle).toBeDefined();
    });

    it('should handle service exceptions properly', async () => {
      // Arrange
      const mockError = new Error('Unexpected error during health check');
      mockHealthService.check.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.checkHealth()).rejects.toThrow(
        'Unexpected error during health check',
      );
      expect(healthService.check).toHaveBeenCalledTimes(1);
    });

    it('should call health service check method', async () => {
      // Arrange
      const mockResponse = {
        httpCode: HttpStatus.OK,
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };
      mockHealthService.check.mockResolvedValue(mockResponse);

      // Act
      await controller.checkHealth();

      // Assert
      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(healthService.check).toHaveBeenCalledWith();
    });
  });

  describe('constructor', () => {
    it('should inject HealthService dependency', () => {
      expect(controller).toBeDefined();
      expect(healthService).toBeDefined();
    });
  });
});
