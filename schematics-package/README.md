# @template/schematics - NestJS Application & Module Generator

NestJS Schematics para generar **aplicaciones completas** y **módulos hexagonales** con soporte para Oracle, SQL Server, MongoDB y Kafka.

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Schematics Disponibles](#schematics-disponibles)
  - [Application - Generar Proyecto Completo](#application---generar-proyecto-completo)
  - [Hexagonal Module - Generar Módulos](#hexagonal-module---generar-módulos)
- [Uso Rápido](#uso-rápido)
- [Opciones del CLI](#opciones-del-cli)
- [Arquitectura Generada](#arquitectura-generada)
- [Ejemplos](#ejemplos)
- [Estructura de Archivos](#estructura-de-archivos)
- [Bases de Datos Soportadas](#bases-de-datos-soportadas)
- [Integración Kafka](#integración-kafka)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Instalación

### Instalación Global

```bash
npm install -g @template/schematics
```

### Instalación en Proyecto

```bash
npm install --save-dev @template/schematics
```

### Build desde Código Fuente

```bash
cd schematics-package
npm install
npm run build
npm link
```

---

## 🎯 Schematics Disponibles

### Application - Generar Proyecto Completo

Genera una aplicación NestJS completa con arquitectura hexagonal, infraestructura compartida (Oracle, MSSQL, Kafka, HTTP), configuración de despliegue y tests.

```bash
nest g @template/schematics:application <nombre-proyecto> [opciones]

# Alias disponibles
nest g @template/schematics:app <nombre-proyecto>
nest g @template/schematics:new <nombre-proyecto>
```

**Características del proyecto generado:**
- ✅ Arquitectura hexagonal base
- ✅ Infraestructura compartida (Oracle, MSSQL, Kafka, HTTP)
- ✅ Configuración APM (Elastic)
- ✅ Logger personalizado (Winston)
- ✅ Transaction ID tracking
- ✅ Fastify con compresión y seguridad
- ✅ Swagger/OpenAPI
- ✅ Tests unitarios completos
- ✅ Dockerfile multi-stage
- ✅ Configuración de despliegue
- ✅ ESLint, Prettier, Commitlint

**Opciones:**

| Opción | Valores | Default | Descripción |
|--------|---------|---------|-------------|
| `name` | `string` | - | Nombre de la aplicación (requerido) |
| `--directory` | `string` | `<name>` | Directorio donde crear el proyecto |
| `--package-manager` | `npm` \| `yarn` \| `pnpm` | `npm` | Gestor de paquetes |
| `--skip-git` | `boolean` | `false` | No inicializar repositorio git |
| `--skip-install` | `boolean` | `false` | No instalar dependencias |
| `--strict` | `boolean` | `false` | Modo estricto de TypeScript |

**Ejemplo:**

```bash
# Generar aplicación completa
nest g @template/schematics:application my-microservice

# Con opciones personalizadas
nest g @template/schematics:application my-app \
  --package-manager=pnpm \
  --skip-install \
  --directory=apps/my-app
```

### Hexagonal Module - Generar Módulos

Genera módulos individuales siguiendo arquitectura hexagonal dentro de un proyecto existente.

```bash
nest g @template/schematics:hexagonal-module <nombre-modulo> [opciones]

# Alias disponibles
nest g @template/schematics:hex-module <nombre-modulo>
nest g @template/schematics:hm <nombre-modulo>
```

---

## ⚡ Uso Rápido

### Generar Aplicación Completa

```bash
# Crear nuevo microservicio
nest g @template/schematics:application payments-service

# Navegar al proyecto
cd payments-service

# Instalar dependencias (si usaste --skip-install)
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run start:dev
```

### Generar Módulo con Oracle y Kafka

```bash
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --path=src/app
```

### Generar Módulo con SQL Server (Solo Stored Procedures)

```bash
nest g @template/schematics:hexagonal-module orders \
  --database=mssql \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --path=src/app
```

### Generar Módulo con MongoDB

```bash
nest g @template/schematics:hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm \
  --path=src/app
```

### Dry Run (Preview sin Escribir)

```bash
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --dry-run
```

---

## 🎛️ Opciones del CLI

### Opciones Requeridas

| Opción | Valores | Descripción |
|--------|---------|-------------|
| `name` | `string` | Nombre del módulo (kebab-case, ej: `payments`, `user-management`) |
| `--database` | `oracle` \| `mssql` \| `mongodb` \| `none` | Base de datos a utilizar |

### Opciones Opcionales

| Opción | Valores | Default | Descripción |
|--------|---------|---------|-------------|
| `--kafka` | `none` \| `producer` \| `consumer` \| `both` | `none` | Capacidades Kafka |
| `--path` | `string` | `src/app` | Ruta donde crear el módulo |
| `--crud-mode` | `stored-proc` \| `orm` \| `mixed` | `stored-proc` | Modo de implementación CRUD |
| `--ops` | `string` | `select,insert,update,delete` | Operaciones a implementar (CSV) |
| `--dry-run` | `boolean` | `false` | Mostrar cambios sin escribir |
| `--apply-migrations` | `boolean` | `false` | Generar scripts de migración DB |
| `--auth` | `none` \| `jwt` \| `oauth2` | `none` | Adaptador de autenticación |
| `--schema-registry` | `none` \| `confluent` | `none` | Registro de esquemas Kafka |
| `--skip-tests` | `boolean` | `false` | Omitir generación de tests |
| `--flat` | `boolean` | `false` | Estructura plana (sin subdirectorios) |

### Validaciones

El schematic valida automáticamente:

- ✅ Nombre del módulo (patrón `^[a-z][a-z0-9-]*$`)
- ✅ Opciones de base de datos válidas
- ✅ Compatibilidad entre opciones (ej: MongoDB no soporta stored-proc)
- ✅ Operaciones válidas (`select`, `insert`, `update`, `delete`)
- ✅ Módulo no existe previamente

### Mensajes de Error Claros

```bash
❌ Invalid module name: "Payment"
Module name must:
  - Start with a lowercase letter
  - Contain only lowercase letters, numbers, and hyphens
  - Example: "payments", "user-management", "order-service"
```

---

## 🏗️ Arquitectura Generada

### Principios de Arquitectura Hexagonal

El schematic genera módulos siguiendo estos principios:

1. **Domain Layer (Centro)**: Lógica de negocio pura, sin dependencias externas
   - Entities (inmutables)
   - Value Objects
   - Domain Services
   - Ports (interfaces)

2. **Application Layer**: Orquestación de casos de uso
   - Use Cases
   - DTOs
   - Coordinación entre dominio e infraestructura

3. **Adapters Layer (Periferia)**: Implementaciones de puertos
   - **Inbound Adapters**: HTTP Controllers, GraphQL Resolvers
   - **Outbound Adapters**: Repositories (DB), Event Publishers (Kafka), HTTP Clients

4. **Inversión de Dependencias**: Adapters dependen de Ports (no al revés)

### Estructura de Directorios

```
src/app/payments/
├── domain/
│   ├── entities/
│   │   └── payment.entity.ts              # Entidad de dominio (inmutable)
│   ├── value-objects/
│   │   └── payment-id.value-object.ts     # Value Object (inmutable)
│   ├── services/
│   │   └── payment-domain.service.ts      # Lógica de negocio pura
│   └── ports/
│       ├── i-payment-repository.port.ts   # Puerto saliente (DB)
│       └── i-payment-event-publisher.port.ts # Puerto saliente (Kafka)
│
├── application/
│   ├── usecases/
│   │   ├── create-payment.usecase.ts      # Caso de uso: crear
│   │   ├── get-payment-by-id.usecase.ts   # Caso de uso: consultar
│   │   ├── update-payment.usecase.ts      # Caso de uso: actualizar
│   │   └── delete-payment.usecase.ts      # Caso de uso: eliminar
│   └── dtos/
│       ├── create-payment.dto.ts          # DTO entrada
│       ├── update-payment.dto.ts          # DTO entrada (parcial)
│       └── payment-response.dto.ts        # DTO salida
│
├── adapters/
│   ├── inbound/
│   │   └── http.controller.ts             # Adaptador HTTP (REST API)
│   └── outbound/
│       ├── db/
│       │   ├── payment-repository.adapter.ts     # Implementación puerto DB
│       │   └── stored-proc-mapper.util.ts        # Mapeo DB <-> Domain
│       └── kafka/
│           ├── payment-event-publisher.adapter.ts # Implementación puerto Kafka
│           └── payment-event-consumer.adapter.ts  # Consumer Kafka
│
├── infra/
│   ├── db/
│   │   └── stored-procs/
│   │       └── payment-procedures.sql     # Scripts SQL para SPs
│   └── kafka/
│       ├── topics.config.json             # Configuración topics
│       └── schemas/
│           └── payment-event.avsc         # Schemas Avro (si schema-registry)
│
├── tests/
│   ├── unit/
│   │   ├── domain/                        # Tests dominio (puros)
│   │   └── usecases/                      # Tests casos de uso (con mocks)
│   ├── integration/
│   │   ├── repository.spec.ts             # Tests con testcontainers
│   │   └── kafka.spec.ts                  # Tests Kafka
│   └── e2e/
│       └── payment.e2e.spec.ts            # Tests end-to-end
│
├── payments.module.ts                      # Módulo NestJS (wiring DI)
└── README.module.md                        # Documentación del módulo
```

---

## 📚 Ejemplos

### Ejemplo 1: Módulo de Pagos con Oracle y Kafka

```bash
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --auth=jwt \
  --schema-registry=confluent
```

**Genera:**
- ✅ Repository adapter con stored procedures Oracle
- ✅ Kafka producer para eventos (payment.created, payment.updated)
- ✅ Kafka consumer para procesamiento asíncrono
- ✅ JWT authentication guard en controller
- ✅ Schemas Avro para Confluent Schema Registry
- ✅ Scripts SQL con procedures: PRC_PAYMENTS_SELECT, PRC_PAYMENTS_INSERT, PRC_PAYMENTS_UPDATE

### Ejemplo 2: Módulo de Usuarios con MongoDB

```bash
nest g @template/schematics:hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm \
  --kafka=producer \
  --path=src/app
```

**Genera:**
- ✅ Repository adapter con Mongoose
- ✅ Schemas MongoDB
- ✅ Kafka producer para eventos de usuario
- ✅ Indexes y validaciones MongoDB

### Ejemplo 3: Módulo Sin Base de Datos (Proxy a API Externa)

```bash
nest g @template/schematics:hexagonal-module external-api \
  --database=none \
  --kafka=none \
  --path=src/app
```

**Genera:**
- ✅ Repository adapter in-memory (o mock)
- ✅ HTTP client adapter para API externa
- ✅ Domain entities y use cases

---

## 🗄️ Bases de Datos Soportadas

### Oracle (Stored Procedures)

**Características:**
- Stored procedures con packages PL/SQL
- SYS_REFCURSOR para result sets
- Bind parameters con tipos Oracle (VARCHAR2, NUMBER, DATE, CLOB)
- Transacciones gestionadas en PL/SQL
- Manejo de cursors automático

**Ejemplo de Stored Procedure Generado:**

```sql
CREATE OR REPLACE PROCEDURE PRC_PAYMENTS_INSERT (
  p_id IN VARCHAR2,
  p_name IN VARCHAR2,
  p_amount IN NUMBER,
  p_created_at IN DATE,
  p_result OUT NUMBER
) AS
BEGIN
  INSERT INTO payments (id, name, amount, created_at)
  VALUES (p_id, p_name, p_amount, p_created_at);

  p_result := 1; -- Success
  COMMIT;
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    p_result := -1; -- Duplicate
    ROLLBACK;
  WHEN OTHERS THEN
    p_result := 0; -- Error
    ROLLBACK;
END;
```

**Deployment:**
```bash
sqlplus user/password@connectstring @src/app/payments/infra/db/stored-procs/payment-procedures.sql
```

### SQL Server (Stored Procedures)

**Características:**
- Stored procedures con T-SQL
- Parámetros OUTPUT para resultados
- TRY/CATCH para manejo de errores
- Transacciones con BEGIN TRAN/COMMIT/ROLLBACK
- Tipos MSSQL (VARCHAR, INT, DATETIME2, BIT)

**Ejemplo:**

```sql
CREATE OR ALTER PROCEDURE usp_Payments_Insert
  @Id NVARCHAR(50),
  @Name NVARCHAR(200),
  @Amount DECIMAL(18,2),
  @CreatedAt DATETIME2,
  @Result INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO Payments (Id, Name, Amount, CreatedAt)
    VALUES (@Id, @Name, @Amount, @CreatedAt);

    SET @Result = 1; -- Success
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    SET @Result = 0; -- Error
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END
```

**Deployment:**
```bash
sqlcmd -S server -d database -U user -P password -i src/app/payments/infra/db/stored-procs/payment-procedures.sql
```

### MongoDB (Mongoose ORM)

**Características:**
- Schemas con Mongoose
- Validaciones en schema
- Indexes automáticos
- Métodos de modelo personalizados
- Soporte para agregaciones

**Ejemplo de Schema Generado:**

```typescript
@Schema({ collection: 'payments', timestamps: true })
export class PaymentDocument {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;
}
```

---

## 📡 Integración Kafka

### Producer (Publicar Eventos)

El schematic genera un adapter que implementa el puerto `IPaymentEventPublisher`:

```typescript
// Puerto (domain/ports)
export abstract class IPaymentEventPublisher {
  abstract publishCreated(event: PaymentCreatedEvent): Promise<void>;
  abstract publishUpdated(event: PaymentUpdatedEvent): Promise<void>;
  abstract publishDeleted(event: PaymentDeletedEvent): Promise<void>;
}

// Adapter (adapters/outbound/kafka)
@Injectable()
export class PaymentEventPublisherAdapter implements IPaymentEventPublisher {
  async publishCreated(event: PaymentCreatedEvent): Promise<void> {
    await this.kafkaProducer.send({
      topic: 'org.company.payments.created',
      messages: [{
        key: event.paymentId,
        value: JSON.stringify(event),
        headers: {
          'x-correlation-id': event.correlationId,
          'x-event-type': 'PaymentCreated',
        },
      }],
    });
  }
}
```

### Consumer (Procesar Eventos)

```typescript
@Injectable()
export class PaymentEventConsumerAdapter implements OnModuleInit {
  async onModuleInit() {
    await this.consumer.subscribe({
      topic: 'org.company.payments.commands',
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // Procesar mensaje
        await this.processPaymentCommand(message);
      },
    });
  }
}
```

### DLQ (Dead Letter Queue)

El adapter incluye lógica de retry y envío a DLQ:

```typescript
private async handleFailedMessage(message: KafkaMessage, error: Error) {
  const attempts = parseInt(message.headers['x-attempts'] || '0');

  if (attempts >= this.maxRetries) {
    // Enviar a DLQ
    await this.producer.send({
      topic: `${originalTopic}.dlq`,
      messages: [{
        ...message,
        headers: {
          ...message.headers,
          'x-error': error.message,
          'x-failed-at': new Date().toISOString(),
        },
      }],
    });
  } else {
    // Retry con exponential backoff
    await this.scheduleRetry(message, attempts + 1);
  }
}
```

### Schema Registry (Confluent)

Si se especifica `--schema-registry=confluent`, se genera:

```json
// infra/kafka/schemas/payment-event.avsc
{
  "type": "record",
  "name": "PaymentCreatedEvent",
  "namespace": "com.company.payments",
  "fields": [
    { "name": "eventId", "type": "string" },
    { "name": "paymentId", "type": "string" },
    { "name": "amount", "type": "double" },
    { "name": "timestamp", "type": "long", "logicalType": "timestamp-millis" }
  ]
}
```

---

## 🧪 Testing

### Tests Unitarios (Domain y Use Cases)

Los tests unitarios son **puros** y **rápidos**, sin dependencias externas:

```typescript
describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
  let mockRepository: jest.Mocked<IPaymentRepository>;
  let mockEventPublisher: jest.Mocked<IPaymentEventPublisher>;

  beforeEach(() => {
    // Mocks de puertos
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockEventPublisher = {
      publishCreated: jest.fn(),
    } as any;

    useCase = new CreatePaymentUseCase(
      mockRepository,
      mockEventPublisher,
      mockDomainService,
      mockLogger,
    );
  });

  it('should create payment and publish event', async () => {
    // Arrange
    const dto = { name: 'Test Payment', amount: 100 };
    mockRepository.save.mockResolvedValue(mockEntity);

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publishCreated).toHaveBeenCalledTimes(1);
    expect(result.id).toBeDefined();
  });
});
```

### Tests de Integración (Adapters con Testcontainers)

```typescript
describe('PaymentRepositoryAdapter (Oracle Integration)', () => {
  let container: StartedTestContainer;
  let repository: PaymentRepositoryAdapter;

  beforeAll(async () => {
    // Iniciar Oracle con testcontainers
    container = await new GenericContainer('gvenzl/oracle-xe')
      .withExposedPorts(1521)
      .withEnvironment({ ORACLE_PASSWORD: 'test' })
      .start();

    // Configurar repository con DB real
    const oracleService = new OracleService(/* config from container */);
    repository = new PaymentRepositoryAdapter(oracleService, logger);

    // Ejecutar migrations (stored procedures)
    await runMigrations(container);
  });

  afterAll(async () => {
    await container.stop();
  });

  it('should insert and retrieve payment from Oracle', async () => {
    // Arrange
    const entity = PaymentEntity.create({ name: 'Test', amount: 100 });

    // Act
    await repository.save(entity);
    const retrieved = await repository.findById(entity.id);

    // Assert
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Test');
  });
});
```

### Tests E2E (End-to-End)

```bash
npm run test:e2e
```

```typescript
describe('Payment Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/payments (POST) should create payment', () => {
    return request(app.getHttpServer())
      .post('/payments')
      .send({ name: 'Test Payment', amount: 100 })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('Test Payment');
      });
  });
});
```

---

## 🔧 Troubleshooting

### Error: "Module already exists"

```bash
❌ Module "payments" already exists at src/app/payments
Choose a different name or delete the existing module first.
```

**Solución:** Eliminar el módulo existente o usar otro nombre.

### Error: "Invalid combination: MongoDB does not support stored procedures"

```bash
❌ Invalid combination: MongoDB does not support stored procedures
Use --crud-mode=orm for MongoDB
```

**Solución:** Usar `--crud-mode=orm` con MongoDB.

### Warning: "Using Kafka without schema registry"

```bash
⚠️  WARNING: Using Kafka without schema registry.
   Schema registry (Confluent) is recommended for production.
   Consider using --schema-registry=confluent
```

**Acción:** Agregar `--schema-registry=confluent` para producción.

### Oracle Errors

| Error | Causa | Solución |
|-------|-------|----------|
| ORA-01017 | Invalid username/password | Verificar credenciales en `.env` |
| ORA-12154 | TNS:could not resolve connect string | Verificar `DB_CONNECTSTRING` |
| ORA-00001 | Unique constraint violated | ID duplicado, usar otro ID |

### SQL Server Errors

| Error | Causa | Solución |
|-------|-------|----------|
| Login failed | Credenciales incorrectas | Verificar `DB_USERNAME` y `DB_PASSWORD` |
| Cannot open database | Base de datos no existe | Crear DB o verificar `DB_DATABASE` |

---

## 📖 Documentación Adicional

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Oracle PL/SQL Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
- [KafkaJS Documentation](https://kafka.js.org/)

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

---

## 📄 Licencia

UNLICENSED - Uso interno Fábrica Digital Claro

---

## 👥 Autores

**Célula Azure - Fábrica Digital Claro**

Para soporte, contactar: desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com
