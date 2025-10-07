# Plan de Migración a Arquitectura Hexagonal

**Proyecto**: Template NestJS Microservicios
**Fecha**: 2025-10-07
**Estrategia**: Migración Incremental con Schematics

---

## 🎯 Objetivo

Migrar los módulos existentes del proyecto a arquitectura hexagonal utilizando los schematics generados, manteniendo el sistema operativo durante la transición.

---

## 📊 Assessment del Proyecto Actual

### Módulos Identificados

| Módulo | Archivos | Complejidad | Prioridad | Riesgo | Semanas Estimadas |
|--------|----------|-------------|-----------|--------|-------------------|
| `app.service` | 1 service | Media | Alta (core) | Medio | 2 |
| `job.service` | 1 service | Media | Media | Bajo | 1.5 |
| `healtcheck` | 3 archivos | Baja | Alta (validación) | Bajo | 0.5 |
| `share/infrastructure` | 8 servicios | Alta | Alta | Alto | 4 |

**Total estimado**: 8 semanas (2 desarrolladores)

### Métricas Actuales

- **Archivos fuente**: 47
- **Tests existentes**: 26
- **Cobertura estimada**: 55%
- **Adherencia hexagonal**: 31%
- **Módulos acoplados**: Alto (6/6)

### Métricas Objetivo Post-Migración

- **Cobertura tests**: >80%
- **Adherencia hexagonal**: >90%
- **Módulos independientes**: 100%
- **Reducción complejidad ciclomática**: -40%

---

## 🗓️ Fases de Migración

### Fase 0: Preparación (Semana 1)

**Objetivo**: Establecer infraestructura y tooling

#### Tareas

1. **Setup Schematics**
   ```bash
   cd schematics-package
   npm install
   npm run build
   npm link
   ```

2. **Crear Branch de Migración**
   ```bash
   git checkout -b migration/hexagonal-architecture
   ```

3. **Instalar Dependencias Adicionales**
   ```bash
   npm install --save-dev ts-morph testcontainers @types/node
   ```

4. **Configurar Feature Flags**
   ```typescript
   // .env
   FEATURE_FLAG_NEW_ARCHITECTURE=false
   FEATURE_FLAG_MODULES_MIGRATED=healtcheck
   ```

5. **Configurar Tests con Testcontainers**
   ```typescript
   // jest.integration.config.js
   module.exports = {
     testMatch: ['**/*.integration.spec.ts'],
     setupFilesAfterEnv: ['<rootDir>/test/setup-testcontainers.ts'],
   };
   ```

**Entregables**:
- ✅ Schematics build y linkeados
- ✅ Branch migration creado
- ✅ Feature flags configurados
- ✅ CI/CD actualizado (ver `.github/workflows/schematics-ci.yml`)

**Criterios de Aceptación**:
- [ ] Schematics genera módulo demo sin errores
- [ ] Tests existentes siguen pasando
- [ ] Pipeline CI/CD ejecuta correctamente

---

### Fase 1: Módulo Piloto - HealthCheck (Semana 2)

**Objetivo**: Validar estrategia con módulo de baja complejidad

#### Por qué HealthCheck?

- ✅ Complejidad baja (3 archivos)
- ✅ Sin dependencias complejas
- ✅ Fácil validación (endpoint HTTP simple)
- ✅ Riesgo bajo (no impacta negocio)

#### Pasos Detallados

##### 1. Generar Nuevo Módulo con Schematic

```bash
nest g @template/schematics:hexagonal-module health \
  --database=none \
  --kafka=none \
  --path=src/app \
  --skip-tests=false
```

**Resultado**: Estructura hexagonal en `src/app/health/`

##### 2. Migrar Lógica Existente

**Archivos originales**:
- `src/app/healtcheck/application/health.service.ts`
- `src/app/healtcheck/interface/health.controller.ts`
- `src/app/healtcheck/interface/health.module.ts`

**Mapeo a nueva estructura**:

| Original | Nuevo Hexagonal |
|----------|-----------------|
| `health.service.ts` | `application/usecases/check-health.usecase.ts` |
| `health.controller.ts` | `adapters/inbound/http.controller.ts` |
| `health.module.ts` | `health.module.ts` |

