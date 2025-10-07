import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new <%= classify(moduleName) %>
 *
 * This DTO defines the structure and validation rules for creating a <%= classify(moduleName) %>.
 * It includes class-validator decorators for runtime validation and ApiProperty decorators
 * for Swagger documentation.
 *
 * Usage:
 * - Inbound HTTP requests are validated against this DTO
 * - Add/modify properties based on your domain requirements
 * - Include only fields required for creation (no ID, timestamps)
 *
 * @example
 * const createDto: Create<%= classify(moduleName) %>Dto = {
 *   name: 'Example Name',
 *   description: 'Example Description',
 *   isActive: true
 * };
 */
export class Create<%= classify(moduleName) %>Dto {
  /**
   * The name of the <%= dasherize(moduleName) %>
   * @example 'Example <%= classify(moduleName) %>'
   */
  @ApiProperty({
    description: 'The name of the <%= dasherize(moduleName) %>',
    example: 'Example <%= classify(moduleName) %>',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * A detailed description of the <%= dasherize(moduleName) %>
   * @example 'This is a detailed description of the <%= dasherize(moduleName) %>'
   */
  @ApiProperty({
    description: 'A detailed description of the <%= dasherize(moduleName) %>',
    example: 'This is a detailed description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Indicates whether the <%= dasherize(moduleName) %> is active
   * @example true
   */
  @ApiProperty({
    description: 'Indicates whether the <%= dasherize(moduleName) %> is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // TODO: Add additional properties specific to your <%= classify(moduleName) %> domain
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
