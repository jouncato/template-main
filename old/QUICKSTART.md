# 🚀 Guía de Inicio Rápido - Schematics Hexagonales NestJS

**5 minutos para generar tu primer módulo hexagonal**

---

## ⚡ Setup Inicial (Solo Primera Vez)

### 1. Verificar Requisitos

```powershell
# Node.js 20+
node --version
# Debe mostrar: v20.x.x o superior

# npm
npm --version
# Debe mostrar: 10.x.x o superior
```

Si no tienes Node.js 20+, descárgalo de: https://nodejs.org/

### 2. Instalar el Paquete de Schematics

```powershell
# Navegar al directorio del paquete
cd C:\Proj-Dev\template-main\schematics-package

# Instalar dependencias
npm install

# Compilar
npm run build

# Linkear globalmente
npm link

# Verificar instalación
npm list -g @template/schematics
```

**✅ Deberías ver**: `@template/schematics@1.0.0`

---

## 🎨 Generar Tu Primer Módulo

### Opción 1: Módulo con Oracle y Kafka (Full Stack)

```powershell
# Navegar a tu proyecto NestJS
cd C:\Proj-Dev\tu-proyecto-nestjs

# Generar módulo de pagos
npx nest g @template/schematics:hexagonal-module payments `
  --database=oracle `
  --kafka=both `
  --crud-mode=stored-proc `
  --path=src/app
```

**¿Qué genera?**
- ✅ Domain layer (entities, value objects, ports)
- ✅ Application layer (use cases, DTOs)
- ✅ Oracle repository adapter con stored procedures
- ✅ Kafka producer y consumer adapters
- ✅ HTTP REST controller
- ✅ Tests (unit, integration, e2e)
- ✅ Scripts SQL para stored procedures
- ✅ Configuración Kafka topics
- ✅ README.module.md

**Total**: ~50 archivos en `src/app/payments/`

### Opción 2: Módulo Simple (Solo Lógica)

```powershell
# Módulo sin base de datos ni Kafka
npx nest g @template/schematics:hexagonal-module calculator `
  --database=none `
  --kafka=none `
  --path=src/app
```

**¿Qué genera?**
- ✅ Domain layer puro
- ✅ Use cases
- ✅ HTTP controller
- ✅ Tests unitarios

**Total**: ~20 archivos en `src/app/calculator/`

### Opción 3: Módulo con MongoDB

```powershell
# Módulo con MongoDB (Mongoose)
npx nest g @template/schematics:hexagonal-module users `
  --database=mongodb `
  --crud-mode=orm `
  --kafka=producer `
  --path=src/app
```

**¿Qué genera?**
- ✅ Domain layer
- ✅ MongoDB repository adapter (Mongoose)
- ✅ Schemas con validaciones
- ✅ Kafka producer para eventos
- ✅ Tests con testcontainers

---

## 🔍 Previsualizar sin Escribir (Dry Run)

```powershell
# Ver qué archivos se generarían SIN crearlos
npx nest g @template/schematics:hexagonal-module test-module `
  --database=oracle `
  --kafka=both `
  --dry-run
```

**Salida ejemplo:**
```
CREATE src/app/test-module/test-module.module.ts
CREATE src/app/test-module/domain/entities/test-module.entity.ts
CREATE src/app/test-module/domain/ports/i-test-module-repository.port.ts
CREATE src/app/test-module/application/usecases/create-test-module.usecase.ts
...
```

---

## 📝 Registrar el Módulo en Tu App

Después de generar un módulo, debes importarlo:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PaymentsModule } from './app/payments/payments.module';  // ⬅️ Agregar

@Module({
  imports: [
    // ... otros imports
    PaymentsModule,  // ⬅️ Agregar
  ],
})
export class AppModule {}
```

---

## ⚙️ Configurar Variables de Entorno

El módulo generado necesita configuración:

```env
# .env

# Oracle (si --database=oracle)
PAYMENTS_DB_USERNAME=usuario_oracle
PAYMENTS_DB_PASSWORD=password_oracle
PAYMENTS_DB_CONNECTSTRING=localhost:1521/XE

# MSSQL (si --database=mssql)
PAYMENTS_DB_SERVER=localhost
PAYMENTS_DB_PORT=1433
PAYMENTS_DB_DATABASE=mi_base_datos
PAYMENTS_DB_USERNAME=sa
PAYMENTS_DB_PASSWORD=YourPassword123

# MongoDB (si --database=mongodb)
PAYMENTS_MONGODB_URI=mongodb://localhost:27017/mi_base_datos

