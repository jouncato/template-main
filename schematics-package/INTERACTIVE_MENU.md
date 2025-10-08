# 🎮 Menú Interactivo - Generador de Proyectos NestJS

El generador incluye un **menú interactivo** que facilita la creación de proyectos y módulos sin necesidad de recordar todos los parámetros de línea de comandos.

---

## 🚀 Uso

### Opción 1: Desde el directorio schematics-package

```bash
cd schematics-package
npm run menu
```

### Opción 2: Después de npm link (global)

```bash
template-generate
```

### Opción 3: Alias corto

```bash
cd schematics-package
npm run generate
```

---

## 📋 Características del Menú

### Menú Principal

```
╔════════════════════════════════════════════════════════════╗
║     🏗️  GENERADOR DE PROYECTOS NESTJS - MENÚ INTERACTIVO  ║
╚════════════════════════════════════════════════════════════╝

Selecciona una opción:

  1. Generar Aplicación Completa (nest new)
  2. Generar Módulo Hexagonal (dentro de proyecto existente)
  3. Ver Ejemplos de Uso
  4. Ayuda y Documentación
  5. Salir
```

---

## 1️⃣ Generar Aplicación Completa

### Preguntas Interactivas

1. **Nombre del proyecto**
   - Ejemplo: `payments-service`
   - Validación: Requerido

2. **¿Usar directorio personalizado?**
   - Sí/No
   - Si es Sí: Solicita ruta (ej: `apps/my-service`)

3. **Gestor de paquetes**
   - Opciones: npm (default), yarn, pnpm
   - Selección numérica: 1-3

4. **¿Omitir instalación de dependencias?**
   - Sí/No
   - Útil para CI/CD

5. **¿Omitir inicialización de git?**
   - Sí/No

6. **¿Habilitar modo estricto de TypeScript?**
   - Sí/No

### Resumen de Configuración

Antes de ejecutar, muestra un resumen:

```
📋 RESUMEN DE CONFIGURACIÓN:

  Nombre:           payments-service
  Directorio:       apps/payments-service
  Package Manager:  pnpm
  Skip Install:     No
  Skip Git:         No
  Modo Estricto:    Sí

  Comando: nest g @template/schematics:application payments-service --directory="apps/payments-service" --package-manager=pnpm --strict

¿Ejecutar generación? (S/n):
```

### Próximos Pasos

Al finalizar exitosamente, muestra:

```
✅ ¡Aplicación generada exitosamente!

📝 Próximos pasos:

  1. cd apps/payments-service
  2. cp .env.example .env
  3. # Editar .env con tus credenciales
  4. pnpm run start:dev
```

---

## 2️⃣ Generar Módulo Hexagonal

### Preguntas Interactivas

1. **Nombre del módulo**
   - Formato: kebab-case
   - Ejemplo: `payments`, `user-management`
   - Validación: Requerido

2. **Base de datos**
   ```
   1. Oracle (stored procedures)
   2. SQL Server (stored procedures)
   3. MongoDB (Mongoose ORM)
   4. Ninguna
   ```

3. **Modo CRUD** (solo si Oracle o SQL Server)
   ```
   1. Stored Procedures (recomendado)
   2. ORM
   3. Mixto
   ```

4. **Capacidades Kafka**
   ```
   1. Ninguna
   2. Producer (publicar eventos)
   3. Consumer (consumir eventos)
   4. Ambos (Producer + Consumer)
   ```

5. **Operaciones CRUD**
   ```
   1. Todas (select, insert, update, delete)
   2. Solo lectura (select)
   3. Lectura y escritura (select, insert, update)
   4. Personalizado
   ```

6. **Autenticación**
   ```
   1. Ninguna
   2. JWT
   3. OAuth2
   ```

7. **¿Usar Confluent Schema Registry?** (si Kafka está habilitado)
   - Sí/No

8. **Ruta del módulo**
   - Default: `src/app`
   - Personalizable

9. **¿Omitir generación de tests?**
   - Sí/No

### Resumen de Configuración

```
📋 RESUMEN DE CONFIGURACIÓN:

  Módulo:           payments
  Base de datos:    oracle
  Modo CRUD:        stored-proc
  Kafka:            both
  Operaciones:      select,insert,update
  Autenticación:    jwt
  Schema Registry:  confluent
  Ruta:             src/app
  Skip Tests:       No

  Comando: nest g @template/schematics:hexagonal-module payments --database=oracle --kafka=both --ops=select,insert,update --auth=jwt --schema-registry=confluent --path=src/app

¿Ejecutar generación? (S/n):
```

