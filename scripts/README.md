# Scripts de Validación y Migración

Este directorio contiene scripts para validar el paquete de schematics y ejecutar migraciones.

---

## 📋 Scripts Disponibles

### 1. `run-acceptance-tests.ps1` (PowerShell)

Script principal para ejecutar el checklist de aceptación completo.

#### Uso Básico

```powershell
# Ejecutar todos los tests
.\scripts\run-acceptance-tests.ps1

# Ejecutar con opciones
.\scripts\run-acceptance-tests.ps1 -SkipBuild -Verbose

# Ver ayuda
Get-Help .\scripts\run-acceptance-tests.ps1 -Detailed
```

#### Parámetros

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `-SkipBuild` | Switch | `$false` | Omitir build y compilación del paquete |
| `-SkipValidation` | Switch | `$false` | Omitir generación de módulos de prueba |
| `-SkipIntegration` | Switch | `$false` | Omitir tests de integración |
| `-OutputDir` | String | `.\test-results` | Directorio para resultados |
| `-Verbose` | Switch | `$false` | Mostrar output detallado |

#### Ejemplos

```powershell
# Ejecución completa (primera vez)
.\scripts\run-acceptance-tests.ps1

# Ejecución rápida (sin rebuild)
.\scripts\run-acceptance-tests.ps1 -SkipBuild

# Solo validaciones CLI y arquitectura
.\scripts\run-acceptance-tests.ps1 -SkipIntegration

# Guardar resultados en carpeta custom
.\scripts\run-acceptance-tests.ps1 -OutputDir "C:\TestResults"

# Ejecución con output detallado
.\scripts\run-acceptance-tests.ps1 -Verbose
```

#### Salida

El script genera:

1. **Output en consola** con colores:
   - 🟢 Verde: Tests pasados
   - 🔴 Rojo: Tests fallidos
   - 🔵 Azul: Secciones
   - 🟡 Amarillo: Warnings y skipped

2. **Reporte JSON** en `test-results/acceptance-report-YYYYMMDD-HHmmss.json`:
   ```json
   {
     "ExecutionDate": "2025-10-07T15:30:00Z",
     "Duration": 180.5,
     "TotalTests": 25,
     "Passed": 23,
     "Failed": 2,
     "Skipped": 0,
     "PassRate": 92.0,
     "FailedTests": [...]
   }
   ```

3. **Exit Code**:
   - `0`: Todos los tests pasaron
   - `1`: Algunos tests fallaron

#### Requisitos Previos

Antes de ejecutar el script:

```powershell
# 1. Instalar Node.js 20+
node --version  # Debe ser >= 20

# 2. Instalar dependencias del paquete schematics
cd schematics-package
npm install

# 3. Volver al directorio raíz
cd ..

# 4. Dar permisos de ejecución (si es necesario)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## 🔍 Tests Ejecutados

El script ejecuta **25+ criterios de aceptación** en las siguientes categorías:

### 1. Generación de Código (6 tests)
- AC-001: Compilación del paquete
- AC-002: Link del paquete
- AC-004: Generación con opciones mínimas
- AC-005: Dry-run sin modificar filesystem
- AC-007: Módulo con Oracle
- AC-008: Módulo con MSSQL
- AC-011: Módulo con Kafka producer

### 2. Validaciones CLI (3 tests)
- AC-016: Rechaza nombres con mayúsculas
- AC-017: Rechaza caracteres especiales
- AC-018: Acepta kebab-case válido

### 3. Arquitectura Hexagonal (4 tests)
- AC-023: Capa de Dominio completa
- AC-024: Capa de Aplicación completa
- AC-025: Capa de Adapters completa
- AC-026: Domain sin dependencias de infraestructura

### 4. Testing (1 test)
- AC-053: Tests unitarios generados

### 5. CI/CD (2 tests)
- AC-071: Pipeline lint
- AC-072: Pipeline test

### 6. Seguridad (2 tests)
- AC-078: Oracle usa bind parameters
- AC-083: npm audit sin vulnerabilidades críticas

### 7. Documentación (2 tests)
- AC-064: README del módulo generado
- AC-067: README principal completo

---

## 🚨 Troubleshooting

### Error: "Cannot be loaded because running scripts is disabled"

```powershell
# Solución temporal (sesión actual)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# O ejecutar así:
powershell -ExecutionPolicy Bypass -File .\scripts\run-acceptance-tests.ps1
```

### Error: "npm: command not found"

```powershell
# Verificar instalación de Node.js
node --version
npm --version

