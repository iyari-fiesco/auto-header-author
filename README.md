# Auto Header Auto
Es una herramienta que automatiza la inserción y actualización de encabezados de archivos en varios lenguajes de programación. Facilita el seguimiento de la autoría y las modificaciones de los archivos de código fuente.

## Características
- Inserta encabezados personalizados en archivos nuevos.
- Actualiza automáticamente la fecha de la última modificación en los encabezados existentes.
- Soporta múltiples lenguajes de programación y formatos de comentarios.
- Configuración flexible a través de un archivo JSON.

## Requisitos
- Node.js v18 o superior
- Git

## Instalación

```bash
npx auto-header-auto install
```

## Configuracion

Modifica el archivo `auto-header-local.json` con tu nombre y correo electrónico:

```json
{
  "author": "Tu Nombre",
  "email": "ejemplo@correo.com"
}
```
En el archivo `auto-header.config.json` se pueden configurar los lenguajes soportados.
```json
{
  "commentStyles": {
    ".js": { "start": "//", "end": "" },
    ".py": { "start": "#", "end": "" },
    "xml": {"type": "block", "start": "<#--", "end": "-->"},
  },
  "extensions": [".js", ".py", ".xml"]
}
```

## Como funciona
1. Al ejecutar el comando de instalación, se configura un hook de pre-commit de Git que activa la herramienta antes de cada commit.
2. La herramienta escanea los archivos modificados y agrega o actualiza los encabezados según la configuración.
3. Los encabezados incluyen información sobre el autor, la fecha de creación y la fecha de la última modificación.

## FAQ
- **Falla al intentar hacer un commit**
Asegúrate de que Node.js y Git estén correctamente instalados y configurados en tu sistema. Verifica también que el hook de pre-commit esté presente en el directorio `.husky` de tu proyecto. Ademas, debes de modificar el archivo `auto-header-local.json` con tu informacion personal. Si el problema persiste, revisa los mensajes de error para obtener más detalles y considera abrir un issue en el repositorio del proyecto.

- **¿Puedo personalizar el formato del encabezado?**
No, por el momento el formato del encabezado es fijo, pero se planea agregar opciones de personalización en futuras versiones.

- **¿Qué lenguajes de programación son compatibles?**
Actualmente, la herramienta soporta JavaScript, TypeScript, Python, Go, Java y XML. Se planea agregar más lenguajes en el futuro.

- **¿Cómo puedo desinstalar la herramienta?**
Para desinstalar la herramienta, elimina el hook de pre-commit en el directorio `.husky` y elimina cualquier configuración relacionada en tu proyecto.

- **No veo los cambios en los encabezados después de hacer commit**
Asegúrate de que los archivos que estás modificando tengan extensiones compatibles y que el hook de pre-commit esté funcionando correctamente. Puedes probar ejecutar el comando manualmente para verificar si los encabezados se actualizan. Si el problema persiste, revisa los mensajes de error para obtener más detalles y considera abrir un issue en el repositorio del proyecto.

## Proximos pasos
- Agregar soporte para más lenguajes de programación.
- Mejorar la personalización de los encabezados.
- Historial de autores y cambios.
- Adicion de resumenes de cambios.