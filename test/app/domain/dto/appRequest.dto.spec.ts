import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AppRequest } from '@src/app/domain/dto/appRequest.dto';

describe('ServiceMethodRequest DTO', () => {
  describe('id_tipo_documento validation', () => {
    it('should validate successfully with valid id_tipo_documento', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id_tipo_documento is undefined', async () => {
      const dto = plainToClass(AppRequest, {
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isDefined');
      expect(idTipoDocumentoError?.constraints?.isDefined).toBe(
        'El campo "id_tipo_documento" debe estar definido',
      );
    });

    it('should fail validation when id_tipo_documento is null', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: null,
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isDefined');
    });

    it('should fail validation when id_tipo_documento is empty string', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: '',
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isDefined');
    });

    it('should fail validation when id_tipo_documento is not an integer', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1.5,
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isInt');
      expect(idTipoDocumentoError?.constraints?.isInt).toBe(
        'El campo "id_tipo_documento" debe ser un número entero',
      );
    });

    it('should fail validation when id_tipo_documento is zero', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 0,
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isPositive');
      expect(idTipoDocumentoError?.constraints?.isPositive).toBe(
        'El campo "id_tipo_documento" debe ser un número positivo mayor que 0',
      );
    });

    it('should fail validation when id_tipo_documento is negative', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: -1,
        numero_documento: 1234567890,
      });

      const errors = await validate(dto);
      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(idTipoDocumentoError?.constraints).toHaveProperty('isPositive');
    });

    it('should transform string number to number for id_tipo_documento', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: '5',
        numero_documento: 1234567890,
      });

      expect(dto.id_tipo_documento).toBe(5);
      expect(typeof dto.id_tipo_documento).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('numero_documento validation', () => {
    it('should validate successfully with valid numero_documento', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: 1234567890123,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when numero_documento is undefined', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isDefined');
      expect(numeroDocumentoError?.constraints?.isDefined).toBe(
        'El campo "numero_documento" debe estar definido',
      );
    });

    it('should fail validation when numero_documento is null', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: null,
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isDefined');
    });

    it('should fail validation when numero_documento is empty string', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: '',
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isDefined');
    });

    it('should fail validation when numero_documento is not a number', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: 'not-a-number',
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isNumber');
      expect(numeroDocumentoError?.constraints?.isNumber).toBe(
        'El campo "numero_documento" debe ser un número',
      );
    });

    it('should fail validation when numero_documento is zero', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: 0,
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isPositive');
      expect(numeroDocumentoError?.constraints?.isPositive).toBe(
        'El campo "numero_documento" debe ser un número positivo mayor que 0',
      );
    });

    it('should fail validation when numero_documento is negative', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: -1234567890,
      });

      const errors = await validate(dto);
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(numeroDocumentoError).toBeDefined();
      expect(numeroDocumentoError?.constraints).toHaveProperty('isPositive');
    });

    it('should transform string number to number for numero_documento', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: '1234567890',
      });

      expect(dto.numero_documento).toBe(1234567890);
      expect(typeof dto.numero_documento).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle large numbers for numero_documento', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 1,
        numero_documento: 1234567890123,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Transform functionality', () => {
    it('should transform empty string to undefined for both fields', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: '',
        numero_documento: '',
      });

      expect(dto.id_tipo_documento).toBeUndefined();
      expect(dto.numero_documento).toBeUndefined();
    });

    it('should transform null to undefined for both fields', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: null,
        numero_documento: null,
      });

      expect(dto.id_tipo_documento).toBeUndefined();
      expect(dto.numero_documento).toBeUndefined();
    });

    it('should keep invalid string values as-is when they cannot be converted to numbers', async () => {
      const dto = plainToClass(AppRequest, {
        id_tipo_documento: 'invalid',
        numero_documento: 'also-invalid',
      });

      expect(dto.id_tipo_documento).toBe('invalid');
      expect(dto.numero_documento).toBe('also-invalid');
    });
  });

  describe('Complete validation scenarios', () => {
    it('should validate successfully with all valid data', async () => {
      const validData = {
        id_tipo_documento: 1,
        numero_documento: 1234567890123,
      };

      const dto = plainToClass(AppRequest, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.id_tipo_documento).toBe(1);
      expect(dto.numero_documento).toBe(1234567890123);
    });

    it('should fail validation when both fields are invalid', async () => {
      const invalidData = {
        id_tipo_documento: -1,
        numero_documento: 'invalid',
      };

      const dto = plainToClass(AppRequest, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);

      const idTipoDocumentoError = errors.find(
        (error) => error.property === 'id_tipo_documento',
      );
      const numeroDocumentoError = errors.find(
        (error) => error.property === 'numero_documento',
      );

      expect(idTipoDocumentoError).toBeDefined();
      expect(numeroDocumentoError).toBeDefined();
    });
  });
});
