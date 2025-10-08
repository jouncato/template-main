# 🚀 Guía de Inicio Rápido

**Tiempo estimado:** 10 minutos  
**Nivel:** Principiante

---

## 📋 Requisitos

- Node.js >= 20.x
- npm >= 10.x
- NestJS CLI >= 11.x

```bash
node --version  # >= 20.x
npm --version   # >= 10.x
nest --version  # >= 11.x
```

---

## ⚡ Instalación Rápida

### Paso 1: Instalar el Generador

```bash
cd schematics-package
npm install
npm run build
npm link
```

### Paso 2: Verificar Instalación

```bash
nest g --collection=@template/schematics --help
```

Debe mostrar:
- ✅ `application` (aliases: app, new)
- ✅ `hexagonal-module` (aliases: hex-module, hm)

---

## 🎯 Generar Tu Primer Proyecto

### Opción A: Proyecto Completo con Módulo

```bash
# 1. Generar aplicación
nest g @template/schematics:application demo

# 2. Navegar al proyecto
cd demo

# 3. Generar módulo de ejemplo
nest g @template/schematics:hexagonal-module products \
  --database=oracle \
  --kafka=producer \
  --path=src/app

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Instalar y ejecutar
npm install
npm run start:dev
```

### Opción B: Solo Aplicación Base

```bash
# Generar aplicación
nest g @template/schematics:application my-service

# Navegar e instalar
cd my-service
npm install

# Configurar
cp .env.example .env

# Ejecutar
npm run start:dev
```

---

## 📝 Configuración Mínima (.env)

```env
# Servicio
SERVICE_NAME="demo"
PORT="8080"
SERVICE_PREFIX="/MS/COM/Demo/Service/V1"
CONTROLLER_PATH="/Method"

# APM
ELASTIC_APM_SERVER_URL="https://apm-server:8200"
ELASTIC_APM_ENVIRONMENT="development"
ELASTIC_APM_ACTIVE="false"

# Oracle (si usas Oracle)
DB_USERNAME="user"
DB_PASSWORD="password"
DB_CONNECTSTRING="localhost:1521/XEPDB1"
DB_POOL_ALIAS="demo_pool"
DB_POOL_MIN=10
DB_POOL_MAX=100
DB_POOL_INCREMENT=5
DB_POOL_TIMEOUT=60
DB_QUEUE_TIMEOUT=5000
DB_STMT_CACHE_SIZE=50

# Kafka (si usas Kafka)
KAFKA_URL="localhost:9092"
KAFKA_TOPIC="demo.events"
GROUP_ID="demo-group"
SESSION_TIMEOUT=600000
HERTBEAT_INTERVAL=10000
MAXIN_FLIGHT_REQUESTS=1
LIMITKAFKA=15
```

---

## 🧪 Verificar que Funciona

```bash
# Compilar
npm run build

# Ejecutar tests
npm test

# Ejecutar en desarrollo
npm run start:dev
```

Abrir navegador en: `http://localhost:8080/api`

---

## 📚 Ejemplos Rápidos

### Módulo con Oracle

```bash
nest g @template/schematics:hexagonal-module payments \
  --database=oracle \
  --kafka=both \
  --path=src/app
```

### Módulo con SQL Server

```bash
nest g @template/schematics:hexagonal-module orders \
  --database=mssql \
  --crud-mode=stored-proc \
  --path=src/app
```

### Módulo con MongoDB

```bash
nest g @template/schematics:hexagonal-module users \
  --database=mongodb \
  --crud-mode=orm \
  --path=src/app
```

### Módulo sin Base de Datos

```bash
nest g @template/schematics:hexagonal-module external-api \
  --database=none \
  --path=src/app
```

---

## 🐳 Ejecutar con Docker

```bash
# Build
docker build -t demo:latest .

# Run
docker run -p 8080:8080 --env-file .env demo:latest
```

---

## 🆘 Problemas Comunes

### Tests fallan

**Causa:** Falta archivo `.env`

**Solución:**
```bash
cp .env.example .env
# Editar con valores reales
```

### Puerto en uso

**Causa:** Puerto 8080 ocupado

**Solución:**
```bash
# Cambiar puerto en .env
PORT="3000"
```

### Error de compilación

**Causa:** Dependencias no instaladas

**Solución:**
```bash
npm install
```

---

## 📖 Documentación Completa

Para más detalles, consulta:
- [TECHNICAL_MANUAL.md](./TECHNICAL_MANUAL.md) - Manual técnico completo
- [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) - Informe de validación
- [schematics-package/README.md](./schematics-package/README.md) - Documentación de schematics

---

## 🎓 Próximos Pasos

1. ✅ Generar tu primer proyecto
2. ✅ Explorar la estructura generada
3. ✅ Generar módulos adicionales
4. ✅ Configurar bases de datos
5. ✅ Implementar lógica de negocio
6. ✅ Escribir tests
7. ✅ Desplegar a producción

---

**¡Listo para empezar! 🚀**
