# 📘 Manual Técnico - Generación de Proyectos NestJS

**Versión:** 1.0.0  
**Fecha:** 2025-10-08  
**Autor:** Fábrica Digital Claro  
**Repositorio:** `template-main`

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación del Generador](#instalación-del-generador)
4. [Schematic: Application](#schematic-application)
5. [Schematic: Hexagonal Module](#schematic-hexagonal-module)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Configuración Post-Generación](#configuración-post-generación)
8. [Troubleshooting](#troubleshooting)
9. [Referencia Completa de Parámetros](#referencia-completa-de-parámetros)

---

## 1. Introducción

Este manual documenta el proceso completo para generar proyectos NestJS utilizando el sistema de **Schematics** personalizado `@template/schematics`. El generador permite crear:

- **Aplicaciones completas** con arquitectura hexagonal
- **Módulos hexagonales** individuales con soporte para múltiples bases de datos y Kafka

### Arquitectura del Sistema

```
@template/schematics
├── application          → Genera proyectos completos
└── hexagonal-module     → Genera módulos dentro de proyectos
```

---

## 2. Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Node.js** | 20.x o superior | Runtime de JavaScript |
| **npm** | 10.x o superior | Gestor de paquetes |
| **NestJS CLI** | 11.x o superior | CLI de NestJS |
| **Git** | 2.x o superior | Control de versiones |

### Verificación de Requisitos

```bash
# Verificar versiones instaladas
node --version    # Debe ser >= 20.x
npm --version     # Debe ser >= 10.x
nest --version    # Debe ser >= 11.x
git --version     # Debe ser >= 2.x
```

### Instalación de NestJS CLI

```bash
npm install -g @nestjs/cli
```

---

## 3. Instalación del Generador

### Opción A: Instalación desde Código Fuente (Desarrollo)

```bash
# 1. Clonar el repositorio
git clone https://github.com/jouncato/template-main.git
cd template-main

# 2. Navegar al directorio de schematics
cd schematics-package

# 3. Instalar dependencias
npm install

# 4. Compilar el schematic
npm run build

# 5. Crear enlace global
npm link

# 6. Verificar instalación
npm list -g @template/schematics
```

### Opción B: Instalación desde NPM (Producción)

```bash
# Instalación global
npm install -g @template/schematics

# O instalación en proyecto específico
npm install --save-dev @template/schematics
```

### Verificación de Instalación

```bash
# Listar schematics disponibles
nest g --collection=@template/schematics --help

# Debe mostrar:
# - application (aliases: app, new)
# - hexagonal-module (aliases: hex-module, hm)
```

---

## 4. Schematic: Application

### 4.1 Descripción

Genera una aplicación NestJS completa con:
- ✅ Arquitectura hexagonal base
- ✅ Infraestructura compartida (Oracle, MSSQL, Kafka, HTTP)
- ✅ Configuración APM (Elastic)
- ✅ Logger personalizado (Winston)
- ✅ Transaction ID tracking
- ✅ Fastify con compresión y seguridad
- ✅ Swagger/OpenAPI
- ✅ Tests unitarios
- ✅ Dockerfile multi-stage
- ✅ Configuración de despliegue

### 4.2 Sintaxis del Comando

```bash
nest g -c @template/schematics application <nombre> [opciones]

# Alias disponibles
nest g @template/schematics:app <nombre> [opciones]
nest g @template/schematics:new <nombre> [opciones]
```

### 4.3 Parámetros

#### Parámetro Posicional (Requerido)

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `<nombre>` | `string` | Nombre de la aplicación | `payments-service` |

**Validaciones:**
- Debe comenzar con una letra (mayúscula o minúscula)
- Puede contener letras, números, guiones (`-`) y guiones bajos (`_`)
- Patrón regex: `^[a-zA-Z][a-zA-Z0-9-_]*$`

#### Opciones (Flags)

| Flag | Alias | Tipo | Default | Descripción |
|------|-------|------|---------|-------------|
| `--directory` | `--dir` | `string` | `<nombre>` | Directorio donde crear el proyecto |
| `--package-manager` | `--pm` | `enum` | `npm` | Gestor de paquetes: `npm`, `yarn`, `pnpm` |
| `--skip-git` | `--sg` | `boolean` | `false` | No inicializar repositorio git |
| `--skip-install` | `--si` | `boolean` | `false` | No instalar dependencias automáticamente |
| `--strict` | - | `boolean` | `false` | Habilitar modo estricto de TypeScript |
| `--dry-run` | `-d` | `boolean` | `false` | Simular sin escribir archivos |

### 4.4 Ejemplos de Uso

#### Ejemplo 1: Generación Básica

```bash
nest g -c @template/schematics application my-microservice
```

**Resultado:**
- Crea directorio `my-microservice/`
- Instala dependencias con npm
- Inicializa git (si no se especifica `--skip-git`)

#### Ejemplo 2: Generación con Directorio Personalizado

```bash
nest g -c @template/schematics application payments \
  --directory=apps/payments-service
```

**Resultado:**
- Crea directorio `apps/payments-service/`
- El nombre del proyecto en `package.json` será `payments`

#### Ejemplo 3: Generación sin Instalación (CI/CD)

```bash
nest g -c @template/schematics application api-gateway \
  --skip-install \
  --skip-git
```

**Resultado:**
- Crea proyecto sin ejecutar `npm install`
- No inicializa repositorio git
- Útil para pipelines de CI/CD

#### Ejemplo 4: Generación con pnpm

```bash
nest g -c @template/schematics application orders-service \
  --package-manager=pnpm
```

**Resultado:**
- Usa `pnpm install` en lugar de `npm install`
- Genera `pnpm-lock.yaml`

#### Ejemplo 5: Dry Run (Vista Previa)

```bash
nest g -c @template/schematics application demo \
  --dry-run
```

**Resultado:**
- Muestra qué archivos se crearían
- NO escribe ningún archivo
- Útil para verificar antes de generar

### 4.5 Estructura Generada

```
<nombre-proyecto>/
├── src/
│   ├── app/
│   │   ├── application/              # Servicios de aplicación
│   │   │   ├── app.service.ts
│   │   │   └── job.service.ts
│   │   ├── domain/                   # DTOs e interfaces
│   │   │   ├── dto/
│   │   │   └── interfaces/
│   │   ├── healtcheck.backup/        # Módulo healthcheck backup
│   │   ├── infrastructure/           # Adaptadores de infraestructura
│   │   │   └── mssql/
│   │   └── interfaces/               # Controladores y módulos
│   │       ├── controller/
│   │       └── module/
│   ├── share/
│   │   ├── domain/                   # Lógica compartida
│   │   │   ├── config/               # APM, Logger, Interceptors, Txid
│   │   │   ├── dto/                  # DTOs compartidos
│   │   │   ├── interfaces/           # Interfaces compartidas
│   │   │   └── resources/            # Constantes y configuración
│   │   ├── infrastructure/           # Infraestructura compartida
│   │   │   ├── http/                 # Cliente HTTP
│   │   │   ├── kafka/                # Consumer Kafka
│   │   │   ├── mssql/                # SQL Server service
│   │   │   └── oracle/               # Oracle service
│   │   ├── interfaces/               # Filtros de excepciones
│   │   └── utils/                    # Utilidades
│   ├── app.module.ts                 # Módulo raíz
│   └── main.ts                       # Punto de entrada
├── test/                             # Tests unitarios
│   ├── app/
│   └── share/
├── deploy/                           # Configuración de despliegue
│   ├── deploy_dev.params
│   ├── deploy_qa.params
│   ├── deploy_prod.params
│   └── template.json
├── .dockerignore
├── .env.example                      # Variables de entorno de ejemplo
├── .gitignore
├── .nvmrc                            # Versión de Node.js
├── .prettierrc
├── commitlint.config.js              # Configuración de commitlint
├── Dockerfile                        # Multi-stage build
├── eslint.config.mjs                 # Configuración de ESLint
├── nest-cli.json                     # Configuración de NestJS CLI
├── package.json                      # Dependencias del proyecto
├── sonar-project.js                  # Configuración de SonarQube
├── tsconfig.build.json
└── tsconfig.json                     # Configuración de TypeScript
```

---

## 5. Schematic: Hexagonal Module

### 5.1 Descripción

Genera módulos individuales siguiendo arquitectura hexagonal dentro de un proyecto existente.

### 5.2 Sintaxis del Comando

```bash
nest g -c @template/schematics hexagonal-module <nombre> [opciones]

# Alias disponibles
nest g @template/schematics:hex-module <nombre> [opciones]
nest g @template/schematics:hm <nombre> [opciones]
```

### 5.3 Parámetros

#### Parámetro Posicional (Requerido)

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `<nombre>` | `string` | Nombre del módulo (kebab-case) | `payments`, `user-management` |

**Validaciones:**
- Debe comenzar con una letra minúscula
- Solo letras minúsculas, números y guiones
- Patrón regex: `^[a-z][a-z0-9-]*$`

#### Opciones (Flags)

| Flag | Tipo | Default | Valores Permitidos | Descripción |
|------|------|---------|-------------------|-------------|
| `--database` | `enum` | **REQUERIDO** | `oracle`, `mssql`, `mongodb`, `none` | Base de datos a utilizar |
| `--kafka` | `enum` | `none` | `none`, `producer`, `consumer`, `both` | Capacidades Kafka |
| `--path` | `string` | `src/app` | Cualquier ruta válida | Ruta donde crear el módulo |
| `--crud-mode` | `enum` | `stored-proc` | `stored-proc`, `orm`, `mixed` | Modo de implementación CRUD |
| `--ops` | `string` | `select,insert,update,delete` | CSV de operaciones | Operaciones a implementar |
| `--auth` | `enum` | `none` | `none`, `jwt`, `oauth2` | Adaptador de autenticación |
| `--schema-registry` | `enum` | `none` | `none`, `confluent` | Registro de esquemas Kafka |
| `--skip-tests` | `boolean` | `false` | `true`, `false` | Omitir generación de tests |
| `--flat` | `boolean` | `false` | `true`, `false` | Estructura plana (sin subdirectorios) |
| `--include-health` | `boolean` | `true` | `true`, `false` | Incluir endpoint de health check |
| `--dry-run` | `boolean` | `false` | `true`, `false` | Simular sin escribir archivos |

### 5.4 Validaciones y Restricciones

#### Combinaciones Inválidas

| Combinación | Razón | Solución |
|-------------|-------|----------|
| `--database=mongodb --crud-mode=stored-proc` | MongoDB no soporta stored procedures | Usar `--crud-mode=orm` |
| `--schema-registry=confluent --kafka=none` | Schema registry requiere Kafka | Usar `--kafka=producer` o `--kafka=both` |

#### Operaciones Válidas (`--ops`)

- `select` - Consulta de datos
- `insert` - Inserción de datos
- `update` - Actualización de datos
- `delete` - Eliminación de datos

**Formato:** Lista separada por comas, sin espacios.  
**Ejemplo:** `--ops=select,insert,update`

### 5.5 Ejemplos de Uso

#### Ejemplo 1: Módulo con Oracle y Kafka

```bash
nest g -c @template/schematics hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --path=src/app
```

**Genera:**
- Repository adapter con stored procedures Oracle
- Kafka producer para eventos
- Kafka consumer para procesamiento asíncrono
- Scripts SQL con procedures

#### Ejemplo 2: Módulo con SQL Server

```bash
nest g -c @template/schematics hexagonal-module orders \
  --database=mssql \
  --crud-mode=stored-proc \
  --ops=select,insert,update,delete \
  --path=src/app
```

**Genera:**
- Repository adapter con stored procedures T-SQL
- Scripts SQL para SQL Server

#### Ejemplo 3: Módulo con MongoDB

```bash
nest g -c @template/schematics hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm \
  --kafka=producer \
  --path=src/app
```

**Genera:**
- Repository adapter con Mongoose
- Schemas MongoDB
- Kafka producer para eventos de usuario

#### Ejemplo 4: Módulo sin Base de Datos (API Externa)

```bash
nest g -c @template/schematics hexagonal-module external-api \
  --database=none \
  --kafka=none \
  --path=src/app
```

**Genera:**
- Repository adapter in-memory
- HTTP client adapter para API externa
- Domain entities y use cases

#### Ejemplo 5: Módulo con Autenticación JWT

```bash
nest g -c @template/schematics hexagonal-module secure-payments \
  --database=oracle \
  --kafka=producer \
  --auth=jwt \
  --path=src/app
```

**Genera:**
- JWT authentication guard en controller
- Módulo con protección de rutas

### 5.6 Estructura Generada

```
src/app/<nombre-modulo>/
├── domain/
│   ├── entities/
│   │   └── <nombre>.entity.ts              # Entidad de dominio (inmutable)
│   ├── value-objects/
│   │   └── <nombre>-id.value-object.ts     # Value Object
│   ├── services/
│   │   └── <nombre>-domain.service.ts      # Lógica de negocio pura
│   └── ports/
│       ├── i-<nombre>-repository.port.ts   # Puerto saliente (DB)
│       └── i-<nombre>-event-publisher.port.ts # Puerto saliente (Kafka)
├── application/
│   ├── usecases/
│   │   ├── create-<nombre>.usecase.ts      # Caso de uso: crear
│   │   ├── get-<nombre>-by-id.usecase.ts   # Caso de uso: consultar
│   │   ├── update-<nombre>.usecase.ts      # Caso de uso: actualizar
│   │   └── delete-<nombre>.usecase.ts      # Caso de uso: eliminar
│   ├── dtos/
│   │   ├── create-<nombre>.dto.ts          # DTO entrada
│   │   ├── update-<nombre>.dto.ts          # DTO entrada (parcial)
│   │   └── <nombre>-response.dto.ts        # DTO salida
│   └── health/
│       └── <nombre>-health.service.ts      # Health check
├── adapters/
│   ├── inbound/
│   │   └── http.controller.ts              # Adaptador HTTP (REST API)
│   └── outbound/
│       ├── db/
│       │   ├── <nombre>-repository.adapter.ts     # Implementación puerto DB
│       │   └── stored-proc-mapper.util.ts         # Mapeo DB <-> Domain
│       └── kafka/
│           ├── <nombre>-event-publisher.adapter.ts # Implementación puerto Kafka
│           └── <nombre>-event-consumer.adapter.ts  # Consumer Kafka
├── infra/
│   ├── db/
│   │   └── stored-procs/
│   │       └── <nombre>-procedures.sql     # Scripts SQL para SPs
│   └── kafka/
│       ├── docker-compose.kafka.yml        # Docker Compose para Kafka local
│       └── README-KAFKA.md                 # Documentación Kafka
├── tests/
│   ├── unit/
│   │   ├── domain/                         # Tests dominio (puros)
│   │   └── usecases/                       # Tests casos de uso (con mocks)
│   ├── integration/
│   │   ├── repository.spec.ts              # Tests con testcontainers
│   │   └── kafka.spec.ts                   # Tests Kafka
│   └── e2e/
│       └── <nombre>.e2e.spec.ts            # Tests end-to-end
├── <nombre>.module.ts                      # Módulo NestJS (wiring DI)
└── README.module.md                        # Documentación del módulo
```

---

## 6. Ejemplos Prácticos

### 6.1 Caso de Uso: Microservicio de Pagos Completo

#### Paso 1: Generar Aplicación Base

```bash
nest g -c @template/schematics application payments-service
cd payments-service
```

#### Paso 2: Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
SERVICE_NAME="payments-service"
PORT="8080"
SERVICE_PREFIX="/MS/COM/Payments/Service/V1"

# Oracle
DB_USERNAME="payments_user"
DB_PASSWORD="secure_password"
DB_CONNECTSTRING="localhost:1521/XEPDB1"
DB_POOL_ALIAS="payments_pool"

# Kafka
KAFKA_URL="localhost:9092"
KAFKA_TOPIC="payments.events"
GROUP_ID="payments-service-group"
```

#### Paso 3: Generar Módulo de Pagos

```bash
nest g -c @template/schematics hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --auth=jwt \
  --path=src/app
```

#### Paso 4: Generar Módulo de Transacciones

```bash
nest g -c @template/schematics hexagonal-module transactions \
  --database=oracle \
  --kafka=producer \
  --crud-mode=stored-proc \
  --ops=select,insert \
  --path=src/app
```

#### Paso 5: Instalar Dependencias y Ejecutar

```bash
npm install
npm run build
npm run start:dev
```

### 6.2 Caso de Uso: Proyecto Demo

```bash
# Generar proyecto demo
nest g -c @template/schematics application demo \
  --skip-install

cd demo

# Generar módulo de ejemplo con MongoDB
nest g -c @template/schematics hexagonal-module products \
  --database=mongodb \
  --crud-mode=orm \
  --kafka=producer \
  --path=src/app

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env

# Ejecutar
npm run start:dev
```

---

## 7. Configuración Post-Generación

### 7.1 Variables de Entorno Requeridas

#### Servicio

```env
SERVICE_NAME="<nombre-servicio>"
PORT="8080"
TIMEOUT="30000"
SERVICE_PREFIX="/MS/COM/<Dominio>/<Servicio>/V1"
CONTROLLER_PATH="/Method"
MAX_LOG_SIZE=50000
```

#### HTTP Client

```env
HTTP_TIMEOUT=5000
DISABLE_SSL_VERIFICATION=true
HTTP_KEEP_ALIVE=true
```

#### APM (Elastic)

```env
ELASTIC_APM_SERVER_URL="https://apm-server:8200"
ELASTIC_APM_ENVIRONMENT="development"
ELASTIC_APM_ACTIVE="true"
```

#### Oracle

```env
DB_USERNAME="<usuario>"
DB_PASSWORD="<contraseña>"
DB_CONNECTSTRING="<host>:<puerto>/<servicio>"
DB_POOL_ALIAS="<alias>"
DB_POOL_MIN=10
DB_POOL_MAX=100
DB_POOL_INCREMENT=5
DB_POOL_TIMEOUT=60
DB_QUEUE_TIMEOUT=5000
DB_STMT_CACHE_SIZE=50
```

#### SQL Server

```env
DB_USERNAME="<usuario>"
DB_PASSWORD="<contraseña>"
DB_SERVER="<host>"
DB_PORT=1433
DB_DATABASE="<base_datos>"
```

#### Kafka

```env
KAFKA_URL="localhost:9092"
KAFKA_TOPIC="<topic>"
GROUP_ID="<grupo>"
SESSION_TIMEOUT=600000
HERTBEAT_INTERVAL=10000
MAXIN_FLIGHT_REQUESTS=1
LIMITKAFKA=15
```

### 7.2 Despliegue de Stored Procedures

#### Oracle

```bash
sqlplus <usuario>/<contraseña>@<connectstring> @src/app/<modulo>/infra/db/stored-procs/<modulo>-procedures.sql
```

#### SQL Server

```bash
sqlcmd -S <servidor> -d <database> -U <usuario> -P <contraseña> -i src/app/<modulo>/infra/db/stored-procs/<modulo>-procedures.sql
```

### 7.3 Ejecución con Docker

```bash
# Build
docker build -t <nombre-servicio>:latest .

# Run
docker run -p 8080:8080 --env-file .env <nombre-servicio>:latest
```

---

## 8. Troubleshooting

### Problema: "Module already exists"

**Error:**
```
❌ Module "payments" already exists at src/app/payments
```

**Solución:**
- Eliminar el módulo existente o usar otro nombre
- Verificar que no exista el directorio antes de generar

### Problema: "Invalid combination: MongoDB does not support stored procedures"

**Error:**
```
❌ Invalid combination: MongoDB does not support stored procedures
```

**Solución:**
```bash
# Usar ORM mode con MongoDB
nest g -c @template/schematics hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm
```

### Problema: Tests fallan por variables de entorno

**Error:**
```
❌ Variables de entorno inválidas o faltantes
```

**Solución:**
```bash
# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar .env con valores reales
```

### Problema: "Schema registry requires Kafka"

**Error:**
```
❌ Schema registry requires Kafka to be enabled
```

**Solución:**
```bash
# Habilitar Kafka al usar schema registry
nest g -c @template/schematics hexagonal-module payments \
  --kafka=producer \
  --schema-registry=confluent
```

---

## 9. Referencia Completa de Parámetros

### 9.1 Application Schematic

| Parámetro | Tipo | Requerido | Default | Validación | Ejemplo |
|-----------|------|-----------|---------|------------|---------|
| `name` | `string` | ✅ Sí | - | `^[a-zA-Z][a-zA-Z0-9-_]*$` | `my-service` |
| `--directory` | `string` | ❌ No | `<name>` | Ruta válida | `apps/my-service` |
| `--package-manager` | `npm\|yarn\|pnpm` | ❌ No | `npm` | Enum | `pnpm` |
| `--skip-git` | `boolean` | ❌ No | `false` | - | `true` |
| `--skip-install` | `boolean` | ❌ No | `false` | - | `true` |
| `--strict` | `boolean` | ❌ No | `false` | - | `true` |
| `--dry-run` | `boolean` | ❌ No | `false` | - | `true` |

### 9.2 Hexagonal Module Schematic

| Parámetro | Tipo | Requerido | Default | Validación | Ejemplo |
|-----------|------|-----------|---------|------------|---------|
| `name` | `string` | ✅ Sí | - | `^[a-z][a-z0-9-]*$` | `payments` |
| `--database` | `oracle\|mssql\|mongodb\|none` | ✅ Sí | - | Enum | `oracle` |
| `--kafka` | `none\|producer\|consumer\|both` | ❌ No | `none` | Enum | `both` |
| `--path` | `string` | ❌ No | `src/app` | Ruta válida | `src/modules` |
| `--crud-mode` | `stored-proc\|orm\|mixed` | ❌ No | `stored-proc` | Enum | `orm` |
| `--ops` | `string` | ❌ No | `select,insert,update,delete` | CSV válido | `select,insert` |
| `--auth` | `none\|jwt\|oauth2` | ❌ No | `none` | Enum | `jwt` |
| `--schema-registry` | `none\|confluent` | ❌ No | `none` | Enum | `confluent` |
| `--skip-tests` | `boolean` | ❌ No | `false` | - | `true` |
| `--flat` | `boolean` | ❌ No | `false` | - | `true` |
| `--include-health` | `boolean` | ❌ No | `true` | - | `false` |
| `--dry-run` | `boolean` | ❌ No | `false` | - | `true` |

---

## 📞 Soporte

Para soporte técnico, contactar:

**Email:** desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com  
**Equipo:** Célula Azure - Fábrica Digital Claro

---

**Fin del Manual Técnico**
