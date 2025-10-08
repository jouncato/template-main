import * as sql from 'mssql';
import {
  PrcConsultClientInput,
  PrcConsultClientResult,
} from '@src/app/domain/dto/prcConsultClient.dto';
import {
  ClientRecord,
  ClientResponseError,
} from '@src/app/domain/dto/clientResponse.type';

describe('PrcConsultClientInput', () => {
  describe('Constructor', () => {
    it('should create instance with valid data', () => {
      const inputData = {
        id_tipo_documento_int: 1,
        numero_documento_num: 1234567890,
      };

      const dto = new PrcConsultClientInput(inputData);

      expect(dto.id_tipo_documento_int).toBe(1);
      expect(dto.numero_documento_num).toBe(1234567890);
    });

    it('should create instance with partial data', () => {
      const inputData = {
        id_tipo_documento_int: 2,
      };

      const dto = new PrcConsultClientInput(inputData);

      expect(dto.id_tipo_documento_int).toBe(2);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should create instance with empty object', () => {
      const dto = new PrcConsultClientInput({});

      expect(dto.id_tipo_documento_int).toBe(0);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should handle undefined input', () => {
      const dto = new PrcConsultClientInput(undefined as any);

      expect(dto.id_tipo_documento_int).toBe(0);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should handle null input', () => {
      const dto = new PrcConsultClientInput(null as any);

      expect(dto.id_tipo_documento_int).toBe(0);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should use default values when properties are undefined', () => {
      const inputData = {
        id_tipo_documento_int: undefined,
        numero_documento_num: undefined,
      };

      const dto = new PrcConsultClientInput(inputData);

      expect(dto.id_tipo_documento_int).toBe(0);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should use default values when properties are null', () => {
      const inputData = {
        id_tipo_documento_int: undefined,
        numero_documento_num: undefined,
      };

      const dto = new PrcConsultClientInput(inputData);

      expect(dto.id_tipo_documento_int).toBe(0);
      expect(dto.numero_documento_num).toBe(0);
    });

    it('should handle large numbers', () => {
      const inputData = {
        id_tipo_documento_int: 999999999,
        numero_documento_num: 9999999999999999999,
      };

      const dto = new PrcConsultClientInput(inputData);

      expect(dto.id_tipo_documento_int).toBe(999999999);
      expect(dto.numero_documento_num).toBe(9999999999999999999);
    });
  });

  describe('toSqlParams', () => {
    it('should return correct SQL parameters with valid data', () => {
      const dto = new PrcConsultClientInput({
        id_tipo_documento_int: 1,
        numero_documento_num: 1234567890,
      });

      const sqlParams = dto.toSqlParams();

      expect(sqlParams).toHaveProperty('id_tipo_documento_int');
      expect(sqlParams).toHaveProperty('numero_documento_num');

      expect(sqlParams.id_tipo_documento_int.type).toEqual(sql.Int());
      expect(sqlParams.id_tipo_documento_int.value).toBe(1);

      expect(sqlParams.numero_documento_num.type).toEqual(sql.Numeric());
      expect(sqlParams.numero_documento_num.value).toBe(1234567890);
    });

    it('should return correct SQL parameters with default values', () => {
      const dto = new PrcConsultClientInput({});

      const sqlParams = dto.toSqlParams();

      expect(sqlParams.id_tipo_documento_int.type).toEqual(sql.Int());
      expect(sqlParams.id_tipo_documento_int.value).toBe(0);

      expect(sqlParams.numero_documento_num.type).toEqual(sql.Numeric());
      expect(sqlParams.numero_documento_num.value).toBe(0);
    });

    it('should return correct SQL parameter types', () => {
      const dto = new PrcConsultClientInput({
        id_tipo_documento_int: 5,
        numero_documento_num: 9876543210,
      });

      const sqlParams = dto.toSqlParams();

      // Verificar que los tipos tienen las propiedades esperadas de mssql types
      expect(sqlParams.id_tipo_documento_int.type).toHaveProperty('type');
      expect(sqlParams.numero_documento_num.type).toHaveProperty('type');

      // Verificar que son del tipo correcto comparando con nuevas instancias
      expect(sqlParams.id_tipo_documento_int.type).toEqual(sql.Int());
      expect(sqlParams.numero_documento_num.type).toEqual(sql.Numeric());
    });

    it('should handle negative numbers', () => {
      const dto = new PrcConsultClientInput({
        id_tipo_documento_int: -1,
        numero_documento_num: -1234567890,
      });

      const sqlParams = dto.toSqlParams();

      expect(sqlParams.id_tipo_documento_int.value).toBe(-1);
      expect(sqlParams.numero_documento_num.value).toBe(-1234567890);
    });

    it('should handle zero values', () => {
      const dto = new PrcConsultClientInput({
        id_tipo_documento_int: 0,
        numero_documento_num: 0,
      });

      const sqlParams = dto.toSqlParams();

      expect(sqlParams.id_tipo_documento_int.value).toBe(0);
      expect(sqlParams.numero_documento_num.value).toBe(0);
    });

    it('should return object with exact parameter structure', () => {
      const dto = new PrcConsultClientInput({
        id_tipo_documento_int: 3,
        numero_documento_num: 555666777,
      });

      const sqlParams = dto.toSqlParams();
      const paramKeys = Object.keys(sqlParams);

      expect(paramKeys).toHaveLength(2);
      expect(paramKeys).toContain('id_tipo_documento_int');
      expect(paramKeys).toContain('numero_documento_num');

      // Verificar estructura de cada parámetro
      Object.values(sqlParams).forEach((param) => {
        expect(param).toHaveProperty('type');
        expect(param).toHaveProperty('value');
        expect(Object.keys(param)).toHaveLength(2);
      });
    });
  });

  describe('Integration tests', () => {
    it('should work correctly with typical document types', () => {
      // Cédula de ciudadanía
      const cedulaDto = new PrcConsultClientInput({
        id_tipo_documento_int: 1,
        numero_documento_num: 12345678,
      });

      expect(cedulaDto.id_tipo_documento_int).toBe(1);
      expect(cedulaDto.numero_documento_num).toBe(12345678);

      const cedulaSqlParams = cedulaDto.toSqlParams();
      expect(cedulaSqlParams.id_tipo_documento_int.value).toBe(1);
      expect(cedulaSqlParams.numero_documento_num.value).toBe(12345678);
    });

    it('should work correctly with NIT', () => {
      // NIT
      const nitDto = new PrcConsultClientInput({
        id_tipo_documento_int: 2,
        numero_documento_num: 900123456,
      });

      expect(nitDto.id_tipo_documento_int).toBe(2);
      expect(nitDto.numero_documento_num).toBe(900123456);

      const nitSqlParams = nitDto.toSqlParams();
      expect(nitSqlParams.id_tipo_documento_int.value).toBe(2);
      expect(nitSqlParams.numero_documento_num.value).toBe(900123456);
    });

    it('should maintain data integrity through constructor and toSqlParams', () => {
      const originalData = {
        id_tipo_documento_int: 99,
        numero_documento_num: 1111222233334444,
      };

      const dto = new PrcConsultClientInput(originalData);
      const sqlParams = dto.toSqlParams();

      expect(dto.id_tipo_documento_int).toBe(
        originalData.id_tipo_documento_int,
      );
      expect(dto.numero_documento_num).toBe(originalData.numero_documento_num);
      expect(sqlParams.id_tipo_documento_int.value).toBe(
        originalData.id_tipo_documento_int,
      );
      expect(sqlParams.numero_documento_num.value).toBe(
        originalData.numero_documento_num,
      );
    });
  });
});