**Extractores de código** (usar ts-morph):

```typescript
// migration/codemods/extract-service-logic.ts
import { Project, SourceFile } from 'ts-morph';

export function extractServiceToUseCase(
  sourceFile: SourceFile,
  useCaseFile: SourceFile,
) {
  // Extraer métodos públicos de service
  const serviceClass = sourceFile.getClass('HealthService');
  const methods = serviceClass.getMethods().filter(m => m.isPublic());

  // Copiar a use case
  methods.forEach(method => {
    const methodText = method.getText();
    useCaseFile.addClass({
      name: `${method.getName().replace(/^[a-z]/, c => c.toUpperCase())}UseCase`,
      methods: [{
        name: 'execute',
        returnType: method.getReturnType().getText(),
        statements: method.getBodyText(),
      }],
    });
  });

  useCaseFile.saveSync();
}
```

**Ejecutar codemod**:

```bash
npx ts-node migration/codemods/migrate-healthcheck.ts
```

##### 3. Implementar Adapters

```typescript
// src/app/health/adapters/inbound/http.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly checkHealthUseCase: CheckHealthUseCase,
  ) {}

  @Get()
  async check(): Promise<HealthResponseDto> {
    return this.checkHealthUseCase.execute();
  }
}
```

##### 4. Actualizar Module con Feature Flag

```typescript
// src/app.module.ts
import { HealthModule as LegacyHealthModule } from './app/healtcheck/interface/health.module';
import { HealthModule as NewHealthModule } from './app/health/health.module';

const useNewArchitecture = process.env.FEATURE_FLAG_NEW_ARCHITECTURE === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ /* ... */ }),
    useNewArchitecture ? NewHealthModule : LegacyHealthModule,
    // ...
  ],
})
export class AppModule {}
```

##### 5. Testing

**Tests unitarios (nuevo)**:

```typescript
// src/app/health/tests/unit/usecases/check-health.usecase.spec.ts
describe('CheckHealthUseCase', () => {
  it('should return health status', async () => {
    const useCase = new CheckHealthUseCase(mockLogger);
    const result = await useCase.execute();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
```

**Tests de integración**:

```bash
npm test -- --testPathPattern=health.integration.spec.ts
```

**Tests E2E**:

```bash
# Arrancar app con feature flag activado
FEATURE_FLAG_NEW_ARCHITECTURE=true npm run start:dev

# En otra terminal
curl http://localhost:8080/MS/COM/Project/Service/V1/health

# Validar respuesta
{
  "status": "ok",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "version": "1.0.0"
}
```

##### 6. Code Review y Validación

**Checklist**:
- [ ] Lógica migrada sin cambios funcionales
- [ ] Tests unitarios nuevos (100% coverage use cases)
- [ ] Tests E2E pasan con feature flag ON/OFF
- [ ] Performance similar o mejor
- [ ] Logs y APM funcionan correctamente
- [ ] Documentación actualizada

**Criterios de Éxito**:
- [ ] 0 bugs en QA (1 sprint)
- [ ] Response time <50ms (igual que legacy)
- [ ] Código aprobado por 2+ revisores

##### 7. Deploy Dual (Canary)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: template-service-canary
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: app
        image: template-service:migration-health
        env:
        - name: FEATURE_FLAG_NEW_ARCHITECTURE
          value: "true"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: template-service-stable
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: template-service:stable
        env:
        - name: FEATURE_FLAG_NEW_ARCHITECTURE
          value: "false"
