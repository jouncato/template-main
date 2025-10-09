import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * Data Transfer Object for updating an existing <%= classify(moduleName) %>
 *
 * This DTO defines the structure and validation rules for updating a <%= classify(moduleName) %>.
 * All fields are optional since partial updates are typically allowed (PATCH semantics).
 *
 * Design decisions:
 * - All properties are optional (use PartialType if preferred)
 * - Excludes ID and system timestamps (createdAt, updatedAt)
 * - Includes only fields that can be modified by users
 *
 * Usage:
 * - Used for PATCH/PUT endpoints
 * - Validates partial updates
 * - Can be used with class-transformer's @PartialType() alternative
 *
 * @example
 * const updateDto: Update<%= classify(moduleName) %>Dto = {
 *   name: 'Updated Name',
 *   isActive: false
 * };
 */
export class Update<%= classify(moduleName) %>Dto {
  /**
   * The updated name of the <%= dasherize(moduleName) %>
   * @example 'Updated <%= classify(moduleName) %> Name'
   */
  @ApiProperty({
    description: 'The updated name of the <%= dasherize(moduleName) %>',
    example: 'Updated <%= classify(moduleName) %> Name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * The updated description of the <%= dasherize(moduleName) %>
   * @example 'Updated description'
   */
  @ApiProperty({
    description: 'The updated description of the <%= dasherize(moduleName) %>',
    example: 'Updated description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The updated active status of the <%= dasherize(moduleName) %>
   * @example false
   */
  @ApiProperty({
    description: 'The updated active status of the <%= dasherize(moduleName) %>',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // TODO: Add additional updateable properties specific to your <%= classify(moduleName) %> domain
  // Note: DO NOT include:
  // - ID fields (cannot be changed)
  // - System timestamps (managed automatically)
  // - Sensitive fields that require special authorization
}
