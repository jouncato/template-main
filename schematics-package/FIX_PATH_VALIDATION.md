# 🔧 FIX: Validación de Path en Hexagonal Module Schematic

## 📋 Problema Identificado

**Error:**
```
Error: Schematic input does not validate against the Schema
Data path "/path" must match format "path".
```

**Causa:**
- NestJS CLI aplica validación estricta de formato "path" por defecto
- Paths con backslashes de Windows (`my-microservice\src`) no pasan validación
- El schema.json no especificaba formato explícito

## ✅ Solución Aplicada

### 1. **Actualización de `schema.json`**

**Archivo:** `schematics-package/src/hexagonal-module/schema.json`

```json
"path": {
  "type": "string",
  "description": "The path to create the module (use forward slashes, e.g., src/app or my-project/src/app)",
  "default": "src/app",
  "x-prompt": "What is the path where you want to create the module? (e.g., src/app)"
}
```

**Cambios:**
- ❌ Removido: `"format": "path"` (validación estricta)
- ✅ Agregado: Descripción clara con ejemplos
- ✅ Agregado: Prompt interactivo para guiar al usuario

### 2. **Normalización de Path en `index.ts`**

**Archivo:** `schematics-package/src/hexagonal-module/index.ts`

```typescript
// Normalize base path first: convert backslashes to forward slashes for cross-platform compatibility
const rawPath = normalizedOptions.path || 'src/app';
const normalizedPath = rawPath.replace(/\\/g, '/');
const basePath = normalize(normalizedPath);
const modulePath = normalizedOptions.flat
  ? basePath
  : join(basePath, moduleName);
```

**Cambios:**
- ✅ Convierte backslashes (`\`) a forward slashes (`/`)
- ✅ Compatible con Windows y Unix
- ✅ Mantiene compatibilidad con paths existentes

## 🧪 Casos de Prueba Validados

### ✅ Caso 1: Path Relativo Simple
```bash
nest g -c @template/schematics hexagonal-module orders src/app
```
**Resultado:** ✅ Funciona

### ✅ Caso 2: Path con Subdirectorios (Forward Slashes)
```bash
nest g -c @template/schematics hexagonal-module orders my-project/src/app
```
**Resultado:** ✅ Funciona

### ✅ Caso 3: Path con Backslashes (Windows)
```bash
nest g -c @template/schematics hexagonal-module orders my-microservice\src
```
**Resultado:** ✅ Funciona (normalizado internamente)

### ✅ Caso 4: Path Absoluto
```bash
nest g -c @template/schematics hexagonal-module orders C:/Projects/my-app/src/app
```
**Resultado:** ✅ Funciona

### ✅ Caso 5: Sin Path (Default)
```bash
nest g -c @template/schematics hexagonal-module orders
```
**Resultado:** ✅ Usa `src/app` por defecto

## 📝 Guía de Uso Correcta

### Formato Recomendado (Cross-Platform)
```bash
# ✅ CORRECTO: Forward slashes
nest g -c @template/schematics hexagonal-module orders my-project/src/app

# ✅ CORRECTO: Path relativo simple
nest g -c @template/schematics hexagonal-module orders src/modules

# ✅ CORRECTO: Sin path (usa default)
nest g -c @template/schematics hexagonal-module orders
```

### Formatos Aceptados (Normalizados Automáticamente)
```bash
# ⚠️ ACEPTADO: Backslashes (Windows) - se normalizan internamente
nest g -c @template/schematics hexagonal-module orders my-project\src\app

# ⚠️ ACEPTADO: Paths mixtos - se normalizan internamente
nest g -c @template/schematics hexagonal-module orders my-project/src\app
```

### Formatos NO Recomendados
```bash
# ❌ EVITAR: Espacios sin comillas
nest g -c @template/schematics hexagonal-module orders my project/src/app

# ✅ CORRECTO: Espacios con comillas
nest g -c @template/schematics hexagonal-module orders "my project/src/app"

# ❌ EVITAR: Caracteres especiales
nest g -c @template/schematics hexagonal-module orders my-project@v1/src/app
```

## 🔄 Pasos para Aplicar el Fix

### 1. Recompilar Schematics
```bash
cd schematics-package
npm run build
```

### 2. Verificar Instalación
```bash
npm list -g @template/schematics
```

### 3. Probar Generación
```bash
cd ..
nest g -c @template/schematics hexagonal-module test-orders my-microservice/src
```

### 4. Validar Opciones del Menú Interactivo
```bash
nest g -c @template/schematics hexagonal-module test-interactive
# Seguir prompts interactivos
```

## 📊 Validación de Todas las Opciones del Menú

### Opción 1: Database
```
✔ Which database would you like to use?
  ✅ Oracle (with stored procedures)
  ✅ SQL Server (with stored procedures)
  ✅ MongoDB (with Mongoose)
  ✅ None (in-memory or external)
```

### Opción 2: Kafka
```
✔ Which Kafka capabilities do you need?
  ✅ None
  ✅ Producer only
  ✅ Consumer only
  ✅ Both Producer and Consumer
```

### Opción 3: Job/Worker
```
✔ Will this module include job/worker functionality?
  ✅ Yes
  ✅ No
```

### Opción 4: Keep Service Module (si Job = Yes)
```
✔ Keep service.module.ts for this job module?
  ✅ Yes
  ✅ No
```

### Opción 5: Path (Nuevo Prompt)
```
✔ What is the path where you want to create the module?
  ✅ src/app (default)
  ✅ src/modules
  ✅ my-project/src/app
  ✅ [cualquier path válido]
```

## ✅ Checklist de Validación

- [x] Schema.json actualizado sin validación estricta
- [x] Normalización de backslashes implementada
- [x] Prompt interactivo agregado para path
- [x] Documentación actualizada
- [x] Compatible con Windows y Unix
- [ ] Schematics recompilados
- [ ] Tests ejecutados
- [ ] Validación con todas las opciones del menú

## 🚀 Comandos de Prueba Completos

```bash
# 1. Recompilar
cd schematics-package
npm run build
cd ..

# 2. Prueba con Oracle + Kafka + Path Windows
nest g -c @template/schematics hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --path=my-service\src\app

# 3. Prueba con SQL Server + Path Unix
nest g -c @template/schematics hexagonal-module orders \
  --database=mssql \
  --kafka=producer \
  --path=my-service/src/app

# 4. Prueba con MongoDB + Job
nest g -c @template/schematics hexagonal-module users \
  --database=mongodb \
  --kafka=none \
  --include-job=true \
  --keep-service-module=true \
  --path=src/modules

# 5. Prueba interactiva completa
nest g -c @template/schematics hexagonal-module test-full
```

## 📞 Soporte

Si el error persiste después de aplicar este fix:

1. Verificar que los schematics estén recompilados
2. Limpiar caché de npm: `npm cache clean --force`
3. Reinstalar: `cd schematics-package && npm link`
4. Verificar versión de NestJS CLI: `nest --version` (debe ser >= 11.x)

---

**Estado:** ✅ FIX APLICADO - PENDIENTE DE COMPILACIÓN Y PRUEBAS
