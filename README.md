# 🏗️ Template NestJS - Generador de Microservicios

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-yellow.svg)]()

Generador de proyectos y módulos NestJS con **Arquitectura Hexagonal**, soporte para **Oracle**, **SQL Server**, **MongoDB** y **Kafka**.

### Autor: Joel A. Paez Rodriguez
---

## 🎯 Características

### 🚀 Generador de Aplicaciones Completas

- ✅ Arquitectura hexagonal (Puertos y Adaptadores)
- ✅ Infraestructura compartida (Oracle, MSSQL, Kafka, HTTP)
- ✅ Fastify con compresión Brotli y seguridad (Helmet)
- ✅ APM con Elastic (tracing distribuido)
- ✅ Logger estructurado con Winston
- ✅ Transaction ID tracking (AsyncLocalStorage)
- ✅ Swagger/OpenAPI automático
- ✅ Validación de DTOs con class-validator
- ✅ Tests unitarios completos
- ✅ Dockerfile multi-stage optimizado
- ✅ Configuración de despliegue (dev, qa, prod)
- ✅ ESLint, Prettier, Commitlint configurados

### 📦 Generador de Módulos Hexagonales

- ✅ Domain Layer (Entities, Value Objects, Services, Ports)
- ✅ Application Layer (Use Cases, DTOs)
- ✅ Adapters Layer (Inbound: HTTP, Outbound: DB, Kafka)
- ✅ Infrastructure Layer (Stored Procedures, Kafka Topics)
- ✅ Tests (Unit, Integration, E2E)
- ✅ Soporte para Oracle, SQL Server, MongoDB
- ✅ Kafka Producer/Consumer con DLQ
- ✅ Autenticación (JWT, OAuth2)
- ✅ Schema Registry (Confluent)

---

## 📋 Requisitos

| Software | Versión Mínima |
|----------|----------------|
| Node.js | 20.x |
| npm | 10.x |
| NestJS CLI | 11.x |
| Git | 2.x |

---

## ⚡ Inicio Rápido

### 1. Instalar el Generador

```bash
# Clonar repositorio
git clone https://github.com/jouncato/template-main.git
cd template-main/schematics-package

# Instalar y compilar
npm install
npm run build
npm link
```

> **⚠️ Si obtienes error "Invalid schematic"**: Usa el menú interactivo (paso 2) o consulta [schematics-package/TROUBLESHOOTING.md](./schematics-package/TROUBLESHOOTING.md)

### 2. Usar el Menú Interactivo 🎮 (Recomendado)

```bash
# Opción 1: Desde schematics-package
npm run menu

# Opción 2: Comando global (después de npm link)
template-generate
```

El menú interactivo te guiará paso a paso para generar proyectos y módulos sin necesidad de recordar todos los parámetros.

### 3. O Usar Comandos Directos

```bash
# Generar aplicación
nest g @template/schematics:application my-service

# Navegar al proyecto
cd my-service

# Generar módulo
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=producer \
  --path=src/app

# Configurar e instalar
cp .env.example .env
npm install

# Ejecutar
npm run start:dev
```

### 3. Acceder a la Aplicación

- **API:** http://localhost:8080
- **Swagger:** http://localhost:8080/api

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Guía de inicio rápido (10 min) |
| [TECHNICAL_MANUAL.md](./TECHNICAL_MANUAL.md) | Manual técnico completo |
| [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) | Informe de validación |
| [schematics-package/README.md](./schematics-package/README.md) | Documentación de schematics |

---

## 🎛️ Comandos Disponibles

### Generar Aplicación

```bash
nest g @template/schematics:application <nombre> [opciones]

# Opciones principales:
#   --directory <dir>          Directorio destino
#   --package-manager <pm>     npm | yarn | pnpm
#   --skip-install             No instalar dependencias
#   --skip-git                 No inicializar git
```

### Generar Módulo Hexagonal

```bash
nest g @template/schematics:hexagonal-module <nombre> [opciones]

# Opciones principales:
#   --database <db>            oracle | mssql | mongodb | none
#   --kafka <mode>             none | producer | consumer | both
#   --crud-mode <mode>         stored-proc | orm | mixed
#   --ops <operations>         select,insert,update,delete
#   --auth <type>              none | jwt | oauth2
#   --path <path>              Ruta donde crear el módulo
```

---

## 📖 Ejemplos

### Microservicio de Pagos con Oracle y Kafka

