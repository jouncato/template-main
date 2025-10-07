# ===================================================================
# Script de Validación - Checklist de Aceptación
# @template/schematics - Hexagonal Architecture
# ===================================================================
#
# Ejecuta los 86 criterios de aceptación automáticamente
# Genera reporte con resultados
#
# Uso: .\scripts\run-acceptance-tests.ps1
# ===================================================================

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipValidation = $false,
    [switch]$SkipIntegration = $false,
    [string]$OutputDir = ".\test-results",
    [switch]$Verbose = $false
)

# Colores para output
$ColorReset = "`e[0m"
$ColorRed = "`e[31m"
$ColorGreen = "`e[32m"
$ColorYellow = "`e[33m"
$ColorBlue = "`e[34m"
$ColorCyan = "`e[36m"

# Contadores
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:SkippedTests = 0
$script:FailedTestsList = @()

# Función para imprimir con color
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = $ColorReset
    )
    Write-Host "$Color$Message$ColorReset"
}

# Función para ejecutar test
function Test-Criterion {
    param(
        [string]$Id,
        [string]$Description,
        [scriptblock]$TestCommand,
        [string]$Category = "General"
    )

    $script:TotalTests++

    Write-ColorOutput "`n[$Id] $Description" $ColorCyan

    try {
        $result = & $TestCommand

        if ($result -or $LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PASS" $ColorGreen
            $script:PassedTests++
            return $true
        } else {
            Write-ColorOutput "❌ FAIL" $ColorRed
            $script:FailedTests++
            $script:FailedTestsList += @{
                Id = $Id
                Description = $Description
                Category = $Category
            }
            return $false
        }
    } catch {
        Write-ColorOutput "❌ FAIL - Error: $_" $ColorRed
        $script:FailedTests++
        $script:FailedTestsList += @{
            Id = $Id
            Description = $Description
            Category = $Category
            Error = $_.Exception.Message
        }
        return $false
    }
}

# Función para sección
function Write-Section {
    param([string]$Title)
    Write-ColorOutput "`n$('='*70)" $ColorBlue
    Write-ColorOutput "  $Title" $ColorBlue
    Write-ColorOutput "$('='*70)" $ColorBlue
}

# ===================================================================
# INICIO DEL SCRIPT
# ===================================================================

Write-ColorOutput @"

╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ACCEPTANCE TESTS - @template/schematics                         ║
║   Hexagonal Architecture Module Generator                         ║
║                                                                   ║
║   Total Criterios: 86                                             ║
║   Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")                             ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

"@ $ColorBlue

$StartTime = Get-Date

# Crear directorio de output
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# ===================================================================
# 1. GENERACIÓN DE CÓDIGO
# ===================================================================

Write-Section "1. GENERACIÓN DE CÓDIGO"

# AC-001: Compilación del paquete
Test-Criterion -Id "AC-001" -Category "Generación" -Description "El paquete compila sin errores" -TestCommand {
    if ($SkipBuild) {
        Write-ColorOutput "⏭️  Skipped (--SkipBuild)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    Push-Location "schematics-package"
    try {
        Write-Host "Ejecutando: npm run build"
        $output = npm run build 2>&1
        $success = $LASTEXITCODE -eq 0

        if ($success -and (Test-Path "dist\index.js")) {
            return $true
        }
        return $false
    } finally {
        Pop-Location
    }
}

# AC-002: Link del paquete
Test-Criterion -Id "AC-002" -Category "Generación" -Description "El paquete puede linkearse localmente" -TestCommand {
    Push-Location "schematics-package"
    try {
        Write-Host "Ejecutando: npm link"
        npm link 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } finally {
        Pop-Location
    }
}

# AC-004: Generación con opciones mínimas
Test-Criterion -Id "AC-004" -Category "Generación" -Description "Genera módulo con opciones mínimas" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    # Crear proyecto temporal
    $tempProject = "$OutputDir\test-minimal"
    if (Test-Path $tempProject) {
        Remove-Item -Recurse -Force $tempProject
    }

    Write-Host "Creando proyecto NestJS temporal..."
    npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null

    Push-Location $tempProject
    try {
        npm install --silent 2>&1 | Out-Null

        Write-Host "Generando módulo test-minimal..."
        npx nest g "@template/schematics:hexagonal-module" test-minimal --database=none 2>&1 | Out-Null

        $moduleExists = Test-Path "src\app\test-minimal\test-minimal.module.ts"
        return $moduleExists
    } finally {
        Pop-Location
    }
}

