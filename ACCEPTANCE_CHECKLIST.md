# Checklist de Aceptación - Schematics Hexagonales NestJS

**Proyecto**: @template/schematics
**Versión**: 1.0.0
**Fecha**: 2025-10-07

---

## 📋 Índice

1. [Generación de Código](#1-generación-de-código)
2. [Validaciones CLI](#2-validaciones-cli)
3. [Arquitectura Hexagonal](#3-arquitectura-hexagonal)
4. [Adaptadores de Base de Datos](#4-adaptadores-de-base-de-datos)
5. [Integración Kafka](#5-integración-kafka)
6. [Testing](#6-testing)
7. [Documentación](#7-documentación)
8. [CI/CD](#8-cicd)
9. [Seguridad](#9-seguridad)
10. [Performance](#10-performance)

---

## 1. Generación de Código

### 1.1 Instalación y Build

- [ ] **AC-001**: El paquete `@template/schematics` compila sin errores
  ```bash
  cd schematics-package && npm run build
  # Esperado: Exit code 0, carpeta dist/ creada
  ```

- [ ] **AC-002**: El paquete puede instalarse globalmente
  ```bash
  npm install -g @template/schematics
  # Esperado: Instalación exitosa, comando disponible
  ```

- [ ] **AC-003**: El paquete puede linkearse localmente
  ```bash
  npm link
  # Esperado: Link creado, puede usarse con nest g
  ```

### 1.2 Generación Básica

- [ ] **AC-004**: Genera módulo con opciones mínimas
  ```bash
  nest g @template/schematics:hexagonal-module test --database=none
  # Esperado: Módulo generado en src/app/test/
  ```

- [ ] **AC-005**: Dry-run muestra cambios sin escribir archivos
  ```bash
  nest g @template/schematics:hexagonal-module test --database=oracle --dry-run
  # Esperado: Lista de archivos a crear, no modifica filesystem
  ```

- [ ] **AC-006**: Genera todos los archivos core requeridos
  ```bash
  # Después de generar módulo
  ls src/app/test/test.module.ts
  ls src/app/test/README.module.md
  # Esperado: Ambos archivos existen
  ```

### 1.3 Opciones de Base de Datos

- [ ] **AC-007**: Genera módulo con Oracle
  ```bash
  nest g @template/schematics:hexagonal-module payments --database=oracle
  # Esperado: Repository adapter Oracle + stored-proc scripts
  ```

- [ ] **AC-008**: Genera módulo con MSSQL
  ```bash
  nest g @template/schematics:hexagonal-module orders --database=mssql
  # Esperado: Repository adapter MSSQL + T-SQL procedures
  ```

- [ ] **AC-009**: Genera módulo con MongoDB
  ```bash
  nest g @template/schematics:hexagonal-module users --database=mongodb
  # Esperado: Repository adapter Mongoose + schemas
  ```

- [ ] **AC-010**: Genera módulo sin base de datos
  ```bash
  nest g @template/schematics:hexagonal-module external --database=none
  # Esperado: Repository adapter in-memory o mock
  ```

### 1.4 Opciones de Kafka

- [ ] **AC-011**: Genera módulo con Kafka producer
  ```bash
  nest g @template/schematics:hexagonal-module events --database=none --kafka=producer
  # Esperado: Event publisher adapter
  ```

- [ ] **AC-012**: Genera módulo con Kafka consumer
  ```bash
  nest g @template/schematics:hexagonal-module jobs --database=none --kafka=consumer
  # Esperado: Event consumer adapter
  ```

- [ ] **AC-013**: Genera módulo con Kafka producer y consumer
  ```bash
  nest g @template/schematics:hexagonal-module saga --database=oracle --kafka=both
  # Esperado: Ambos adapters + configuración topics
  ```

### 1.5 Operaciones CRUD

- [ ] **AC-014**: Genera solo operaciones especificadas
  ```bash
  nest g @template/schematics:hexagonal-module readonly --database=oracle --ops=select
  # Esperado: Solo método findById/findAll en repository, no save/update/delete
  ```

- [ ] **AC-015**: Genera operaciones completas por defecto
  ```bash
  nest g @template/schematics:hexagonal-module full --database=mssql
  # Esperado: select, insert, update, delete implementados
  ```

---

## 2. Validaciones CLI

### 2.1 Validación de Nombre

- [ ] **AC-016**: Rechaza nombres inválidos (mayúsculas)
  ```bash
  nest g @template/schematics:hexagonal-module Payment --database=oracle
  # Esperado: Error con mensaje claro: "Module name must start with lowercase"
  ```

- [ ] **AC-017**: Rechaza nombres inválidos (caracteres especiales)
  ```bash
  nest g @template/schematics:hexagonal-module pay_ment --database=oracle
  # Esperado: Error: "Only lowercase letters, numbers, and hyphens allowed"
  ```

- [ ] **AC-018**: Acepta nombres válidos (kebab-case)
  ```bash
  nest g @template/schematics:hexagonal-module user-management --database=oracle
  # Esperado: Módulo generado exitosamente
  ```

### 2.2 Validación de Opciones

- [ ] **AC-019**: Rechaza combinación inválida (MongoDB + stored-proc)
  ```bash
  nest g @template/schematics:hexagonal-module test --database=mongodb --crud-mode=stored-proc
  # Esperado: Error: "MongoDB does not support stored procedures. Use --crud-mode=orm"
  ```

- [ ] **AC-020**: Rechaza operación inválida
  ```bash
  nest g @template/schematics:hexagonal-module test --database=oracle --ops=select,upsert
  # Esperado: Error: "Invalid operations: upsert. Valid: select, insert, update, delete"
  ```

- [ ] **AC-021**: Muestra warning para combinaciones no recomendadas
  ```bash
  nest g @template/schematics:hexagonal-module test --database=oracle --crud-mode=orm
  # Esperado: Warning: "Stored procedures recommended for Oracle"
  ```

### 2.3 Validación de Módulo Existente

- [ ] **AC-022**: Rechaza generar módulo duplicado
  ```bash
  nest g @template/schematics:hexagonal-module payments --database=oracle
  nest g @template/schematics:hexagonal-module payments --database=mssql
  # Esperado: Error en segundo comando: "Module 'payments' already exists"
  ```

---

## 3. Arquitectura Hexagonal

### 3.1 Estructura de Capas

- [ ] **AC-023**: Genera capa de Dominio completa
  ```bash
  # Después de generar módulo
  ls src/app/test/domain/entities/*.entity.ts
  ls src/app/test/domain/value-objects/*.value-object.ts
  ls src/app/test/domain/services/*.service.ts
  ls src/app/test/domain/ports/*.port.ts
  # Esperado: Todos los archivos existen
  ```

- [ ] **AC-024**: Genera capa de Aplicación completa
  ```bash
  ls src/app/test/application/usecases/*.usecase.ts
  ls src/app/test/application/dtos/*.dto.ts
  # Esperado: Use cases (create, get, update, delete) y DTOs generados
  ```

- [ ] **AC-025**: Genera capa de Adapters completa
  ```bash
  ls src/app/test/adapters/inbound/*.controller.ts
  ls src/app/test/adapters/outbound/db/*.adapter.ts
  # Esperado: Inbound (HTTP controller) y outbound (repository) generados
  ```

### 3.2 Inversión de Dependencias

- [ ] **AC-026**: Domain no depende de infraestructura
  ```bash
  # Revisar imports en domain/entities/*.entity.ts
  grep -r "from '@nestjs" src/app/test/domain/entities/
  # Esperado: Sin imports de NestJS (excepto @Injectable en services)
  ```

- [ ] **AC-027**: Use cases dependen de puertos (interfaces)
  ```bash
  # Revisar imports en application/usecases/*.usecase.ts
  grep "I.*Repository" src/app/test/application/usecases/create-*.usecase.ts
  # Esperado: Imports de interfaces I*Repository, no clases concretas
  ```

- [ ] **AC-028**: Adapters implementan puertos
  ```bash
  # Revisar adapter
  grep "implements I.*Repository" src/app/test/adapters/outbound/db/*.adapter.ts
  # Esperado: Adapter implementa la interfaz del puerto
  ```

### 3.3 Módulo NestJS (Wiring)

- [ ] **AC-029**: Módulo registra adapters con tokens DI
  ```bash
  # Revisar test.module.ts
  grep "provide: I.*Repository" src/app/test/test.module.ts
  grep "useClass:.*Adapter" src/app/test/test.module.ts
  # Esperado: Providers usan tokens de interfaces, no clases concretas
  ```

- [ ] **AC-030**: Módulo exporta use cases
  ```bash
  grep "exports: \[" src/app/test/test.module.ts
  # Esperado: Use cases exportados para uso en otros módulos
  ```

---

## 4. Adaptadores de Base de Datos

### 4.1 Oracle (Stored Procedures)

- [ ] **AC-031**: Repository adapter Oracle generado correctamente
  ```bash
  cat src/app/test/adapters/outbound/db/oracle/test-repository.adapter.ts
  # Esperado: Implementa métodos findById, save, update, delete
  ```

- [ ] **AC-032**: Stored procedures SQL generados
  ```bash
  ls src/app/test/infra/db/oracle/stored-procs/*.sql
  # Esperado: Archivo con procedures PRC_TEST_SELECT, PRC_TEST_INSERT, etc.
  ```

- [ ] **AC-033**: Stored procedures usan bind parameters
  ```bash
  grep "p_id.*BIND_IN" src/app/test/adapters/outbound/db/oracle/*.adapter.ts
  # Esperado: Todos los parámetros usan oracledb.BIND_IN/BIND_OUT
  ```

- [ ] **AC-034**: Cursores manejados correctamente
  ```bash
  grep "CURSOR" src/app/test/adapters/outbound/db/oracle/*.adapter.ts
  # Esperado: SYS_REFCURSOR usado para SELECT operations
  ```

- [ ] **AC-035**: README Oracle con instrucciones deployment
  ```bash
  ls src/app/test/infra/db/oracle/README-ORACLE.md
  # Esperado: Archivo con pasos para desplegar SPs
  ```

### 4.2 MSSQL (Stored Procedures)

- [ ] **AC-036**: Repository adapter MSSQL generado correctamente
  ```bash
  cat src/app/test/adapters/outbound/db/mssql/test-repository.adapter.ts
  # Esperado: Usa SqlServerService.executeProcedure
  ```

- [ ] **AC-037**: T-SQL procedures generados
  ```bash
  cat src/app/test/infra/db/mssql/stored-procs/*.sql
  grep "CREATE OR ALTER PROCEDURE usp_Test_Insert" src/app/test/infra/db/mssql/stored-procs/*.sql
  # Esperado: Procedures con convención usp_<Module>_<Operation>
  ```

- [ ] **AC-038**: Parameters typados correctamente (sql.*)
  ```bash
  grep "sql\\.VarChar\\|sql\\.Int\\|sql\\.DateTime" src/app/test/adapters/outbound/db/mssql/*.adapter.ts
  # Esperado: Uso de tipos mssql correctos
  ```

- [ ] **AC-039**: TRY/CATCH en procedures
  ```bash
  grep "BEGIN TRY" src/app/test/infra/db/mssql/stored-procs/*.sql
  grep "BEGIN CATCH" src/app/test/infra/db/mssql/stored-procs/*.sql
  # Esperado: Manejo de errores en cada procedure
  ```

### 4.3 MongoDB (Mongoose)

- [ ] **AC-040**: Repository adapter MongoDB generado correctamente
  ```bash
  cat src/app/test/adapters/outbound/db/mongodb/test-repository.adapter.ts
  # Esperado: Usa Mongoose models
  ```

- [ ] **AC-041**: Schema Mongoose definido
  ```bash
  grep "@Schema" src/app/test/adapters/outbound/db/mongodb/*.adapter.ts
  # Esperado: Decorador @Schema con opciones
  ```

- [ ] **AC-042**: Indexes configurados
  ```bash
  grep "@Prop.*index: true" src/app/test/adapters/outbound/db/mongodb/*.adapter.ts
  # Esperado: Campos indexados marcados
  ```

---

## 5. Integración Kafka

### 5.1 Producer

- [ ] **AC-043**: Event publisher adapter generado
  ```bash
  cat src/app/test/adapters/outbound/kafka/test-event-publisher.adapter.ts
  # Esperado: Implementa métodos publishCreated, publishUpdated, publishDeleted
  ```

- [ ] **AC-044**: Headers de correlación incluidos
  ```bash
  grep "x-correlation-id" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Headers con correlationId en cada mensaje
  ```

- [ ] **AC-045**: Idempotence configurado
  ```bash
  grep "idempotent" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Producer config con enable.idempotence
  ```

### 5.2 Consumer

- [ ] **AC-046**: Event consumer adapter generado
  ```bash
  cat src/app/test/adapters/outbound/kafka/test-event-consumer.adapter.ts
  # Esperado: Implementa onModuleInit, subscribe, run
  ```

- [ ] **AC-047**: Heartbeat implementado
  ```bash
  grep "heartbeat" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Llamadas periódicas a heartbeat durante procesamiento
  ```

- [ ] **AC-048**: Commit manual configurado
  ```bash
  grep "commitOffsetsIfNecessary" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Control manual de offsets
  ```

### 5.3 DLQ (Dead Letter Queue)

- [ ] **AC-049**: Lógica DLQ implementada
  ```bash
  grep "\.dlq" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Mensajes fallidos enviados a topic .dlq
  ```

- [ ] **AC-050**: Retry con exponential backoff
  ```bash
  grep "retry\\|backoff" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Lógica de reintentos antes de DLQ
  ```

### 5.4 Schema Registry

- [ ] **AC-051**: Schemas Avro generados (si --schema-registry=confluent)
  ```bash
  ls src/app/test/infra/kafka/schemas/*.avsc
  # Esperado: Schemas en formato Avro
  ```

- [ ] **AC-052**: Schema Registry client configurado
  ```bash
  grep "SchemaRegistry" src/app/test/adapters/outbound/kafka/*.adapter.ts
  # Esperado: Configuración de Confluent Schema Registry
  ```

---

## 6. Testing

### 6.1 Tests Unitarios (Domain)

- [ ] **AC-053**: Tests de entidades generados
  ```bash
  ls src/app/test/tests/unit/domain/*.spec.ts
  # Esperado: Tests para entities y value objects
  ```

- [ ] **AC-054**: Tests unitarios son puros (sin I/O)
  ```bash
  grep -r "import.*oracledb\\|import.*mssql\\|import.*mongoose" src/app/test/tests/unit/
  # Esperado: Sin imports de librerías de infraestructura
  ```

- [ ] **AC-055**: Tests de domain services generados
  ```bash
  grep "describe.*DomainService" src/app/test/tests/unit/domain/*.spec.ts
  # Esperado: Tests de lógica de negocio
  ```

### 6.2 Tests Unitarios (Use Cases)

- [ ] **AC-056**: Tests de use cases con mocks
  ```bash
  ls src/app/test/tests/unit/usecases/*.spec.ts
  # Esperado: Test para cada use case
  ```

- [ ] **AC-057**: Mocks de puertos (repositories, event publishers)
  ```bash
  grep "jest\\.fn()" src/app/test/tests/unit/usecases/*.spec.ts
  # Esperado: Puertos mockeados con jest
  ```

- [ ] **AC-058**: Coverage objetivo: >80%
  ```bash
  npm test -- --coverage src/app/test/tests/unit/
  # Esperado: Coverage report con >80% en usecases
  ```

### 6.3 Tests de Integración

- [ ] **AC-059**: Tests de repository con testcontainers
  ```bash
  ls src/app/test/tests/integration/*.spec.ts
  grep "testcontainers" src/app/test/tests/integration/*.spec.ts
  # Esperado: Tests usando containers reales
  ```

- [ ] **AC-060**: Tests de Kafka con testcontainers
  ```bash
  grep "KafkaContainer" src/app/test/tests/integration/kafka.spec.ts
  # Esperado: Kafka container para tests
  ```

- [ ] **AC-061**: Tests ejecutan sin errores
  ```bash
  npm run test:integration -- --testPathPattern=test/integration
  # Esperado: Exit code 0, todos los tests pasan
  ```

### 6.4 Tests E2E

- [ ] **AC-062**: Tests E2E generados
  ```bash
  ls src/app/test/tests/e2e/*.e2e.spec.ts
  # Esperado: Tests end-to-end del módulo
  ```

- [ ] **AC-063**: Tests E2E cubren flujo completo
  ```bash
  grep "POST\\|GET\\|PUT\\|DELETE" src/app/test/tests/e2e/*.e2e.spec.ts
  # Esperado: Tests de endpoints HTTP completos
  ```

---

## 7. Documentación

### 7.1 README del Módulo

- [ ] **AC-064**: README.module.md generado
  ```bash
  ls src/app/test/README.module.md
  # Esperado: Archivo existe con contenido
  ```

- [ ] **AC-065**: README contiene variables de entorno
  ```bash
  grep "Environment Variables" src/app/test/README.module.md
  # Esperado: Sección con todas las vars necesarias
  ```

- [ ] **AC-066**: README contiene instrucciones de uso
  ```bash
  grep "Usage" src/app/test/README.module.md
  # Esperado: Ejemplos de cómo usar el módulo
  ```

### 7.2 README del Paquete Schematics

- [ ] **AC-067**: README principal completo
  ```bash
  cat schematics-package/README.md
  # Esperado: Instalación, uso, ejemplos, troubleshooting
  ```

- [ ] **AC-068**: Ejemplos de comandos funcionan
  ```bash
  # Copiar comando de README y ejecutar
  nest g @template/schematics:hexagonal-module test --database=oracle
  # Esperado: Comando ejecuta sin errores
  ```

### 7.3 Comentarios en Código

- [ ] **AC-069**: Código generado tiene JSDoc
  ```bash
  grep "/\\*\\*" src/app/test/**/*.ts | wc -l
  # Esperado: >50% de funciones/clases documentadas
  ```

- [ ] **AC-070**: Comentarios explican arquitectura hexagonal
  ```bash
  grep -i "hexagonal\\|port\\|adapter" src/app/test/**/*.ts
  # Esperado: Comentarios educativos sobre patrón
  ```

---

## 8. CI/CD

### 8.1 Pipeline de Validación

- [ ] **AC-071**: Pipeline lint ejecuta correctamente
  ```bash
  # Simular GitHub Actions localmente
  cd schematics-package && npm run lint
  # Esperado: Exit code 0
  ```

- [ ] **AC-072**: Pipeline test ejecuta correctamente
  ```bash
  cd schematics-package && npm test
  # Esperado: Todos los tests pasan
  ```

- [ ] **AC-073**: Pipeline build ejecuta correctamente
  ```bash
  cd schematics-package && npm run build
  # Esperado: Artefactos en dist/
  ```

### 8.2 Validación de Generación

- [ ] **AC-074**: Job validate-generation pasa para Oracle
  ```bash
  # Ver .github/workflows/schematics-ci.yml
  # Ejecutar matrix test-case: oracle-kafka
  # Esperado: Módulo genera y compila
  ```

- [ ] **AC-075**: Job validate-generation pasa para MSSQL
  ```bash
  # Matrix test-case: mssql-producer
  # Esperado: Módulo genera y compila
  ```

- [ ] **AC-076**: Job validate-generation pasa para MongoDB
  ```bash
  # Matrix test-case: mongodb-orm
  # Esperado: Módulo genera y compila
  ```

### 8.3 Tests de Integración en CI

- [ ] **AC-077**: Job integration-test ejecuta testcontainers
  ```bash
  # Ver job integration-test en workflow
  # Esperado: Tests con containers reales pasan
  ```

---

## 9. Seguridad

### 9.1 Prevención SQL Injection

- [ ] **AC-078**: Oracle adapter usa bind parameters
  ```bash
  grep "BIND_IN" src/app/test/adapters/outbound/db/oracle/*.adapter.ts
  # Esperado: Todos los parámetros usan bind parameters
  ```

- [ ] **AC-079**: MSSQL adapter usa parámetros tipados
  ```bash
  grep "request\\.input" src/app/test/adapters/outbound/db/mssql/*.adapter.ts
  # Esperado: No hay concatenación de strings en SQL
  ```

- [ ] **AC-080**: Stored procedures validan inputs
  ```bash
  grep "IF.*IS NULL" src/app/test/infra/db/oracle/stored-procs/*.sql
  # Esperado: Validaciones de NULL en procedures
  ```

### 9.2 Secrets Management

- [ ] **AC-081**: No hay secrets hardcodeados
  ```bash
  grep -r "password.*=.*'\\|api_key.*=.*'" src/
  # Esperado: Sin matches (todos vienen de env vars)
  ```

- [ ] **AC-082**: README menciona gestión de secrets
  ```bash
  grep -i "secret\\|credential\\|password" src/app/test/README.module.md
  # Esperado: Instrucciones de seguridad incluidas
  ```

### 9.3 Audit de Dependencias

- [ ] **AC-083**: npm audit sin vulnerabilidades críticas
  ```bash
  cd schematics-package && npm audit --audit-level=high
  # Esperado: 0 vulnerabilidades high/critical
  ```

---

## 10. Performance

### 10.1 Tiempo de Generación

- [ ] **AC-084**: Generación de módulo <10 segundos
  ```bash
  time nest g @template/schematics:hexagonal-module perf-test --database=oracle --kafka=both
  # Esperado: real < 10s
  ```

### 10.2 Tamaño de Artefactos

- [ ] **AC-085**: Package schematics <5MB
  ```bash
  du -sh schematics-package/dist/
  # Esperado: < 5MB
  ```

### 10.3 Compilación TypeScript

- [ ] **AC-086**: Módulo generado compila <5 segundos
  ```bash
  cd test-project && time npm run build
  # Esperado: Compilación exitosa < 5s
  ```

---

## ✅ Resumen de Aceptación

### Criterios Obligatorios (MUST PASS)

**Total**: 86 criterios de aceptación

- [ ] **86/86 criterios pasados** (100%)

### Criterios Bloqueantes (Mínimo para Release)

Los siguientes criterios SON bloqueantes para release v1.0.0:

1. **Generación básica funciona** (AC-001 a AC-010)
2. **Validaciones CLI correctas** (AC-016 a AC-022)
3. **Arquitectura hexagonal válida** (AC-023 a AC-030)
4. **Al menos 1 DB adapter completo** (AC-031 a AC-042, elegir Oracle o MSSQL)
5. **Tests unitarios generan y pasan** (AC-053 a AC-058)
6. **Documentación mínima** (AC-064 a AC-068)
7. **CI/CD pipeline funciona** (AC-071 a AC-073)
8. **Sin vulnerabilidades críticas** (AC-083)

### Criterios Deseables (Nice to Have)

Los siguientes pueden posponerse para v1.1.0:

- AC-051 a AC-052: Schema Registry (si --schema-registry=none es default)
- AC-074 a AC-077: Matrix completa de validación (puede reducirse)
- AC-084 a AC-086: Performance optimizations

---

## 📊 Tracking

| Categoría | Total | Completados | % |
|-----------|-------|-------------|---|
| **1. Generación de Código** | 15 | 0 | 0% |
| **2. Validaciones CLI** | 7 | 0 | 0% |
| **3. Arquitectura Hexagonal** | 8 | 0 | 0% |
| **4. Adaptadores DB** | 12 | 0 | 0% |
| **5. Integración Kafka** | 10 | 0 | 0% |
| **6. Testing** | 13 | 0 | 0% |
| **7. Documentación** | 7 | 0 | 0% |
| **8. CI/CD** | 7 | 0 | 0% |
| **9. Seguridad** | 6 | 0 | 0% |
| **10. Performance** | 3 | 0 | 0% |
| **TOTAL** | **86** | **0** | **0%** |

---

## 🚀 Instrucciones de Ejecución

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd template-main

# 2. Instalar dependencias schematics
cd schematics-package
npm install
npm run build

# 3. Linkear schematics
npm link

# 4. Crear proyecto de prueba
cd ..
npx @nestjs/cli new test-project --skip-git
cd test-project
npm install
```

### Ejecutar Checklist Completo

```bash
# Ejecutar script automático de validación
cd template-main
npm run test:acceptance

# O ejecutar manualmente cada sección
bash ./scripts/run-acceptance-tests.sh
```

### Reportar Resultados

Después de ejecutar tests, actualizar tabla de tracking arriba y crear issue si alguno falla:

```bash
# Generar reporte
npm run generate-acceptance-report

# Output: ACCEPTANCE_REPORT_2025-10-07.md
```

---

## 📝 Notas

- Cada criterio debe pasar independientemente
- Si un criterio falla, documentar el error en issue de GitHub
- Repetir tests después de fix
- Release solo cuando criterios bloqueantes están al 100%

---

**Ejecutado por**: _________________
**Fecha**: _________________
**Resultado**: PASS ☑️ / FAIL ☐
**Notas**: _________________

---

**Elaborado por:** Célula Azure - Fábrica Digital Claro
