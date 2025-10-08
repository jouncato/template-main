import { TestingModule, Test } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ResponseInterceptor } from '@share/domain/config/interceptors/response.interceptor';
import { ApiResponseDto } from '@share/domain/dto/apiResponse.dto';
import { HttpStatus } from '@nestjs/common';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);

    // Mock del response object
    mockResponse = {
      status: jest.fn(),
    };

    // Mock del ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    // Mock del CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should return data unchanged when data is not ApiResponseDto', (done) => {
      const testData = { message: 'test data' };
      mockCallHandler.handle.mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(testData);
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should return primitive data unchanged when data is not ApiResponseDto', (done) => {
      const testData = 'simple string';
      mockCallHandler.handle.mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(testData);
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle null data gracefully', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle undefined data gracefully', (done) => {
      mockCallHandler.handle.mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should set response status when data is ApiResponseDto with responseCode', (done) => {
      const apiResponse = new ApiResponseDto({
        responseCode: HttpStatus.CREATED,
        message: 'Resource created',
        messageCode: 'CREATED_001',
        result: { id: 1, name: 'Test' },
      });

      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(apiResponse);
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
          expect(mockResponse.status).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });

    it('should set response status to different HTTP codes correctly', (done) => {
      const apiResponse = new ApiResponseDto({
        responseCode: HttpStatus.BAD_REQUEST,
        message: 'Validation error',
        messageCode: 'ERROR_400',
      });

      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(apiResponse);
          expect(mockResponse.status).toHaveBeenCalledWith(
            HttpStatus.BAD_REQUEST,
          );
          done();
        },
      });
    });

    it('should not set response status when data is ApiResponseDto without responseCode', (done) => {
      // Creamos un objeto que parece ApiResponseDto pero sin responseCode
      const mockApiResponse = {
        message: 'Test message',
        result: { test: 'data' },
        timestamp: new Date().toISOString(),
      };

      // Mock para que instanceof return false con este objeto
      Object.setPrototypeOf(mockApiResponse, Object.prototype);

      mockCallHandler.handle.mockReturnValue(of(mockApiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(mockApiResponse);
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should not set response status when ApiResponseDto has falsy responseCode', (done) => {
      // Creamos un ApiResponseDto real pero modificamos responseCode a falsy
      const apiResponse = new ApiResponseDto({
        responseCode: HttpStatus.OK,
        message: 'Test message',
      });

      // Modificamos responseCode a un valor falsy
      (apiResponse as any).responseCode = 0;

      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(apiResponse);
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle multiple calls correctly', (done) => {
      const firstResponse = new ApiResponseDto({
        responseCode: HttpStatus.OK,
        message: 'First call',
      });

      const secondResponse = new ApiResponseDto({
        responseCode: HttpStatus.CREATED,
        message: 'Second call',
      });

      // Primera llamada
      mockCallHandler.handle.mockReturnValueOnce(of(firstResponse));
      const firstResult$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      firstResult$.subscribe({
        next: (data) => {
          expect(data).toBe(firstResponse);
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);

          // Segunda llamada
          mockCallHandler.handle.mockReturnValueOnce(of(secondResponse));
          const secondResult$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          secondResult$.subscribe({
            next: (secondData) => {
              expect(secondData).toBe(secondResponse);
              expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.CREATED,
              );
              expect(mockResponse.status).toHaveBeenCalledTimes(2);
              done();
            },
          });
        },
      });
    });

    it('should handle errors in observable stream', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(
        new Observable((subscriber) => {
          subscriber.error(error);
        }),
      );

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // No debería llegar aquí
          done.fail('Expected error but got next value');
        },
        error: (err) => {
          expect(err).toBe(error);
          expect(mockResponse.status).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('should work with complex ApiResponseDto data structure', (done) => {
      const complexResult = {
        users: [
          { id: 1, name: 'User 1', metadata: { active: true } },
          { id: 2, name: 'User 2', metadata: { active: false } },
        ],
        pagination: {
          page: 1,
          total: 2,
          hasMore: false,
        },
      };

      const apiResponse = new ApiResponseDto({
        responseCode: HttpStatus.OK,
        message: 'Users retrieved successfully',
        messageCode: 'USERS_FOUND',
        result: complexResult,
        transactionId: 'txn-12345',
      });

      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(apiResponse);
          expect(data.result).toEqual(complexResult);
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
          done();
        },
      });
    });

    it('should preserve all ApiResponseDto properties', (done) => {
      const apiResponse = new ApiResponseDto({
        responseCode: HttpStatus.ACCEPTED,
        message: 'Request accepted',
        messageCode: 'ACCEPTED_001',
        result: { jobId: 'job-123' },
        transactionId: 'txn-456',
        legacy: 'CustomSystem',
      });

      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(apiResponse);
          expect(data.responseCode).toBe(HttpStatus.ACCEPTED);
          expect(data.message).toBe('Request accepted');
          expect(data.messageCode).toBe('ACCEPTED_001');
          expect(data.result).toEqual({ jobId: 'job-123' });
          expect(data.transactionId).toBe('txn-456');
          expect(data.legacy).toBe('CustomSystem');
          expect(data.timestamp).toBeDefined();
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
          done();
        },
      });
    });
  });
});
