/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TimeOutInterceptor } from '@src/share/domain/config/interceptors/timeout.interceptors';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import config from '@share/domain/resources/env.config';
import { ModuleRef } from '@nestjs/core';
import {
  ExecutionContext,
  CallHandler,
  GatewayTimeoutException,
  HttpStatus,
} from '@nestjs/common';
import { of, throwError, TimeoutError } from 'rxjs';
import { ApiResponseDto } from '@share/domain/dto/apiResponse.dto';
import { als } from '@share/domain/config/txid/als';

describe('TimeOutInterceptor', () => {
  let interceptor: TimeOutInterceptor;
  let mockLogger: jest.Mocked<Logger20Service>;

  beforeEach(async () => {
    const mockModuleRef = {
      resolve: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      startProcess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOutInterceptor,
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
      ],
    }).compile();

    interceptor = module.get<TimeOutInterceptor>(TimeOutInterceptor);
    module.get<ModuleRef>(ModuleRef);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('#intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockRequest: any;
    let mockResponse: any;

    // Helper function to handle Observable or Promise<Observable>
    const subscribeToResult = (result: any, observer: any) => {
      if (result instanceof Promise) {
        result.then((obs) => obs.subscribe(observer));
      } else {
        result.subscribe(observer);
      }
    };

    beforeEach(() => {
      mockRequest = {
        url: '/test-endpoint',
        method: 'GET',
        headers: {},
      };

      mockResponse = {
        header: jest.fn(),
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as any;

      mockCallHandler = {
        handle: jest.fn(),
      } as any;

      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should handle successful requests without timeout', (done) => {
      const mockResult = { data: 'success' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(mockResult));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      if (result instanceof Promise) {
        result.then((obs) =>
          obs.subscribe({
            next: (value) => {
              expect(value).toEqual(mockResult);
              done();
            },
            error: done,
          }),
        );
      } else {
        result.subscribe({
          next: (value) => {
            expect(value).toEqual(mockResult);
            done();
          },
          error: done,
        });
      }
    });

    it('should handle TimeoutError and throw GatewayTimeoutException with transaction ID from header', (done) => {
      const testTxId = 'test-tx-id-from-header';
      mockRequest.headers['x-transaction-id'] = testTxId;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBeInstanceOf(GatewayTimeoutException);
          expect(error.getResponse()).toBeInstanceOf(ApiResponseDto);

          const response = error.getResponse() as ApiResponseDto;
          expect(response.responseCode).toBe(HttpStatus.GATEWAY_TIMEOUT);
          expect(response.messageCode).toBe('GATEWAY_TIMEOUT');
          expect(response.message).toBe(
            'La operación alcanzó el tiempo máximo de espera',
          );
          expect(response.transactionId).toBe(testTxId);
          expect(response.result).toEqual({});

          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            testTxId,
          );
          expect(mockLogger.error).toHaveBeenCalledWith(
            'La operación alcanzó el tiempo máximo de espera',
            {
              message: 'La operación alcanzó el tiempo máximo de espera',
              response: '/test-endpoint',
              methodName: 'GET',
              transactionId: testTxId,
            },
            TimeOutInterceptor.name,
          );
          done();
        },
      });
    }, 10000);

    it('should handle TimeoutError with transaction ID from x-request-id header', (done) => {
      const testTxId = 'test-request-id-from-header';
      mockRequest.headers['x-request-id'] = testTxId;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBeInstanceOf(GatewayTimeoutException);
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBe(testTxId);
          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            testTxId,
          );
          done();
        },
      });
    });

    it('should handle TimeoutError with transaction ID from ALS when no header is present', (done) => {
      const testTxId = 'test-tx-id-from-als';

      // Mock ALS to return a transaction ID
      jest.spyOn(als, 'getStore').mockReturnValue({ txId: testTxId });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBeInstanceOf(GatewayTimeoutException);
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBe(testTxId);
          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            testTxId,
          );
          done();
        },
      });
    });

    it('should generate UUID when no transaction ID is available from headers or ALS', (done) => {
      // Mock ALS to return undefined
      jest.spyOn(als, 'getStore').mockReturnValue(undefined);

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBeInstanceOf(GatewayTimeoutException);
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBeDefined();
          expect(response.transactionId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
          );
          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            response.transactionId,
          );
          done();
        },
      });
    });

    it('should handle case when response.header is not a function', (done) => {
      const testTxId = 'test-tx-id';
      mockRequest.headers['x-transaction-id'] = testTxId;
      mockResponse.header = 'not-a-function'; // Not a function

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBeInstanceOf(GatewayTimeoutException);
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBe(testTxId);
          // The test passes if no exception is thrown during execution
          done();
        },
      });
    });

    it('should handle non-TimeoutError and re-throw it', (done) => {
      const customError = new Error('Custom error');

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => customError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          expect(error).toBe(customError);
          expect(error).not.toBeInstanceOf(GatewayTimeoutException);
          expect(mockLogger.error).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should prioritize x-transaction-id over x-request-id header', (done) => {
      const transactionId = 'priority-transaction-id';
      const requestId = 'lower-priority-request-id';

      mockRequest.headers['x-transaction-id'] = transactionId;
      mockRequest.headers['x-request-id'] = requestId;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBe(transactionId);
          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            transactionId,
          );
          done();
        },
      });
    });

    it('should prioritize header over ALS transaction ID', (done) => {
      const headerTxId = 'header-transaction-id';
      const alsTxId = 'als-transaction-id';

      mockRequest.headers['x-transaction-id'] = headerTxId;
      jest.spyOn(als, 'getStore').mockReturnValue({ txId: alsTxId });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => new TimeoutError()),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      subscribeToResult(result, {
        next: () => done('Should not emit next'),
        error: (error) => {
          const response = error.getResponse() as ApiResponseDto;
          expect(response.transactionId).toBe(headerTxId);
          expect(mockResponse.header).toHaveBeenCalledWith(
            'x-transaction-id',
            headerTxId,
          );
          done();
        },
      });
    });
  });
});
