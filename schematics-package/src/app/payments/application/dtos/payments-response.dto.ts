import { ApiProperty } from '@nestjs/swagger';
import { PaymentsEntity } from '../../domain/entities/payments.entity';

/**
 * Response Data Transfer Object for Payments
 *
 * This DTO is used to shape the data returned from the API to clients.
 * It provides a clean separation between the domain entity and the API response,
 * allowing us to control exactly what data is exposed externally.
 *
 * Design principles:
 * - Maps domain entity to API-friendly format
 * - Excludes sensitive or internal fields
 * - Provides static factory method for easy conversion
 * - Includes Swagger documentation for API consumers
 *
 * Usage:
 * ```typescript
 * const entity = await repository.findById(id);
 * const response = PaymentsResponseDto.fromEntity(entity);
 * return response;
 * ```
 */
export class PaymentsResponseDto {
  /**
   * The unique identifier of the payments
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ApiProperty({
    description: 'The unique identifier of the payments',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  /**
   * The name of the payments
   * @example 'Example Payments'
   */
  @ApiProperty({
    description: 'The name of the payments',
    example: 'Example Payments',
  })
  name: string;

  /**
   * A detailed description of the payments
   * @example 'This is a detailed description of the payments'
   */
  @ApiProperty({
    description: 'A detailed description of the payments',
    example: 'This is a detailed description',
    required: false,
    nullable: true,
  })
  description?: string;

  /**
   * Indicates whether the payments is active
   * @example true
   */
  @ApiProperty({
    description: 'Indicates whether the payments is active',
    example: true,
  })
  isActive: boolean;

  /**
   * The date and time when the payments was created
   * @example '2024-01-01T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'The date and time when the payments was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  /**
   * The date and time when the payments was last updated
   * @example '2024-01-02T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'The date and time when the payments was last updated',
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt: Date;

  // TODO: Add additional properties matching your entity
  // Remember to exclude sensitive fields (passwords, tokens, etc.)

  /**
   * Static factory method to create a ResponseDto from a domain entity
   *
   * This method encapsulates the mapping logic, ensuring consistent transformation
   * from domain entities to API responses. It handles null/undefined values gracefully
   * and can include computed properties or transformations.
   *
   * @param entity - The domain entity to convert
   * @returns A new instance of PaymentsResponseDto
   *
   * @example
   * ```typescript
   * const entity = new Payments({ id: '123', name: 'Test' });
   * const dto = PaymentsResponseDto.fromEntity(entity);
   * ```
   */
  static fromEntity(entity: PaymentsEntity): PaymentsResponseDto {
    const dto = new PaymentsResponseDto();

    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.isActive = entity.isActive ?? true;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    // TODO: Map additional properties from your entity
    // Example transformations:
    // dto.fullName = `${entity.firstName} ${entity.lastName}`;
    // dto.displayDate = entity.createdAt.toISOString();
    // dto.status = entity.isActive ? 'Active' : 'Inactive';

    return dto;
  }

  /**
   * Static factory method to create multiple ResponseDtos from an array of entities
   *
   * @param entities - Array of domain entities to convert
   * @returns Array of PaymentsResponseDto instances
   *
   * @example
   * ```typescript
   * const entities = await repository.findAll();
   * const dtos = PaymentsResponseDto.fromEntities(entities);
   * ```
   */
  static fromEntities(entities: PaymentsEntity[]): PaymentsResponseDto[] {
    return entities.map(entity => this.fromEntity(entity));
  }
}