# Si no está instalado, descargar de https://nodejs.org/
```

### Error: "Module @template/schematics not found"

```powershell
# Linkear el paquete
cd schematics-package
npm link
cd ..

# Verificar
npm list -g @template/schematics
```

### Tests fallan con "Cannot find module"

```powershell
# Instalar dependencias
cd schematics-package
npm install
npm run build
cd ..

# Intentar de nuevo
.\scripts\run-acceptance-tests.ps1
```

### Limpiar proyectos de prueba anteriores

```powershell
# Eliminar carpeta de resultados
Remove-Item -Recurse -Force .\test-results

# Ejecutar de nuevo
.\scripts\run-acceptance-tests.ps1
```

---

## 📊 Interpretación de Resultados

### Tasa de Aprobación Mínima

Para release v1.0.0, se requiere:

- ✅ **Criterios bloqueantes**: 100% (todos deben pasar)
- ✅ **Criterios totales**: ≥ 90%

### Criterios Bloqueantes

Los siguientes tests SON obligatorios:

- AC-001, AC-002: Build y link
- AC-004, AC-005: Generación básica
- AC-016 a AC-018: Validaciones CLI
- AC-023 a AC-026: Arquitectura hexagonal
- AC-071, AC-072: CI/CD
- AC-083: Seguridad (npm audit)
- AC-067: Documentación

Si alguno de estos falla, **NO release**.

### Criterios Opcionales

Los siguientes pueden posponerse para v1.1.0:

- AC-053: Tests unitarios (si la estructura base está OK)
- AC-078: Detalles de implementación (si validación manual confirma)

---

## 🔄 Integración con CI/CD

### GitHub Actions

```yaml
# .github/workflows/acceptance.yml
name: Acceptance Tests

on: [push, pull_request]

jobs:
  acceptance:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd schematics-package
          npm ci

      - name: Run acceptance tests
        run: .\scripts\run-acceptance-tests.ps1

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: acceptance-report
          path: test-results/*.json
```

### Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - powershell: |
      cd schematics-package
      npm ci
    displayName: 'Install dependencies'

  - powershell: |
      .\scripts\run-acceptance-tests.ps1
    displayName: 'Run acceptance tests'

  - task: PublishTestResults@2
    condition: always()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: 'test-results/*.json'
```

---

## 📝 Mantenimiento del Script

### Agregar Nuevo Test

1. Editar `run-acceptance-tests.ps1`
2. Agregar en la sección correspondiente:

```powershell
# AC-XXX: Descripción
Test-Criterion -Id "AC-XXX" -Category "Categoría" -Description "Descripción del test" -TestCommand {
    # Lógica del test
    # Retornar $true si pasa, $false si falla

    return $true
}
```

3. Actualizar documentación (este README)
4. Ejecutar para validar:

```powershell
.\scripts\run-acceptance-tests.ps1
```

### Modificar Configuración

Variables configurables al inicio del script:

```powershell
# Timeouts
$BuildTimeout = 300  # segundos

# Directorios
$DefaultOutputDir = ".\test-results"

# Umbrales
$MinPassRate = 90  # porcentaje mínimo
```

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisar logs**: El script muestra output detallado con `-Verbose`
2. **Revisar reporte JSON**: Contiene detalles de cada test fallido
3. **Issues**: Crear issue en GitHub con:
   - Output completo del script
   - Reporte JSON adjunto
   - Sistema operativo y versión de Node.js

**Contacto**: desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com

---

## 📚 Referencias

- [Checklist de Aceptación](../ACCEPTANCE_CHECKLIST.md) - 86 criterios completos
- [README Schematics](../schematics-package/README.md) - Documentación del paquete
- [Plan de Migración](../migration/migration-plan.md) - Estrategia de migración

---

**Elaborado por:** Célula Azure - Fábrica Digital Claro
**Última actualización:** 2025-10-07