```

**Monitoreo**:
- Error rate canary vs stable: debe ser <=1%
- Latency P95 canary vs stable: debe ser <=+10%
- Memory/CPU canary vs stable: debe ser <=+15%

##### 8. Switchover y Cleanup

**Después de 1 sprint en producción sin issues**:

1. Feature flag a `true` en todos los envs
2. Eliminar módulo legacy:
   ```bash
   rm -rf src/app/healtcheck
   ```
3. Eliminar código feature flag en `app.module.ts`
4. Actualizar documentación

**Entregables Fase 1**:
- ✅ Módulo `health` hexagonal funcionando
- ✅ Tests 100% cobertura (unit + integration + e2e)
- ✅ 1 sprint en producción sin issues
- ✅ Código legacy eliminado
- ✅ Lecciones aprendidas documentadas

---

### Fase 2: Migración Módulos Core (Semanas 3-6)

#### Módulo 1: `job.service` (Semanas 3-4)

**Complejidad**: Media (scheduler, Kafka consumer)

**Generación**:

```bash
nest g @template/schematics:hexagonal-module jobs \
  --database=none \
  --kafka=consumer \
  --path=src/app
```

**Adaptaciones específicas**:
- Use case: `ProcessJobUseCase`
- Adapter: `JobSchedulerAdapter` (Cron integration)
- Adapter: `KafkaJobConsumerAdapter`

**Tests**:
- Unit: Mock scheduler y Kafka consumer
- Integration: Testcontainers con Kafka
- E2E: Verificar procesamiento de jobs

**Estimación**: 1.5 semanas

---

#### Módulo 2: `app.service` (Semanas 5-6)

**Complejidad**: Media (lógica de negocio, integración DB)

**Generación**:

```bash
nest g @template/schematics:hexagonal-module transactions \
  --database=oracle \
  --kafka=producer \
  --crud-mode=stored-proc \
  --ops=select,insert,update \
  --path=src/app
```

**Migración de SPs**:
- Identificar stored procedures llamados actualmente
- Mapear a convención `PRC_TRANSACTIONS_<OP>`
- Generar scripts SQL con schematic
- Validar con DBA

**Tests**:
- Unit: Mocks de repository y event publisher
- Integration: Oracle testcontainer (o mock DB si muy pesado)
- E2E: Flujo completo con DB y Kafka

**Estimación**: 2 semanas

---

### Fase 3: Infraestructura Compartida (Semanas 7-8)

**Objetivo**: Migrar `src/share/` a módulos hexagonales reutilizables

#### Estrategia

En lugar de un único `share/`, crear múltiples módulos especializados:

```
src/shared/
├── logging/               # Logger hexagonal
│   ├── domain/ports/
│   │   └── i-logger.port.ts
│   ├── adapters/
│   │   └── winston-logger.adapter.ts
│   └── logging.module.ts
│
├── observability/         # APM hexagonal
│   ├── domain/ports/
│   │   └── i-tracing.port.ts
│   ├── adapters/
│   │   └── elastic-apm.adapter.ts
│   └── observability.module.ts
│
├── database/
│   ├── oracle/
│   │   └── oracle.module.ts
│   ├── mssql/
│   │   └── mssql.module.ts
│   └── mongodb/
│       └── mongodb.module.ts
│
└── messaging/
    └── kafka/
        └── kafka.module.ts
```

**Ventajas**:
- Módulos pueden usarse independientemente
- Testing más fácil (cada módulo es testeable aisladamente)
- Versionado y evolución independiente

**Generación**:

```bash
# Logger module
nest g @template/schematics:hexagonal-module logging \
  --database=none \
  --kafka=none \
  --path=src/shared

# Observability module
nest g @template/schematics:hexagonal-module observability \
  --database=none \
  --kafka=none \
  --path=src/shared