# Kafka (si --kafka=producer|consumer|both)
PAYMENTS_KAFKA_BROKERS=localhost:9092
PAYMENTS_KAFKA_TOPIC=org.company.payments.events
PAYMENTS_KAFKA_GROUP_ID=payments-consumer-group
```

**Ver detalles**: Cada módulo genera su propio `README.module.md` con las variables completas.

---

## 🗄️ Desplegar Stored Procedures (Oracle/MSSQL)

### Oracle

```powershell
# 1. Navegar a scripts SQL
cd src/app/payments/infra/db/oracle/stored-procs

# 2. Conectar a Oracle
sqlplus usuario/password@connectstring

# 3. Ejecutar script
SQL> @payments-procedures.sql

# 4. Verificar
SQL> SELECT object_name FROM user_procedures WHERE object_name LIKE 'PRC_PAYMENTS%';
```

### SQL Server

```powershell
# Usando sqlcmd
sqlcmd -S localhost -U sa -P YourPassword123 -d mi_base_datos `
  -i src/app/payments/infra/db/mssql/stored-procs/payments-procedures.sql
```

---

## 🧪 Ejecutar Tests

```powershell
# Tests unitarios (rápidos, sin dependencias)
npm test -- src/app/payments/tests/unit

# Tests de integración (con testcontainers)
npm run test:integration -- src/app/payments/tests/integration

# Tests E2E (flujo completo)
npm run test:e2e -- src/app/payments/tests/e2e

# Todos los tests con coverage
npm test -- --coverage src/app/payments
```

---

## 🚀 Arrancar la Aplicación

```powershell
# Modo desarrollo (hot reload)
npm run start:dev

# Verificar endpoint
curl http://localhost:3000/api/payments
```

**Swagger UI**: http://localhost:3000/api

---

## 📚 Opciones Avanzadas del CLI

### Todas las Opciones

```powershell
npx nest g @template/schematics:hexagonal-module <nombre> `
  --database=<oracle|mssql|mongodb|none> `
  --kafka=<none|producer|consumer|both> `
  --crud-mode=<stored-proc|orm|mixed> `
  --ops=<select,insert,update,delete> `
  --auth=<none|jwt|oauth2> `
  --schema-registry=<none|confluent> `
  --path=<ruta> `
  --dry-run `
  --skip-tests `
  --flat
```

### Ejemplos de Uso

**1. Módulo de solo lectura (read-only)**
```powershell
npx nest g @template/schematics:hexagonal-module reports `
  --database=oracle `
  --ops=select `
  --path=src/app
```

**2. Módulo con autenticación JWT**
```powershell
npx nest g @template/schematics:hexagonal-module secure-api `
  --database=mssql `
  --auth=jwt `
  --path=src/app
```

**3. Módulo Kafka con Schema Registry**
```powershell
npx nest g @template/schematics:hexagonal-module events `
  --database=none `
  --kafka=both `
  --schema-registry=confluent `
  --path=src/app
```

**4. Módulo con operaciones específicas**
```powershell
npx nest g @template/schematics:hexagonal-module audit-log `
  --database=oracle `
  --ops=select,insert `
  --path=src/app
```

---

## ✅ Validar la Instalación

Ejecuta el checklist de aceptación:

```powershell
# Ejecutar todos los tests de validación
.\scripts\run-acceptance-tests.ps1

# Solo validaciones rápidas (sin build)
.\scripts\run-acceptance-tests.ps1 -SkipBuild
```

**Esperado**: ✅ 90%+ de tests pasando

---

## 🔧 Troubleshooting Rápido

### Error: "Cannot find module @template/schematics"

```powershell
cd schematics-package
npm link
```

### Error: "Module already exists"

```powershell
# Eliminar el módulo existente
Remove-Item -Recurse -Force src/app/payments

# Generar de nuevo
npx nest g @template/schematics:hexagonal-module payments --database=oracle
```

### Error al compilar TypeScript

```powershell
# Instalar dependencias faltantes
npm install oracledb mssql mongoose kafkajs class-validator class-transformer

