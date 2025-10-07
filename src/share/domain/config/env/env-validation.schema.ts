import { plainToClass, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
  ValidationError,
} from 'class-validator';

/**
 * Helper function para convertir valores a boolean
 */
const toBooleanTransform = ({ value }: { value: any }): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
};

/**
 * Esquema de validación para variables de entorno
 * Usa class-validator para asegurar que todas las variables requeridas estén presentes
 * y tengan valores válidos al iniciar la aplicación
 */
export class EnvironmentVariables {
  // ----------------------------
  // 🛠️ Variables de configuración de la aplicación
  // ----------------------------

  @IsString()
  @IsNotEmpty()
  SERVICE_NAME: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @Max(120000)
  TIMEOUT: number;

  @IsString()
  @IsNotEmpty()
  SERVICE_PREFIX: string; // Borrar si es un servicio subscriptor

  @IsString()
  @IsNotEmpty()
  CONTROLLER_PATH: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  MAX_LOG_SIZE?: number;

  // ----------------------------
  // 🌐 Variables de configuración HTTP
  // ----------------------------

  @Type(() => Number)
  @IsNumber()
  @Max(60000)
  HTTP_TIMEOUT: number;

  @Transform(toBooleanTransform)
  @IsBoolean()
  DISABLE_SSL_VERIFICATION: boolean;

  @Transform(toBooleanTransform)
  @IsBoolean()
  HTTP_KEEP_ALIVE: boolean;

  // ----------------------------
  // 📈 Variables de configuración de APM (Elastic)
  // ----------------------------

  @IsString()
  ELASTIC_APM_SERVER_URL: string;

  @IsString()
  ELASTIC_APM_ENVIRONMENT: string;

  @Transform(toBooleanTransform)
  @IsBoolean()
  ELASTIC_APM_ACTIVE: boolean;

  // ----------------------------
  // 🗄️ Variables de configuración de Base de Datos
  // ----------------------------

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string; // Nombre de la base de datos (MSSQL)

  @IsString()
  @IsNotEmpty()
  DB_SERVER: string; // Dirección del servidor de base de datos (MSSQL)

  @Type(() => Number)
  @IsNumber()
  DB_PORT: number; // Puerto del servidor de base de datos (MSSQL)

  @IsString()
  @IsNotEmpty()
  DB_CONNECTSTRING: string; // Cadena de conexión (Oracle)

  // ----------------------------
  // 🏊‍♂️ Variables de configuración de Pool de conexiones
  // ----------------------------

  @IsString()
  @IsNotEmpty()
  DB_POOL_ALIAS: string; // Alias del pool (Oracle)

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  DB_POOL_MIN: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  DB_POOL_MAX: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  DB_POOL_INCREMENT: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  DB_POOL_TIMEOUT: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  DB_QUEUE_TIMEOUT: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  DB_STMT_CACHE_SIZE: number;

  // ----------------------------
  // 🧾 Variables Procedimientos almacenados
  // ----------------------------

  @IsString()
  PRC_CONSULT_CLIENT: string;

  // ----------------------------
  // 📡 Variables de configuración de Kafka
  // ----------------------------

  @IsString()
  @IsNotEmpty()
  KAFKA_URL: string;

  @IsString()
  @IsNotEmpty()
  KAFKA_TOPIC: string;

  @IsString()
  @IsNotEmpty()
  GROUP_ID: string;

  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(10000)
  @Max(600000)
  SESSION_TIMEOUT: number;

  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(1000)
  @Max(30000)
  HERTBEAT_INTERVAL: number;

  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(1)
  @Max(100)
  MAXIN_FLIGHT_REQUESTS: number;

  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(1)
  @Max(50)
  LIMITKAFKA: number;

  // ----------------------------
  // ⏰ Variables de configuración de Jobs
  // ----------------------------

  @IsString()
  CRON_EXPRESSION: string;
}

/**
 * Función de validación de variables de entorno
 * Se ejecuta al iniciar la aplicación para validar todas las variables requeridas
 */
export function validateEnvironmentVariables(
  envConfig: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, envConfig, {
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error: ValidationError) => {
      const constraints = Object.values(error.constraints || {});
      return `❌ ${error.property}: ${constraints.join(', ')}`;
    });

    const errorMessage = [
      '🚨 Variables de entorno inválidas o faltantes:',
      '',
      ...errorMessages,
      '',
      '💡 Verifica tu archivo .env y asegúrate de que todas las variables requeridas estén definidas.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return validatedConfig;
}