```

**Estimación**: 2 semanas

---

## 🔄 Estrategia de Rollback

### Rollback en Cada Fase

**Si módulo migrado falla**:

1. **Inmediato** (< 5 min):
   ```bash
   kubectl set env deployment/template-service FEATURE_FLAG_NEW_ARCHITECTURE=false
   kubectl rollout restart deployment/template-service
   ```

2. **Investigación** (< 1 día):
   - Revisar logs APM y errores
   - Identificar root cause
   - Crear hotfix en branch migration

3. **Retry** (siguiente sprint):
   - Aplicar fix
   - Repetir validación QA
   - Redeploy con feature flag

### Rollback Completo

**Si migración no viable después de 3 intentos**:

1. Merge solo mejoras validadas (ej: tests, documentación)
2. Mantener proyecto actual
3. Re-evaluar estrategia (considerar refactor selectivo)

---

## 📈 KPIs y Métricas de Éxito

### Métricas Técnicas

| Métrica | Baseline | Objetivo | Tracking |
|---------|----------|----------|----------|
| **Cobertura Tests** | 55% | >80% | Codecov |
| **Adherencia Hexagonal** | 31% | >90% | Code review |
| **Complejidad Ciclomática** | Media: 8 | Media: <5 | SonarQube |
| **Deuda Técnica** | 15 días | <5 días | SonarQube |
| **Bugs Producción** | Baseline | -40% | Jira |
| **Tiempo Onboarding** | 3 semanas | 1 semana | Encuesta |

### Métricas de Performance

| Métrica | Baseline | Objetivo |
|---------|----------|----------|
| **Response Time P95** | 150ms | <200ms (+30% tolerancia) |
| **Throughput** | 100 req/s | >=100 req/s |
| **Memory Usage** | 256MB | <300MB |
| **CPU Usage** | 40% | <50% |

### Métricas de Negocio

| Métrica | Objetivo |
|---------|----------|
| **Downtime** | 0 minutos |
| **Bugs Críticos** | 0 en producción |
| **Velocidad Desarrollo** | +50% (módulos nuevos en 30min vs 2 días) |

---

## 🛠️ Herramientas y Scripts

### 1. Script de Análisis de Módulo

```bash
# migration/scripts/analyze-module.sh
#!/bin/bash

MODULE_PATH=$1

echo "📊 Analyzing module: $MODULE_PATH"
echo ""

# Count files
FILES=$(find $MODULE_PATH -name "*.ts" ! -name "*.spec.ts" | wc -l)
TESTS=$(find $MODULE_PATH -name "*.spec.ts" | wc -l)

echo "Files: $FILES"
echo "Tests: $TESTS"
echo "Test Coverage: $(echo "scale=2; $TESTS * 100 / $FILES" | bc)%"
echo ""

# Dependencies
echo "Dependencies:"
grep -r "from '@" $MODULE_PATH | sed "s/.*from '\(@[^']*\)'.*/\1/" | sort | uniq -c | sort -rn

# Complexity
echo ""
echo "Complexity:"
npx ts-prune $MODULE_PATH | wc -l
```

### 2. Codemod: Extraer Service a UseCase

```typescript
// migration/codemods/extract-usecase.ts
import { Project, SourceFile, ClassDeclaration } from 'ts-morph';

export function extractServiceToUseCase(
  servicePath: string,
  useCasePath: string,
  methodName: string,
) {
  const project = new Project();

  const serviceFile = project.addSourceFileAtPath(servicePath);
  const serviceClass = serviceFile.getClassOrThrow(classNameFromPath(servicePath));

  const method = serviceClass.getMethodOrThrow(methodName);

  // Create use case file
  const useCaseFile = project.createSourceFile(useCasePath, '', { overwrite: true });

  useCaseFile.addClass({
    name: `${capitalize(methodName)}UseCase`,
    isExported: true,
    decorators: [{ name: 'Injectable', arguments: [] }],
    ctors: [{
      parameters: extractDependencies(serviceClass),
    }],
    methods: [{
      name: 'execute',
      returnType: method.getReturnType().getText(),
      isAsync: method.isAsync(),
      statements: method.getBodyText(),
    }],
  });

  useCaseFile.saveSync();
  console.log(`✅ Created use case: ${useCasePath}`);
}

function extractDependencies(classDecl: ClassDeclaration) {
  const ctor = classDecl.getConstructors()[0];
  if (!ctor) return [];

  return ctor.getParameters().map(param => ({
    name: param.getName(),
    type: param.getType().getText(),
    scope: param.getScope(),
    isReadonly: param.isReadonly(),
  }));
}
```

**Uso**:

```bash
npx ts-node migration/codemods/extract-usecase.ts \
  --service src/app/application/app.service.ts \
  --method transactionService \
  --output src/app/transactions/application/usecases/process-transaction.usecase.ts
