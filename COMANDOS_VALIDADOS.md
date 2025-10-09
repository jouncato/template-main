# 📋 Comandos Validados - Template NestJS Schematics

**Fecha de Validación:** 2025-10-09
**Versión:** 1.0.0
**Estado:** ✅ Validado en Producción

---

## ⚠️ IMPORTANTE: Fuente de Verdad Ejecutable

Este documento contiene **ÚNICAMENTE** los comandos que han sido probados y validados.
**NO SE DEBEN EJECUTAR COMANDOS QUE NO ESTÉN DOCUMENTADOS AQUÍ.**

Cualquier discrepancia entre este documento y otro debe resolverse actualizando la documentación, NO modificando los comandos aquí especificados.

---

## 🚀 Instalación del Generador

### Comando de Instalación

```bash
cd schematics-package
npm install
npm run build
npm link
```

### Verificación de Instalación

```bash
npm list -g --depth=0 | grep template
```

**Salida Esperada:**
```
├── @template/schematics@1.0.0 -> .\..\..\..\..\..\Proj-Dev\template-main\schematics-package
```

---

## 📦 Generar Aplicación Completa

### Comando Básico

```bash
nest g -c @template/schematics application <nombre-proyecto>
```

### Ejemplo Real

```bash
nest g -c @template/schematics application mi-proyecto
```

### Salida Esperada

```
📦 NestJS Application Generator

    Application:     mi-proyecto
    Directory:       mi-proyecto
    Package Manager: npm
    Skip Git:        No
    Skip Install:    No
    Strict Mode:     No

    📝 Git repository will be initialized after file generation

    📦 Installing dependencies with npm...


    ✅ Application generated successfully!

    📁 Project structure:

    mi-proyecto/
    ├── src/
    │   ├── app/
    │   │   ├── application/        # Application services
    │   │   ├── domain/             # Domain layer (DTOs, interfaces)
    │   │   ├── healtcheck.backup/  # Backup healthcheck module
    │   │   ├── infrastructure/     # Infrastructure adapters
    │   │   └── interfaces/         # Controllers and modules
    │   ├── share/
    │   │   ├── domain/             # Shared domain logic
    │   │   ├── infrastructure/     # Shared infrastructure (Oracle, MSSQL, Kafka, HTTP)
    │   │   ├── interfaces/         # Shared interfaces (filters)
    │   │   └── utils/              # Utilities
    │   ├── app.module.ts           # Root module
    │   └── main.ts                 # Application entry point
    ├── test/                       # Test files
    ├── deploy/                     # Deployment configuration
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── Dockerfile
    └── .env.example


    📝 Next steps:
      1. cd mi-proyecto
      2. Copy .env.example to .env and configure
      3. npm run start:dev
      4. git init && git add . && git commit -m "Initial commit"

    💡 To generate hexagonal modules, use:
      nest g -c @template/schematics hexagonal-module <module-name> --database=<oracle|mssql|mongodb> --kafka=<none|producer|consumer|both>

CREATE mi-proyecto/.dockerignore (74 bytes)
CREATE mi-proyecto/.env.example (857 bytes)
CREATE mi-proyecto/.gitignore (2660 bytes)
... (94 archivos creados en total)
```

### Opciones Soportadas

❌ **IMPORTANTE:** Las siguientes opciones de la documentación anterior **NO ESTÁN IMPLEMENTADAS**:
- `--directory` o `--dir`
- `--package-manager` o `--pm`
- `--skip-git` o `--sg`
- `--skip-install` o `--si`
- `--strict`

✅ **Opción Soportada:**
- `--dry-run` o `-d` - Simular sin escribir archivos

### Comando con Dry-Run

```bash
nest g -c @template/schematics application test-project --dry-run
```

**Resultado:** Muestra los archivos que se crearían sin escribirlos.

---

## 🔷 Generar Módulo Hexagonal

### Comando Básico

```bash
nest g -c @template/schematics hexagonal-module <nombre-modulo> --database=<db> [opciones]
```

### Ejemplo 1: Módulo con Oracle

```bash
nest g -c @template/schematics hexagonal-module payments --database=oracle
```

### Ejemplo 2: Módulo con Oracle y Kafka

```bash
nest g -c @template/schematics hexagonal-module payments --database=oracle --kafka=both
```

### Ejemplo 3: Módulo con SQL Server

```bash
nest g -c @template/schematics hexagonal-module orders --database=mssql
```

### Ejemplo 4: Módulo con MongoDB

