import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new Payments
 *
 * This DTO defines the structure and validation rules for creating a Payments.
 * It includes class-validator decorators for runtime validation and ApiProperty decorators
 * for Swagger documentation.
 *
 * Usage:
 * - Inbound HTTP requests are validated against this DTO
 * - Add/modify properties based on your domain requirements
 * - Include only fields required for creation (no ID, timestamps)
 *
 * @example
 * const createDto: CreatePaymentsDto = {
 *   name: 'Example Name',
 *   description: 'Example Description',
 *   isActive: true
 * };
 */
export class CreatePaymentsDto {
  /**
   * The name of the payments
   * @example 'Example Payments'
   */
  @ApiProperty({
    description: 'The name of the payments',
    example: 'Example Payments',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * A detailed description of the payments
   * @example 'This is a detailed description of the payments'
   */
  @ApiProperty({
    description: 'A detailed description of the payments',
    example: 'This is a detailed description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Indicates whether the payments is active
   * @example true
   */
  @ApiProperty({
    description: 'Indicates whether the payments is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // TODO: Add additional properties specific to your Payments domain
  // Examples:
  //
  // @ApiProperty({ description: 'The email address', example: 'user@example.com' })
  // @IsEmail()
  // @IsNotEmpty()
  // email: string;
  //
  // @ApiProperty({ description: 'The age', example: 25, minimum: 0, maximum: 120 })
  // @IsNumber()
  // @IsOptional()
  // age?: number;
  //
  // @ApiProperty({ description: 'The creation date', example: '2024-01-01T00:00:00Z' })
  // @IsDate()
  // @Type(() => Date)
  // @IsOptional()
  // createdAt?: Date;
}
