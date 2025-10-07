import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class AppRequest {
  @ApiProperty({
    description: 'ID del tipo de documento',
    example: 1,
    type: 'integer',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsDefined({ message: 'El campo "id_tipo_documento" debe estar definido' })
  @IsNotEmpty({ message: 'El campo "id_tipo_documento" no puede estar vacío' })
  @IsInt({ message: 'El campo "id_tipo_documento" debe ser un número entero' })
  @IsPositive({
    message:
      'El campo "id_tipo_documento" debe ser un número positivo mayor que 0',
  })
  id_tipo_documento: number;

  @ApiProperty({
    description: 'Número de documento',
    example: 1234567890123,
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  })
  @IsDefined({ message: 'El campo "numero_documento" debe estar definido' })
  @IsNotEmpty({ message: 'El campo "numero_documento" no puede estar vacío' })
  @IsNumber({}, { message: 'El campo "numero_documento" debe ser un número' })
  @IsPositive({
    message:
      'El campo "numero_documento" debe ser un número positivo mayor que 0',
  })
  numero_documento: number;
}
