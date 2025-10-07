import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import {
  CustomExceptionFilter,
  NotFoundExceptionFilter,
  InternalServerErrorExceptionFilter,
  ServiceUnavailableExceptionFilter,
} from '@src/share/interfaces/filter/customExceptionFilter';
import { Logger20Service } from '@src/share/domain/config/logger/logger20.service';
import { ApmService } from '@src/share/domain/config/apm/apm.service';

// Mock de las dependencias externas
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

jest.mock('elastic-apm-node', () => ({
  captureError: jest.fn(),
}));

jest.mock('@src/share/domain/config/txid/als', () => ({
  als: {
    getStore: jest.fn(() => ({ txId: 'als-tx-id' })),
  },
}));

// Mock del Logger20Service
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Mock del ApmService
const mockApmService = {
  isStarted: jest.fn(() => true),
  captureError: jest.fn(),
  setTransactionName: jest.fn(),
  setLabel: jest.fn(),
  startTransaction: jest.fn(),
  endTransaction: jest.fn(),
  startSpan: jest.fn(),
  sanitizeLabelKey: jest.fn((key: string) => key.toLowerCase()),
  setCustomContext: jest.fn(),
};

describe('CustomExceptionFilter', () => {
  let filter: CustomExceptionFilter;
  let mockResponse: { code: jest.Mock; send: jest.Mock; header: jest.Mock };
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomExceptionFilter,
        {
          provide: 'TransactionId',
          useValue: 'test-transaction-id',
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
      ],
    })
      .overrideProvider('TransactionId')
      .useValue('test-transaction-id')
      .compile();

    filter = module.get<CustomExceptionFilter>(CustomExceptionFilter);

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-endpoint',
      method: 'GET',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-transaction-id': 'test-transaction-id',
      },
    };

    const mockHttpArgumentsHost: HttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should handle BadRequestException correctly', () => {
      const badRequestException = new BadRequestException('Validation failed');

      filter.catch(badRequestException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle BadRequestException with validation errors', () => {
      const validationErrors = {
        message: 'Validation failed',
        errors: [
          {
            property: 'email',
            constraints: {
              isEmail: 'email must be a valid email',
              isNotEmpty: 'email should not be empty',
            },
          },
        ],
      };

      const badRequestException = new BadRequestException(validationErrors);

      filter.catch(badRequestException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should use transaction ID from getTxIdFromContext', () => {
      const badRequestException = new BadRequestException('Test error');

      filter.catch(badRequestException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'test-transaction-id',
        }),
      );
    });

    it('should log error using Logger20Service', () => {
      const badRequestException = new BadRequestException('Test error');

      filter.catch(badRequestException, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error en la solicitud',
        expect.objectContaining({
          response: expect.any(Array),
          request: expect.any(Object),
          methodName: 'CustomExceptionFilter',
        }),
      );
    });
  });
});

describe('NotFoundExceptionFilter', () => {
  let filter: NotFoundExceptionFilter;
  let mockResponse: { code: jest.Mock; send: jest.Mock; header: jest.Mock };
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotFoundExceptionFilter,
        {
          provide: 'TransactionId',
          useValue: 'test-transaction-id',
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: ApmService,
          useValue: mockApmService,
        },
      ],
    })
      .overrideProvider('TransactionId')
      .useValue('test-transaction-id')
      .compile();

    filter = module.get<NotFoundExceptionFilter>(NotFoundExceptionFilter);

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/nonexistent-endpoint',
      method: 'POST',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-transaction-id': 'test-transaction-id',
      },
    };

    const mockHttpArgumentsHost: HttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should handle NotFoundException correctly', () => {
      const notFoundException = new NotFoundException('Resource not found');

      filter.catch(notFoundException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should call ApmService methods when APM is started', () => {
      const notFoundException = new NotFoundException('Resource not found');

      filter.catch(notFoundException, mockArgumentsHost);

      expect(mockApmService.isStarted).toHaveBeenCalled();
      expect(mockApmService.setTransactionName).toHaveBeenCalledWith('POST /nonexistent-endpoint');
      expect(mockApmService.setLabel).toHaveBeenCalledWith('http.method', 'POST');
      expect(mockApmService.setLabel).toHaveBeenCalledWith('http.url', '/nonexistent-endpoint');
      expect(mockApmService.setLabel).toHaveBeenCalledWith('http.status_code', '404');
      expect(mockApmService.captureError).toHaveBeenCalledWith(notFoundException);
    });

    it('should not call ApmService methods when APM is not started', () => {
      mockApmService.isStarted.mockReturnValue(false);
      const notFoundException = new NotFoundException('Resource not found');

      filter.catch(notFoundException, mockArgumentsHost);

      expect(mockApmService.isStarted).toHaveBeenCalled();
      expect(mockApmService.setTransactionName).not.toHaveBeenCalled();
      expect(mockApmService.setLabel).not.toHaveBeenCalled();
      expect(mockApmService.captureError).not.toHaveBeenCalled();
    });
  });
});

describe('InternalServerErrorExceptionFilter', () => {
  let filter: InternalServerErrorExceptionFilter;
  let mockResponse: { code: jest.Mock; send: jest.Mock; header: jest.Mock };
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalServerErrorExceptionFilter,
        {
          provide: 'TransactionId',
          useValue: 'test-transaction-id',
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
      ],
    })
      .overrideProvider('TransactionId')
      .useValue('test-transaction-id')
      .compile();

    filter = module.get<InternalServerErrorExceptionFilter>(
      InternalServerErrorExceptionFilter,
    );

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/error-endpoint',
      method: 'GET',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-transaction-id': 'test-transaction-id',
      },
    };

    const mockHttpArgumentsHost: HttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should handle InternalServerErrorException correctly', () => {
      const serverErrorException = new InternalServerErrorException(
        'Internal server error',
      );

      filter.catch(serverErrorException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});

describe('ServiceUnavailableExceptionFilter', () => {
  let filter: ServiceUnavailableExceptionFilter;
  let mockResponse: { code: jest.Mock; send: jest.Mock; header: jest.Mock };
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceUnavailableExceptionFilter,
        {
          provide: 'TransactionId',
          useValue: 'test-transaction-id',
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
      ],
    })
      .overrideProvider('TransactionId')
      .useValue('test-transaction-id')
      .compile();

    filter = module.get<ServiceUnavailableExceptionFilter>(
      ServiceUnavailableExceptionFilter,
    );

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/unavailable-service',
      method: 'PUT',
      body: {},
      query: {},
      params: {},
      headers: {
        'x-transaction-id': 'test-transaction-id',
      },
    };

    const mockHttpArgumentsHost: HttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should handle ServiceUnavailableException correctly', () => {
      const serviceUnavailableException = new ServiceUnavailableException(
        'Service temporarily unavailable',
      );

      filter.catch(serviceUnavailableException, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});