### Próximos Pasos

```
✅ ¡Módulo generado exitosamente!

📝 Próximos pasos:

  1. Revisar archivos generados en src/app/payments/
  2. Desplegar stored procedures desde src/app/payments/infra/db/
  3. Configurar topics de Kafka
  4. Implementar lógica de negocio en los use cases
  5. Ejecutar tests: npm test
```

---

## 3️⃣ Ver Ejemplos de Uso

Muestra ejemplos completos de comandos para casos de uso comunes:

### Ejemplo 1: Microservicio de Pagos
```bash
nest g @template/schematics:application payments-service
cd payments-service
nest g @template/schematics:hexagonal-module payments \
  --database=oracle --kafka=both --auth=jwt
```

### Ejemplo 2: API Gateway
```bash
nest g @template/schematics:application api-gateway
cd api-gateway
nest g @template/schematics:hexagonal-module users \
  --database=mongodb --crud-mode=orm --auth=jwt
```

### Ejemplo 3: Servicio Proxy
```bash
nest g @template/schematics:application proxy-service
cd proxy-service
nest g @template/schematics:hexagonal-module external-api \
  --database=none --kafka=none
```

---

## 4️⃣ Ayuda y Documentación

Muestra información sobre:

- **Documentación disponible**
  - README.md
  - QUICKSTART.md
  - TECHNICAL_MANUAL.md
  - VALIDATION_REPORT.md
  - DELIVERY_SUMMARY.md

- **Comandos útiles**
  ```bash
  nest g @template/schematics:application --help
  nest g @template/schematics:hexagonal-module --help
  ```

- **Soporte**
  - Email: desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com
  - Equipo: Célula Azure - Fábrica Digital Claro

---

## 🎨 Características Visuales

### Colores

- 🔵 **Azul** - Títulos y encabezados
- 🟢 **Verde** - Valores seleccionados y éxito
- 🟡 **Amarillo** - Advertencias y confirmaciones
- 🔴 **Rojo** - Errores
- ⚪ **Gris** - Información secundaria y comandos
- 🟣 **Magenta** - Opciones especiales
- 🟠 **Cyan** - Preguntas y prompts

### Símbolos

- ✅ Éxito
- ❌ Error
- ⚠️ Advertencia
- 📦 Generación
- 📋 Resumen
- 📝 Próximos pasos
- 🚀 Ejecución
- 📚 Ejemplos
- 📖 Documentación
- 👋 Despedida

---

## 💡 Ventajas del Menú Interactivo

### 1. Facilidad de Uso
- ✅ No necesitas recordar todos los parámetros
- ✅ Guía paso a paso
- ✅ Validación en tiempo real

### 2. Prevención de Errores
- ✅ Opciones predefinidas (no hay typos)
- ✅ Validación de combinaciones inválidas
- ✅ Confirmación antes de ejecutar

### 3. Aprendizaje
- ✅ Muestra el comando equivalente
- ✅ Ejemplos integrados
- ✅ Documentación accesible

### 4. Productividad
- ✅ Más rápido que escribir comandos largos
- ✅ Resumen visual de configuración
- ✅ Próximos pasos claros

---

## 🔧 Personalización

### Modificar el Menú

El archivo del menú está en:
```
schematics-package/scripts/interactive-menu.js
```

Puedes personalizar:
- Opciones del menú
- Preguntas
- Validaciones
- Mensajes
- Colores

### Agregar Nuevas Opciones

Ejemplo para agregar una opción:

```javascript
// En showMainMenu()
console.log(chalk.white('  6. ') + chalk.blue('Nueva Opción'));

// En main()
case '6':
  await nuevaFuncion();
  break;
```

---

## 🐛 Troubleshooting

### Error: "chalk is not defined"

**Solución:**
```bash
cd schematics-package
npm install
```

### Error: "nest command not found"

**Solución:**
```bash
npm install -g @nestjs/cli
```

### El menú no se muestra correctamente

**Causa:** Terminal no soporta colores

**Solución:** Usar una terminal moderna (Windows Terminal, iTerm2, etc.)

---

## 📞 Soporte

Si encuentras problemas con el menú interactivo:

**Email:** desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com  
**Equipo:** Célula Azure - Fábrica Digital Claro

---

**¡Disfruta del menú interactivo! 🎮**
