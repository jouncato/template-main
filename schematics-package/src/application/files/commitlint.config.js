module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Cuando un commit agrega una nueva característica a nuestro software o evoluciona una existente.
        'fix', // Cuando el commit representa una corrección a un error en el código de la aplicación.
        'docs', // Cuando añadamos documentación al proyecto o hagamos cambios sobre la existente.
        'style', //  Cuando hay cambios de formato (guía de estilo), se ha olvidado un paréntesis o llave, etc… No se altera el código de producción.
        'refactor', // Cuando se modifica el código de producción, por ejemplo renombrar una variable, simplificar un método, añadir un early return, etc…
        'test', // Cuando se añaden o modifican tests. No se altera el código de producción.
        'chore', // Para tareas rutinarias, por ejemplo actualizar composer, tareas de gulp, modificar el .gitignore, etc… No se altera el código de producción.
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