```bash
# 1. Generar aplicación
nest g @template/schematics:application payments-service
cd payments-service

# 2. Generar módulo de pagos
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --auth=jwt \
  --path=src/app

# 3. Generar módulo de transacciones
nest g @template/schematics:hexagonal-module transactions \
  --database=oracle \
  --kafka=producer \
  --crud-mode=stored-proc \
  --ops=select,insert \
  --path=src/app

# 4. Configurar y ejecutar
cp .env.example .env
npm install
npm run start:dev
```

### API Gateway con MongoDB

```bash
# 1. Generar aplicación
nest g @template/schematics:application api-gateway
cd api-gateway

# 2. Generar módulo de usuarios
nest g @template/schematics:hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm \
  --kafka=producer \
  --auth=jwt \
  --path=src/app

# 3. Ejecutar
npm install
npm run start:dev
```

---

## 🏗️ Arquitectura Generada

### Proyecto Completo

```
my-service/
├── src/
│   ├── app/                    # Módulos de aplicación
│   │   ├── application/        # Servicios
│   │   ├── domain/             # DTOs e interfaces
│   │   ├── infrastructure/     # Adaptadores
│   │   └── interfaces/         # Controladores
│   ├── share/                  # Código compartido
│   │   ├── domain/             # Config, DTOs, Interfaces
│   │   ├── infrastructure/     # Oracle, MSSQL, Kafka, HTTP
│   │   └── interfaces/         # Filtros
│   ├── app.module.ts
│   └── main.ts
├── test/                       # Tests
├── deploy/                     # Configuración despliegue
├── Dockerfile
├── package.json
└── .env.example
```

### Módulo Hexagonal

```
payments/
├── domain/                     # Capa de dominio (pura)
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── ports/
├── application/                # Capa de aplicación
│   ├── usecases/
│   └── dtos/
├── adapters/                   # Capa de adaptadores
│   ├── inbound/                # HTTP, GraphQL
│   └── outbound/               # DB, Kafka, HTTP
├── infra/                      # Infraestructura
│   ├── db/                     # Stored procedures
│   └── kafka/                  # Topics, schemas
├── tests/                      # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── payments.module.ts
```

---

## 🔧 Tecnologías

### Backend

- **Framework:** NestJS 11.x
- **Runtime:** Node.js 20.x
- **Lenguaje:** TypeScript 5.9
- **HTTP Server:** Fastify 5.x
- **Validación:** class-validator, class-transformer

### Bases de Datos

- **Oracle:** oracledb 6.9 (Stored Procedures)
- **SQL Server:** mssql 11.0 (Stored Procedures)
- **MongoDB:** Mongoose (ORM)

### Mensajería

- **Kafka:** kafkajs 2.2
- **Schema Registry:** Confluent (opcional)

### Observabilidad

- **APM:** Elastic APM 4.13
- **Logger:** Winston 3.17
- **Tracing:** Transaction ID (AsyncLocalStorage)

### Testing

- **Framework:** Jest 29.7
- **E2E:** Supertest 7.1
- **Coverage:** Jest Coverage

### DevOps

- **Docker:** Multi-stage build
- **CI/CD:** GitHub Actions (opcional)
- **Quality:** SonarQube, ESLint, Prettier

---

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en watch mode
npm run test:watch
```

---

## 🐳 Docker

```bash
# Build
docker build -t my-service:latest .

# Run
docker run -p 8080:8080 --env-file .env my-service:latest

# Docker Compose (con Kafka)
cd src/app/<modulo>/infra/kafka
docker-compose -f docker-compose.kafka.yml up -d
```

---

## 📊 Estructura del Repositorio

```
template-main/
├── schematics-package/         # Generador de código
│   ├── src/
│   │   ├── application/        # Schematic: generar proyectos
│   │   └── hexagonal-module/   # Schematic: generar módulos
│   ├── scripts/                # Scripts de build
│   └── package.json
├── src/                        # Proyecto base (template)
│   ├── app/
│   └── share/
├── test/                       # Tests del proyecto base
├── deploy/                     # Configuración de despliegue
├── QUICKSTART.md               # Guía rápida
├── TECHNICAL_MANUAL.md         # Manual técnico
├── VALIDATION_REPORT.md        # Informe de validación
├── Dockerfile
└── package.json
```

---

## 🤝 Contribución

Este proyecto es mantenido por **Fábrica Digital Claro**.

Para contribuir:

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

---

## 📄 Licencia

**UNLICENSED** - Uso interno Fábrica Digital Claro

---

## 👥 Autores

**Célula Azure - Fábrica Digital Claro**

**Contacto:** desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com

---

## 🔗 Enlaces

- [NestJS Documentation](https://docs.nestjs.com/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Oracle PL/SQL Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/)
- [KafkaJS Documentation](https://kafka.js.org/)

---

**¡Comienza a construir microservicios enterprise-grade ahora! 🚀**