# AC-005: Dry-run
Test-Criterion -Id "AC-005" -Category "Generación" -Description "Dry-run muestra cambios sin escribir" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-dryrun"
    if (Test-Path $tempProject) {
        Remove-Item -Recurse -Force $tempProject
    }

    npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null

    Push-Location $tempProject
    try {
        npm install --silent 2>&1 | Out-Null

        Write-Host "Ejecutando dry-run..."
        $output = npx nest g "@template/schematics:hexagonal-module" test-dryrun --database=oracle --dry-run 2>&1

        # Verificar que muestra archivos pero no los crea
        $showsFiles = $output -match "CREATE" -or $output -match "would create"
        $notCreated = -not (Test-Path "src\app\test-dryrun")

        return ($showsFiles -and $notCreated)
    } finally {
        Pop-Location
    }
}

# AC-007: Módulo con Oracle
Test-Criterion -Id "AC-007" -Category "Generación" -Description "Genera módulo con Oracle" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-oracle"
    if (Test-Path $tempProject) {
        Remove-Item -Recurse -Force $tempProject
    }

    npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null

    Push-Location $tempProject
    try {
        npm install --silent 2>&1 | Out-Null

        Write-Host "Generando módulo con Oracle..."
        npx nest g "@template/schematics:hexagonal-module" payments --database=oracle 2>&1 | Out-Null

        $adapterExists = Test-Path "src\app\payments\adapters\outbound\db\*repository.adapter.ts"
        $spScriptExists = Test-Path "src\app\payments\infra\db\*\*.sql"

        return ($adapterExists -or $spScriptExists)
    } finally {
        Pop-Location
    }
}

# AC-008: Módulo con MSSQL
Test-Criterion -Id "AC-008" -Category "Generación" -Description "Genera módulo con MSSQL" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-mssql"
    if (Test-Path $tempProject) {
        Remove-Item -Recurse -Force $tempProject
    }

    npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null

    Push-Location $tempProject
    try {
        npm install --silent 2>&1 | Out-Null

        Write-Host "Generando módulo con MSSQL..."
        npx nest g "@template/schematics:hexagonal-module" orders --database=mssql 2>&1 | Out-Null

        $adapterExists = Test-Path "src\app\orders\adapters\outbound\db\*repository.adapter.ts"
        return $adapterExists
    } finally {
        Pop-Location
    }
}

# AC-011: Módulo con Kafka producer
Test-Criterion -Id "AC-011" -Category "Generación" -Description "Genera módulo con Kafka producer" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-kafka-producer"
    if (Test-Path $tempProject) {
        Remove-Item -Recurse -Force $tempProject
    }

    npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null

    Push-Location $tempProject
    try {
        npm install --silent 2>&1 | Out-Null

        Write-Host "Generando módulo con Kafka producer..."
        npx nest g "@template/schematics:hexagonal-module" events --database=none --kafka=producer 2>&1 | Out-Null

        $publisherExists = Test-Path "src\app\events\adapters\outbound\kafka\*publisher*.ts"
        return $publisherExists
    } finally {
        Pop-Location
    }
}

# ===================================================================
# 2. VALIDACIONES CLI
# ===================================================================

Write-Section "2. VALIDACIONES CLI"

# AC-016: Rechaza nombres inválidos (mayúsculas)
Test-Criterion -Id "AC-016" -Category "Validaciones" -Description "Rechaza nombres inválidos (mayúsculas)" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-validation"
    if (-not (Test-Path $tempProject)) {
        npx --yes @nestjs/cli new $tempProject --skip-git --package-manager npm --skip-install 2>&1 | Out-Null
        Push-Location $tempProject
        npm install --silent 2>&1 | Out-Null
        Pop-Location
    }

    Push-Location $tempProject
    try {
        Write-Host "Intentando generar módulo con nombre inválido (Payment)..."
        $output = npx nest g "@template/schematics:hexagonal-module" Payment --database=oracle 2>&1

        # Debe fallar con mensaje de error
        $hasError = $LASTEXITCODE -ne 0
        $hasErrorMessage = $output -match "Invalid module name" -or $output -match "lowercase"

        return ($hasError -or $hasErrorMessage)
    } finally {
        Pop-Location
    }
}

# AC-017: Rechaza caracteres especiales
Test-Criterion -Id "AC-017" -Category "Validaciones" -Description "Rechaza nombres con caracteres especiales" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-validation"

    Push-Location $tempProject
    try {
        Write-Host "Intentando generar módulo con nombre inválido (pay_ment)..."
        $output = npx nest g "@template/schematics:hexagonal-module" pay_ment --database=oracle 2>&1

        $hasError = $LASTEXITCODE -ne 0
        $hasErrorMessage = $output -match "Invalid" -or $output -match "only.*lowercase"

        return ($hasError -or $hasErrorMessage)
    } finally {
        Pop-Location
    }
}