# Compilar
npm run build
```

### Scripts SQL no ejecutan

**Oracle:**
- Verificar conexión: `sqlplus usuario/password@connectstring`
- Verificar permisos: `GRANT CREATE PROCEDURE TO usuario;`

**MSSQL:**
- Verificar conexión: `sqlcmd -S localhost -U sa -P password`
- Verificar permisos: Usuario debe tener `CREATE PROCEDURE`

---

## 📖 Próximos Pasos

### 1. Explorar el Código Generado

```powershell
# Abrir en VS Code
code src/app/payments
```

**Estructura recomendada de revisión:**
1. `domain/` - Lógica de negocio pura
2. `application/usecases/` - Casos de uso
3. `adapters/` - Implementaciones de puertos
4. `README.module.md` - Documentación del módulo

### 2. Personalizar el Módulo

- **Entities**: Agregar propiedades de negocio
- **Use Cases**: Agregar lógica específica
- **Adapters**: Ajustar mapeo de datos
- **Tests**: Agregar casos de prueba específicos

### 3. Leer Documentación Completa

- [README Schematics](./schematics-package/README.md) - Documentación exhaustiva
- [Decision Report](./decision_report.md) - Contexto y decisiones arquitectónicas
- [Migration Plan](./migration/migration-plan.md) - Plan de migración detallado
- [Acceptance Checklist](./ACCEPTANCE_CHECKLIST.md) - 86 criterios de calidad

### 4. Migrar Módulos Existentes

Si tienes módulos legacy, sigue el plan de migración:

1. Leer [migration-plan.md](./migration/migration-plan.md)
2. Ejecutar codemods: `npx ts-node migration/codemods/extract-usecase.ts`
3. Validar con feature flags
4. Deploy incremental

---

## 🎓 Capacitación

### Recursos Recomendados

**Arquitectura Hexagonal:**
- [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Netflix Tech Blog - Hexagonal Architecture](https://netflixtechblog.com/)

**Domain-Driven Design:**
- [Eric Evans - DDD](https://www.domainlanguage.com/ddd/)
- [Vaughn Vernon - Implementing DDD](https://vaughnvernon.com/)

**NestJS:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Advanced Concepts](https://docs.nestjs.com/fundamentals/custom-providers)

### Workshops Internos

Contactar: desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com

---

## 💡 Tips y Mejores Prácticas

### 1. Convenciones de Nombres

✅ **Correcto:**
- `payments`, `user-management`, `order-processing`

❌ **Incorrecto:**
- `Payment`, `userManagement`, `order_processing`

### 2. Estructura de Directorios

```
src/app/
├── payments/           # Un módulo de negocio
├── orders/             # Otro módulo de negocio
└── shared/             # Utilidades compartidas
```

### 3. Variables de Entorno

Usar prefijo del módulo:
```env
PAYMENTS_DB_HOST=...
ORDERS_DB_HOST=...
```

### 4. Tests

**Pirámide de tests:**
- 70% Unit tests (rápidos, puros)
- 20% Integration tests (testcontainers)
- 10% E2E tests (flujo completo)

### 5. Commits

```bash
git add src/app/payments
git commit -m "feat(payments): add hexagonal payments module

- Domain entities and value objects
- Use cases for CRUD operations
- Oracle repository adapter with stored procedures
- Kafka event publisher for payment events
- Unit and integration tests

Generated with @template/schematics"
```

---

## 🆘 Ayuda y Soporte

### Preguntas Frecuentes

**P: ¿Puedo modificar el código generado?**
R: ¡Sí! El código generado es un punto de partida. Personalízalo según tus necesidades.

**P: ¿Cómo actualizo un módulo ya generado?**
R: No hay comando de "update". Genera en otra carpeta y haz merge manual de cambios.

**P: ¿Funciona con NestJS v9?**
R: El schematic está optimizado para NestJS v10+. Para v9, pueden requerirse ajustes menores.

**P: ¿Puedo usar TypeORM en lugar de stored procedures?**
R: Sí, usa `--crud-mode=orm`. Aunque stored-proc es recomendado para Oracle/MSSQL.

**P: ¿Cómo agrego más operaciones después?**
R: Edita manualmente el repository adapter y agrega los métodos necesarios siguiendo el patrón existente.

### Contacto

**Email**: desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com
**Issues**: [GitHub Issues](https://github.com/tu-org/template-schematics/issues)

---

## 🎉 ¡Listo para Empezar!

Ahora tienes todo lo necesario para generar módulos hexagonales en segundos.

**Comando para copiar:**

```powershell
npx nest g @template/schematics:hexagonal-module mi-modulo `
  --database=oracle `
  --kafka=both `
  --path=src/app
```

**¡Disfruta codificando con arquitectura limpia!** 🚀

---

**Elaborado por:** Célula Azure - Fábrica Digital Claro
**Versión:** 1.0.0
**Fecha:** 2025-10-07
