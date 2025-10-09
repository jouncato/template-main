# 🔧 Solución de Problemas

## Error: "Invalid schematic @template/schematics:application"

### Causa
Este error ocurre cuando `npm link` no vincula correctamente el paquete globalmente, por lo que NestJS CLI no puede encontrar el schematic.

---

## ✅ Soluciones

### **Solución 1: Usar Script Local (Recomendado)**

En lugar de usar `npm link`, puedes ejecutar el schematic directamente con el script helper:

```bash
# Desde schematics-package/
npm run generate:local application my-service

# Con opciones (nota el -- antes de las opciones)
npm run generate:local application my-service -- --skip-install --skip-git

# Generar módulo hexagonal
npm run generate:local hexagonal-module payments -- --database=oracle --kafka=producer --path=src/app
```

**Opciones disponibles para `application`:**
- `--package-manager=<npm|yarn|pnpm>` - Gestor de paquetes
- `--skip-install` - No instalar dependencias
- `--skip-git` - No inicializar git

**Opciones disponibles para `hexagonal-module`:**
- `--database=<oracle|mssql|mongodb|none>`
- `--kafka=<none|producer|consumer|both>`
- `--crud-mode=<stored-proc|orm|mixed>`
- `--ops=<select,insert,update,delete>`
- `--auth=<none|jwt|oauth2>`
- `--path=<path>` - Ruta donde crear el módulo

---

### **Solución 2: Menú Interactivo (Más Fácil)**

El menú interactivo funciona sin necesidad de `npm link`:

```bash
# Desde schematics-package/
npm run menu
```

El menú te guiará paso a paso y no requiere recordar comandos.

---

### **Solución 3: Forzar npm link Global**

Si prefieres usar `npm link`, intenta estos pasos:

```bash
# 1. Desinstalar link anterior (si existe)
npm unlink -g @template/schematics

# 2. Limpiar caché de npm
npm cache clean --force

# 3. Recompilar
npm run build

# 4. Crear link global
npm link

# 5. Verificar instalación
npm list -g @template/schematics

# 6. Probar
nest g @template/schematics:application my-service
```

---

### **Solución 4: Instalación Global Manual**

```bash
# Desde schematics-package/
npm pack

# Esto crea: template-schematics-1.0.0.tgz

# Instalar globalmente
npm install -g ./template-schematics-1.0.0.tgz

# Probar
nest g @template/schematics:application my-service
```

---

## 📝 Ejemplos de Uso

### Usando el Script Local

```bash
# Generar aplicación
cd C:\Proj-Dev\template-main\schematics-package
npm run generate:local application my-service

# Navegar al proyecto generado
cd my-service

# Instalar dependencias
npm install

# Generar módulo hexagonal
cd ..
npm run generate:local hexagonal-module payments -- --database=oracle --kafka=producer --path=my-service/src/app

# Ejecutar el servicio
cd my-service
npm run start:dev
```

### Usando el Menú Interactivo

```bash
# Generar aplicación y módulos
cd C:\Proj-Dev\template-main\schematics-package
npm run menu
```

---

## 🎯 Recomendación

**Usa el Menú Interactivo (`npm run menu`)** - Es la forma más fácil y no requiere configuración adicional.

Si necesitas usar comandos directos, usa la **Solución 1 con path local**.

---

## ⚠️ Notas Importantes

1. **Siempre compila antes de usar**: `npm run build`
2. **El menú interactivo siempre funciona** sin necesidad de `npm link`
3. **Los paths locales son más confiables** que `npm link` en Windows
4. **Si usas npm link**, asegúrate de que el directorio global de npm esté en tu PATH

---

## 🔍 Verificar Instalación

```bash
# Ver paquetes globales
npm list -g --depth=0

# Ver path de npm global
npm config get prefix

# Verificar que collection.json existe
dir dist\collection.json
```