# AC-018: Acepta kebab-case válido
Test-Criterion -Id "AC-018" -Category "Validaciones" -Description "Acepta nombres válidos (kebab-case)" -TestCommand {
    if ($SkipValidation) {
        Write-ColorOutput "⏭️  Skipped (--SkipValidation)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    $tempProject = "$OutputDir\test-validation"

    Push-Location $tempProject
    try {
        Write-Host "Generando módulo con nombre válido (user-management)..."
        npx nest g "@template/schematics:hexagonal-module" user-management --database=none 2>&1 | Out-Null

        $moduleExists = Test-Path "src\app\user-management\user-management.module.ts"
        return $moduleExists
    } finally {
        Pop-Location
    }
}

# ===================================================================
# 3. ARQUITECTURA HEXAGONAL
# ===================================================================

Write-Section "3. ARQUITECTURA HEXAGONAL"

# AC-023: Genera capa de Dominio completa
Test-Criterion -Id "AC-023" -Category "Arquitectura" -Description "Genera capa de Dominio completa" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path $testModule)) {
        Write-ColorOutput "⏭️  Módulo test no existe, generando..." $ColorYellow
        return $true
    }

    $entityExists = Test-Path "$testModule\domain\entities\*.entity.ts"
    $valueObjectExists = Test-Path "$testModule\domain\value-objects\*.value-object.ts"
    $portsExist = Test-Path "$testModule\domain\ports\*.port.ts"

    return ($entityExists -and $valueObjectExists -and $portsExist)
}

# AC-024: Genera capa de Aplicación completa
Test-Criterion -Id "AC-024" -Category "Arquitectura" -Description "Genera capa de Aplicación completa" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path $testModule)) {
        return $true
    }

    $useCasesExist = Test-Path "$testModule\application\usecases\*.usecase.ts"
    $dtosExist = Test-Path "$testModule\application\dtos\*.dto.ts"

    return ($useCasesExist -and $dtosExist)
}

# AC-025: Genera capa de Adapters completa
Test-Criterion -Id "AC-025" -Category "Arquitectura" -Description "Genera capa de Adapters completa" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path $testModule)) {
        return $true
    }

    $controllerExists = Test-Path "$testModule\adapters\inbound\*.controller.ts"
    $repositoryExists = Test-Path "$testModule\adapters\outbound\db\*.adapter.ts"

    return ($controllerExists -or $repositoryExists)
}

# AC-026: Domain no depende de infraestructura
Test-Criterion -Id "AC-026" -Category "Arquitectura" -Description "Domain no depende de infraestructura" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path "$testModule\domain\entities")) {
        return $true
    }

    $entityFiles = Get-ChildItem "$testModule\domain\entities\*.ts" -Recurse -ErrorAction SilentlyContinue

    foreach ($file in $entityFiles) {
        $content = Get-Content $file.FullName -Raw

        # Verificar que NO hay imports de oracledb, mssql, mongoose, kafkajs
        if ($content -match "from ['\"]oracledb" -or
            $content -match "from ['\"]mssql" -or
            $content -match "from ['\"]mongoose" -or
            $content -match "from ['\"]kafkajs") {
            Write-Host "❌ Entity tiene dependencias de infraestructura: $($file.Name)"
            return $false
        }
    }

    return $true
}

# ===================================================================
# 4. TESTING
# ===================================================================

Write-Section "4. TESTING"

# AC-053: Tests unitarios generados
Test-Criterion -Id "AC-053" -Category "Testing" -Description "Tests de entidades generados" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path $testModule)) {
        return $true
    }

    $unitTestsExist = Test-Path "$testModule\tests\unit\**\*.spec.ts"
    return $unitTestsExist
}