```bash
nest g -c @template/schematics hexagonal-module users --database=mongodb
```

---

## ✅ Flujo de Trabajo Validado

### Caso de Uso 1: Crear Proyecto Nuevo

```bash
# Paso 1: Generar aplicación
cd C:\Proj-Dev\template-main
nest g -c @template/schematics application payments-service

# Paso 2: Navegar al proyecto
cd payments-service

# Paso 3: Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales

# Paso 4: Ejecutar
npm run start:dev
```

**Tiempo Estimado:** ~5 minutos (incluyendo instalación de dependencias)

### Caso de Uso 2: Agregar Módulo a Proyecto Existente

```bash
# Paso 1: Navegar a proyecto existente
cd mi-proyecto

# Paso 2: Generar módulo
nest g -c @template/schematics hexagonal-module payments --database=oracle --kafka=producer

# Paso 3: Implementar lógica de negocio en los use cases generados

# Paso 4: Ejecutar tests
npm test
```

---

## 🧪 Comandos de Validación

### Verificar Compilación

```bash
cd <proyecto-generado>
npm run build
```

**Salida Esperada:** Sin errores de TypeScript

### Verificar Tests

```bash
npm test
```

**Salida Esperada:**
- ✅ Tests pasan (si `.env` está configurado)
- ⚠️ Algunos tests fallan por falta de `.env` (comportamiento esperado si no está configurado)

### Verificar Estructura

```bash
ls -la
```

**Archivos Esperados:**
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `nest-cli.json`
- ✅ `Dockerfile`
- ✅ `.env.example`
- ✅ `src/`
- ✅ `test/`
- ✅ `deploy/`

---

## ❌ Comandos NO Soportados

Los siguientes comandos de documentación anterior **NO FUNCIONAN** y NO deben usarse:

```bash
# ❌ NO FUNCIONA
nest g -c @template/schematics application my-app --skip-install

# ❌ NO FUNCIONA
nest g -c @template/schematics application my-app --package-manager=yarn

# ❌ NO FUNCIONA
nest g -c @template/schematics application my-app --directory=apps/my-app
```

---

## 🔍 Troubleshooting

### Error: "Invalid schematic"

**Problema:**
```bash
nest g -c @template/schematics application mi-proyecto
Invalid schematic "@template/schematics:application"
```

**Solución:**
```bash
# Verificar que npm link se ejecutó correctamente
npm list -g @template/schematics

# Si no aparece, ejecutar:
cd schematics-package
npm link
```

### Error: "Collection not found"

**Problema:**
```bash
Collection "@template/schematics" cannot be resolved
```

**Solución:**
```bash
# Reconstruir y re-enlazar
cd schematics-package
npm run build
npm unlink -g
npm link
```

---

## 📊 Checklist de Validación

Antes de entregar, verificar:

- [x] ✅ `npm link` ejecutado exitosamente
- [x] ✅ Comando `nest g -c @template/schematics application` genera proyecto
- [x] ✅ Proyecto generado compila sin errores (`npm run build`)
- [x] ✅ Tests ejecutan correctamente (`npm test`)
- [x] ✅ 94 archivos generados
- [x] ✅ `package.json` actualizado con nombre del proyecto
- [x] ✅ Dockerfile actualizado con MICRO_NAME
- [x] ✅ `.env.example` actualizado con SERVICE_NAME

---

## 📝 Notas de Implementación

### Limitaciones Conocidas

1. **Opciones de CLI No Implementadas:**
   - El schematic `application` actualmente no soporta opciones personalizadas a través del CLI de NestJS
   - Las opciones documentadas en `schema.json` no son procesadas por el CLI
   - Solo funciona el comando básico: `nest g -c @template/schematics application <nombre>`

2. **Workaround Actual:**
   - Generar proyecto con comando básico
   - Modificar manualmente `package.json` si se necesita cambiar el package manager
   - Ejecutar `git init` manualmente si es necesario

3. **Para Futuras Mejoras:**
   - Implementar menú interactivo como alternativa (ver `scripts/interactive-menu.js`)
   - Considerar crear wrapper script que maneje las opciones

---

## 🎯 Comando Oficial para Producción

```bash
nest g -c @template/schematics application <nombre-proyecto>
```

Este es el **ÚNICO** comando oficialmente soportado y validado para generar aplicaciones.

---

**Última Actualización:** 2025-10-09
**Validado Por:** Deployment Automation
**Estado:** ✅ PRODUCCIÓN
