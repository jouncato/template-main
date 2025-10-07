import {
  SERVICE_NAME,
  SERVICE_VERSION,
  SERVICE_DESCRIPTION,
  OK,
  SERVICE_UNAVAILABLE,
} from '@share/domain/resources/constants';

describe('Constants', () => {
  describe('Exported constants', () => {
    test('SERVICE_NAME should be defined', () => {
      expect(SERVICE_NAME).toBeDefined();
      expect(
        typeof SERVICE_NAME === 'string' || SERVICE_NAME === undefined,
      ).toBe(true);
    });

    test('SERVICE_VERSION should be defined and correct', () => {
      expect(SERVICE_VERSION).toBeDefined();
      expect(SERVICE_VERSION).toBe('1.0');
      expect(typeof SERVICE_VERSION).toBe('string');
    });

    test('SERVICE_DESCRIPTION should be defined and correct', () => {
      expect(SERVICE_DESCRIPTION).toBeDefined();
      expect(SERVICE_DESCRIPTION).toBe('Descripción del servicio');
      expect(typeof SERVICE_DESCRIPTION).toBe('string');
    });

    test('OK should be defined and correct', () => {
      expect(OK).toBeDefined();
      expect(OK).toBe('OK');
      expect(typeof OK).toBe('string');
    });

    test('SERVICE_UNAVAILABLE should be defined', () => {
      expect(SERVICE_UNAVAILABLE).toBeDefined();
      expect(SERVICE_UNAVAILABLE).toBe('Not available');
    });
  });

  describe('Constants integrity', () => {
    test('constants should maintain their expected values', () => {
      expect(SERVICE_VERSION).toBe('1.0');
      expect(SERVICE_DESCRIPTION).toBe('Descripción del servicio');
      expect(OK).toBe('OK');

      expect(typeof SERVICE_VERSION).toBe('string');
      expect(typeof SERVICE_DESCRIPTION).toBe('string');
      expect(typeof OK).toBe('string');
    });
  });
});
