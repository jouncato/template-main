import { TRANSACTION_CONTROLLER_PATH } from '@src/app/interfaces/controller/dynamic-controller-paths';

describe('Controller Paths', () => {
  describe('TRANSACTION_CONTROLLER_PATH', () => {
    it('should be defined', () => {
      expect(TRANSACTION_CONTROLLER_PATH).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof TRANSACTION_CONTROLLER_PATH).toBe('string');
    });

    it('should start with a forward slash', () => {
      expect(TRANSACTION_CONTROLLER_PATH).toMatch(/^\//);
    });

    it('should not be empty', () => {
      expect(TRANSACTION_CONTROLLER_PATH).not.toBe('');
      expect(TRANSACTION_CONTROLLER_PATH.length).toBeGreaterThan(0);
    });

    it('should be a valid URL path format', () => {
      // Verificar que sigue el formato de ruta URL válido
      expect(TRANSACTION_CONTROLLER_PATH).toMatch(/^\/[a-zA-Z0-9\/\-_]+$/);
    });

    it('should export the constant correctly', () => {
      // Test de importación para asegurar que la exportación funciona
      const imported = require('@src/app/interfaces/controller/dynamic-controller-paths');
      expect(imported.TRANSACTION_CONTROLLER_PATH).toBeDefined();
    });
  });
});
