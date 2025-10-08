import { Test, TestingModule } from '@nestjs/testing';
import { ConfigType } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { AppService } from '@src/app/application/app.service';
import { DatabaseService } from '@src/app/infrastructure/mssql/database.service';
import { Logger20Service } from '@src/share/domain/config/logger/logger20.service';
import { ApiResponseDto } from '@src/share/domain/dto/apiResponse.dto';
import { AppRequest } from '@src/app/domain/dto/appRequest.dto';
import config from '@src/share/domain/resources/env.config';

describe('Service', () => {
  let service: AppService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockLogger: jest.Mocked<Logger20Service>;
  let mockConfigService: ConfigType<typeof config>;

  beforeEach(async () => {
    mockDatabaseService = {
      executePrc: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockConfigService = {
      TIMEOUT: 5000,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: config.KEY,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transactionService', () => {
    const mockRequest: AppRequest = {
      id_tipo_documento: 1,
      numero_documento: 1234567890,
    };

    it('should return success response', async () => {
      mockDatabaseService.executePrc.mockResolvedValue(undefined);

      const result = await service.transactionService(mockRequest);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.responseCode).toBe(HttpStatus.OK);
      expect(result.messageCode).toBe('OK');
      expect(result.message).toBe('Proceso ejecutado con éxito');
      expect(result.result).toEqual({ data: 'Resultado de la operación' });
    });
  });

  describe('handleError', () => {
    it('should return service unavailable response', () => {
      const result = (service as any).handleError(new Error('Test error'));

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.responseCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.messageCode).toBe('SERVICE_UNAVAILABLE');
      expect(result.message).toBe('No se pudo procesar la solicitud');
    });
  });
});