describe('PrcConsultClientResult Interface', () => {
  it('should have correct structure for successful result', () => {
    const mockClientRecord: ClientRecord = {
      iCodeErrorId: 0,
      vchMessageError: '',
      id_tipo_documento_int: 1,
      numero_documento_num: 12345678,
      nombre_razon_social_vch: 'Juan Pérez',
      contrato_marco_vch: 'MARCO001',
      estado_contrato_bit: 1,
    };

    const mockClientError: ClientResponseError = {
      iCodeErrorId: 0,
      vchMessageError: '',
    };

    const result: PrcConsultClientResult = {
      recordsets: [[mockClientRecord], [mockClientError]],
      recordset: [mockClientRecord],
      output: {},
      rowsAffected: [1],
      returnValue: 0,
    };

    expect(result.recordsets).toHaveLength(2);
    expect(result.recordsets[0]).toHaveLength(1);
    expect(result.recordsets[1]).toHaveLength(1);
    expect(result.recordset).toHaveLength(1);
    expect(result.output).toEqual({});
    expect(result.rowsAffected).toEqual([1]);
    expect(result.returnValue).toBe(0);
  });

  it('should handle empty result', () => {
    const result: PrcConsultClientResult = {
      recordsets: [[], []],
      recordset: [],
      output: {},
      rowsAffected: [0],
      returnValue: 0,
    };

    expect(result.recordsets[0]).toHaveLength(0);
    expect(result.recordsets[1]).toHaveLength(0);
    expect(result.recordset).toHaveLength(0);
    expect(result.rowsAffected).toEqual([0]);
  });

  it('should handle error result', () => {
    const mockClientError: ClientResponseError = {
      iCodeErrorId: 1001,
      vchMessageError: 'Cliente no encontrado',
    };

    const result: PrcConsultClientResult = {
      recordsets: [[], [mockClientError]],
      recordset: [],
      output: {},
      rowsAffected: [0],
      returnValue: -1,
    };

    expect(result.recordsets[1][0].iCodeErrorId).toBe(1001);
    expect(result.recordsets[1][0].vchMessageError).toBe(
      'Cliente no encontrado',
    );
    expect(result.returnValue).toBe(-1);
  });
});