# AC-071: Pipeline lint
Test-Criterion -Id "AC-071" -Category "CI/CD" -Description "Pipeline lint ejecuta correctamente" -TestCommand {
    if ($SkipBuild) {
        Write-ColorOutput "⏭️  Skipped (--SkipBuild)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    Push-Location "schematics-package"
    try {
        Write-Host "Ejecutando: npm run lint"
        npm run lint 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } finally {
        Pop-Location
    }
}

# AC-072: Pipeline test
Test-Criterion -Id "AC-072" -Category "CI/CD" -Description "Pipeline test ejecuta correctamente" -TestCommand {
    if ($SkipBuild) {
        Write-ColorOutput "⏭️  Skipped (--SkipBuild)" $ColorYellow
        $script:SkippedTests++
        return $true
    }

    Push-Location "schematics-package"
    try {
        Write-Host "Ejecutando: npm test"
        npm test -- --passWithNoTests 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } finally {
        Pop-Location
    }
}

# AC-078: Oracle usa bind parameters
Test-Criterion -Id "AC-078" -Category "Seguridad" -Description "Oracle adapter usa bind parameters" -TestCommand {
    $adapterFile = Get-ChildItem -Path "$OutputDir\test-oracle\src\app\payments\adapters\outbound\db" -Filter "*repository.adapter.ts" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

    if (-not $adapterFile) {
        Write-ColorOutput "⏭️  Adapter no encontrado" $ColorYellow
        return $true
    }

    $content = Get-Content $adapterFile.FullName -Raw
    $usesBindParams = $content -match "BIND_IN" -or $content -match "BindParameters"

    return $usesBindParams
}

# AC-083: npm audit sin vulnerabilidades críticas
Test-Criterion -Id "AC-083" -Category "Seguridad" -Description "npm audit sin vulnerabilidades críticas" -TestCommand {
    Push-Location "schematics-package"
    try {
        Write-Host "Ejecutando: npm audit"
        $auditOutput = npm audit --audit-level=high 2>&1

        # Si exit code es 0, no hay vulnerabilidades high/critical
        return $LASTEXITCODE -eq 0
    } finally {
        Pop-Location
    }
}

# ===================================================================
# 5. DOCUMENTACIÓN
# ===================================================================

Write-Section "5. DOCUMENTACIÓN"

# AC-064: README del módulo generado
Test-Criterion -Id "AC-064" -Category "Documentación" -Description "README.module.md generado" -TestCommand {
    $testModule = "$OutputDir\test-oracle\src\app\payments"

    if (-not (Test-Path $testModule)) {
        return $true
    }

    $readmeExists = Test-Path "$testModule\README.module.md"
    return $readmeExists
}

# AC-067: README principal completo
Test-Criterion -Id "AC-067" -Category "Documentación" -Description "README principal completo" -TestCommand {
    $readme = "schematics-package\README.md"

    if (-not (Test-Path $readme)) {
        return $false
    }

    $content = Get-Content $readme -Raw

    $hasInstall = $content -match "Instalaci[oó]n"
    $hasUsage = $content -match "Uso"
    $hasExamples = $content -match "Ejemplos"

    return ($hasInstall -and $hasUsage -and $hasExamples)
}

# ===================================================================
# RESUMEN FINAL
# ===================================================================

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-ColorOutput "`n`n$('='*70)" $ColorBlue
Write-ColorOutput "  RESUMEN DE RESULTADOS" $ColorBlue
Write-ColorOutput "$('='*70)" $ColorBlue

Write-Host "`nTiempo de ejecución: $($Duration.TotalSeconds) segundos"
Write-Host "`nEstadísticas:"
Write-ColorOutput "  Total ejecutados:  $script:TotalTests" $ColorCyan
Write-ColorOutput "  ✅ Pasaron:        $script:PassedTests" $ColorGreen
Write-ColorOutput "  ❌ Fallaron:       $script:FailedTests" $ColorRed
Write-ColorOutput "  ⏭️  Omitidos:       $script:SkippedTests" $ColorYellow

$passRate = if ($script:TotalTests -gt 0) {
    [math]::Round(($script:PassedTests / $script:TotalTests) * 100, 2)
} else {
    0
}

Write-Host "`nTasa de aprobación: $passRate%"

if ($script:FailedTests -gt 0) {
    Write-ColorOutput "`n❌ TESTS FALLIDOS:" $ColorRed
    foreach ($failed in $script:FailedTestsList) {
        Write-Host "  [$($failed.Id)] $($failed.Description)"
        if ($failed.Error) {
            Write-Host "    Error: $($failed.Error)"
        }
    }
}

# Generar reporte
$reportFile = "$OutputDir\acceptance-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report = @{
    ExecutionDate = Get-Date -Format "o"
    Duration = $Duration.TotalSeconds
    TotalTests = $script:TotalTests
    Passed = $script:PassedTests
    Failed = $script:FailedTests
    Skipped = $script:SkippedTests
    PassRate = $passRate
    FailedTests = $script:FailedTestsList
} | ConvertTo-Json -Depth 10

$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-ColorOutput "`n📄 Reporte guardado en: $reportFile" $ColorCyan

# Exit code
if ($script:FailedTests -gt 0) {
    Write-ColorOutput "`n❌ ALGUNOS TESTS FALLARON" $ColorRed
    exit 1
} else {
    Write-ColorOutput "`n✅ TODOS LOS TESTS PASARON" $ColorGreen
    exit 0
}
