import { ApiResponseDto } from '@src/share/domain/dto/apiResponse.dto';
import { instanceToPlain } from 'class-transformer';
import 'reflect-metadata';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

describe('ApiResponseDto', () => {
  describe('Constructor', () => {
    it('should create instance with all parameters', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: { key: 'value' },
        transactionId: 'txn-123',
      });
      expect(response.responseCode).toBe(200);
      expect(response.messageCode).toBe('SUCCESS');
      expect(response.message).toBe('OK');
      expect(response.result).toEqual({ key: 'value' });
      expect(response.transactionId).toBe('txn-123');
      expect(response.timestamp).toBeDefined();
    });

    it('should create instance without result parameter', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
      });
      expect(response.responseCode).toBe(200);
      expect(response.messageCode).toBe('SUCCESS');
      expect(response.message).toBe('OK');
      expect(response.result).toBeUndefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should create instance with null result', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: null,
      });
      expect(response.result).toBeNull();
    });

    it('should create instance with undefined result', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: undefined,
      });
      expect(response.result).toBeUndefined();
    });

    it('should set timestamp automatically', () => {
      const before = Date.now();
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
      });
      const after = Date.now();

      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      if (typeof response.timestamp === 'string') {
        const timestampDate = new Date(response.timestamp).getTime();
        expect(timestampDate).toBeGreaterThanOrEqual(before);
        expect(timestampDate).toBeLessThanOrEqual(after);
      } else {
        fail('response.timestamp is undefined');
      }
    });
  });

  describe('Property assignment', () => {
    it('should allow direct property assignment after construction', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'INITIAL',
        message: 'Initial',
      });
      response.responseCode = 400;
      response.messageCode = 'ERROR';
      response.message = 'Updated';
      response.result = { updated: true };

      expect(response.responseCode).toBe(400);
      expect(response.messageCode).toBe('ERROR');
      expect(response.message).toBe('Updated');
      expect(response.result).toEqual({ updated: true });
    });
  });

  describe('Edge cases', () => {
    it('should handle complex nested result data', () => {
      const complex = {
        level1: {
          level2: {
            key: 'value',
            list: [1, 2, { deep: true }],
          },
        },
      };
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: complex,
      });
      expect(response.result).toEqual(complex);
    });
  });

  describe('Instance checks', () => {
    it('should be instance of ApiResponseDto', () => {
      const response = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'Test',
      });
      expect(response).toBeInstanceOf(ApiResponseDto);
    });

    it('should accept various result data types', () => {
      const cases = [123, 'string', true, [1, 2, 3], null, undefined, { a: 1 }];

      for (const data of cases) {
        const dto = new ApiResponseDto({
          responseCode: 200,
          messageCode: 'SUCCESS',
          message: 'Test',
          result: data,
        });
        expect(dto.result).toEqual(data);
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize correctly with JSON.stringify', () => {
      const dto = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: { key: 'val' },
      });
      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.responseCode).toBe(200);
      expect(parsed.messageCode).toBe('SUCCESS');
      expect(parsed.message).toBe('OK');
      expect(parsed.result).toEqual({ key: 'val' });
      expect(parsed.timestamp).toBeDefined();
    });

    it('should serialize correctly with instanceToPlain', () => {
      const dto = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: { key: 'val' },
      });
      const plain = instanceToPlain(dto);
      expect(plain.responseCode).toBe(200);
      expect(plain.messageCode).toBe('SUCCESS');
      expect(plain.message).toBe('OK');
      expect(plain.result).toEqual({ key: 'val' });
      expect(plain.timestamp).toBeDefined();
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;

      const dto = new ApiResponseDto({
        responseCode: 200,
        messageCode: 'SUCCESS',
        message: 'OK',
        result: circular,
      });
      expect(dto.result.name).toBe('circular');
      expect(dto.result.self).toBe(dto.result);
    });
  });

  describe('Swagger metadata coverage', () => {
    it('should expose metadata for responseCode', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        ApiResponseDto.prototype,
        'responseCode',
      );
      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('integer');
      expect(metadata.example).toBe(200);
    });

    it('should expose metadata for message', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        ApiResponseDto.prototype,
        'message',
      );
      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('string');
      expect(metadata.example).toBe('OK');
    });

    it('should expose metadata for legacy', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        ApiResponseDto.prototype,
        'legacy',
      );
      expect(metadata).toBeDefined();
      expect(metadata.required).toBe(false);
    });
  });
});