```

### 3. Script de Validación Pre-Migration

```bash
# migration/scripts/pre-migration-check.sh
#!/bin/bash

echo "🔍 Pre-Migration Validation"
echo ""

# Check tests passing
echo "1. Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failing. Fix before migrating."
  exit 1
fi

# Check build
echo "2. Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failing. Fix before migrating."
  exit 1
fi

# Check coverage
echo "3. Checking coverage..."
COVERAGE=$(npm test -- --coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
if [ $COVERAGE -lt 50 ]; then
  echo "⚠️  Warning: Coverage below 50% ($COVERAGE%). Consider adding tests first."
fi

# Check for uncommitted changes
echo "4. Checking git status..."
if [[ -n $(git status -s) ]]; then
  echo "❌ Uncommitted changes. Commit or stash before migrating."
  exit 1
fi

echo ""
echo "✅ Pre-migration checks passed!"
```

---

## 📚 Recursos y Capacitación

### Materiales de Capacitación

1. **Workshop Arquitectura Hexagonal** (4 horas)
   - Principios DDD y Hexagonal
   - Demo con módulo payments
   - Q&A

2. **Hands-On: Generación de Módulos** (2 horas)
   - Uso del schematic CLI
   - Opciones avanzadas
   - Troubleshooting

3. **Code Review Guidelines** (1 hora)
   - Checklist de arquitectura hexagonal
   - Patrones a buscar/evitar
   - Ejemplos

### Pair Programming

- **Sprint 1-2**: Todo el equipo hace pair programming en módulo piloto
- **Sprint 3+**: Pair programming opcional, code reviews obligatorios

### Documentación Interna

- ADR (Architecture Decision Records) en `docs/adr/`
- Runbook de migración actualizado semanalmente
- FAQs en Confluence

---

## ✅ Checklist Final Pre-Production

Antes de cada deploy a producción, validar:

### Funcional
- [ ] Todos los tests pasan (unit, integration, e2e)
- [ ] Feature flag probado en staging (ON/OFF)
- [ ] Validación manual QA aprobada
- [ ] Performance tests: latency, throughput OK

### No-Funcional
- [ ] Logs y APM funcionan correctamente
- [ ] Métricas de negocio registrándose
- [ ] Alertas configuradas (Prometheus/Grafana)
- [ ] Documentación actualizada (README, Swagger)

### Rollback
- [ ] Plan de rollback documentado
- [ ] Feature flag puede desactivarse en <5min
- [ ] Backup de BD (si aplica)
- [ ] Equipo de guardia notificado

---

## 📞 Contactos y Escalamiento

| Rol | Nombre | Contacto | Horario |
|-----|--------|----------|---------|
| **Arquitecto Lead** | TBD | arquitecto@claro.com | L-V 8-18h |
| **Tech Lead Migration** | TBD | techlead@claro.com | L-V 8-18h |
| **DBA Oracle** | TBD | dba@claro.com | L-V 9-17h |
| **DevOps Lead** | TBD | devops@claro.com | 24/7 on-call |

**Escalamiento**:
1. Issue bloqueante → Slack #migration-hexagonal
2. Sin respuesta <1h → Contactar Tech Lead
3. Crítico en producción → Activar on-call DevOps

---

## 📅 Timeline Resumido

| Fase | Duración | Entregable |
|------|----------|------------|
| **Fase 0: Preparación** | 1 semana | Tooling, CI/CD, feature flags |
| **Fase 1: Piloto (HealthCheck)** | 1 semana | Módulo hexagonal validado en prod |
| **Fase 2: Core Modules** | 4 semanas | job.service, app.service migrados |
| **Fase 3: Shared Infrastructure** | 2 semanas | Módulos compartidos hexagonales |
| **Validación Final** | 1 semana | Auditoría, documentación, training |
| **TOTAL** | **9 semanas** | Proyecto 100% hexagonal |

**Recursos**: 2 desarrolladores senior + 1 arquitecto (50%) + 1 QA (50%)

---

**Aprobado por**: _________________
**Fecha**: _________________

---

**Elaborado por:** Célula Azure - Fábrica Digital Claro
