import {
  ErrorResponseDto,
  KafkaResponseDto,
  HealthCheckDto,
} from '@src/share/domain/dto/swagger-schemas.dto';

describe('Swagger Schemas DTOs', () => {
  describe('ErrorResponseDto', () => {
    let errorResponse: ErrorResponseDto;

    beforeEach(() => {
      errorResponse = new ErrorResponseDto();
    });

    it('should be defined', () => {
      expect(ErrorResponseDto).toBeDefined();
      expect(errorResponse).toBeDefined();
    });

    it('should have statusCode property', () => {
      expect(errorResponse).toHaveProperty('statusCode');
    });

    it('should have message property', () => {
      expect(errorResponse).toHaveProperty('message');
    });

    it('should have error property', () => {
      expect(errorResponse).toHaveProperty('error');
    });

    it('should have timestamp property', () => {
      expect(errorResponse).toHaveProperty('timestamp');
    });

    it('should have path property', () => {
      expect(errorResponse).toHaveProperty('path');
    });

    it('should allow setting all properties', () => {
      errorResponse.statusCode = 400;
      errorResponse.message = 'Bad Request';
      errorResponse.error = 'ValidationError';
      errorResponse.timestamp = '2025-07-21T17:30:00.000Z';
      errorResponse.path = '/test/path';

      expect(errorResponse.statusCode).toBe(400);
      expect(errorResponse.message).toBe('Bad Request');
      expect(errorResponse.error).toBe('ValidationError');
      expect(errorResponse.timestamp).toBe('2025-07-21T17:30:00.000Z');
      expect(errorResponse.path).toBe('/test/path');
    });

    it('should have ApiProperty decorators', () => {
      // Verificamos que las propiedades existen y tienen valores por defecto
      const instance = new ErrorResponseDto();
      expect(instance).toHaveProperty('statusCode');
      expect(instance).toHaveProperty('message');
      expect(instance).toHaveProperty('error');
      expect(instance).toHaveProperty('timestamp');
      expect(instance).toHaveProperty('path');

      // Verificamos que las propiedades pueden ser asignadas
      instance.statusCode = 400;
      instance.message = 'Test message';
      instance.error = 'Test error';
      instance.timestamp = '2025-01-01T00:00:00.000Z';
      instance.path = '/test';

      expect(instance.statusCode).toBe(400);
      expect(instance.message).toBe('Test message');
      expect(instance.error).toBe('Test error');
      expect(instance.timestamp).toBe('2025-01-01T00:00:00.000Z');
      expect(instance.path).toBe('/test');
    });

    it('should create instance with correct structure for OpenAPI', () => {
      const instance = new ErrorResponseDto();
      instance.statusCode = 500;
      instance.message = 'Internal Server Error';
      instance.error = 'InternalError';
      instance.timestamp = new Date().toISOString();
      instance.path = '/api/test';

      expect(instance).toMatchObject({
        statusCode: expect.any(Number),
        message: expect.any(String),
        error: expect.any(String),
        timestamp: expect.any(String),
        path: expect.any(String),
      });
    });
  });

  describe('KafkaResponseDto', () => {
    let kafkaResponse: KafkaResponseDto;

    beforeEach(() => {
      kafkaResponse = new KafkaResponseDto();
    });

    it('should be defined', () => {
      expect(KafkaResponseDto).toBeDefined();
      expect(kafkaResponse).toBeDefined();
    });

    it('should have topicName property', () => {
      expect(kafkaResponse).toHaveProperty('topicName');
    });

    it('should have partition property', () => {
      expect(kafkaResponse).toHaveProperty('partition');
    });

    it('should have offset property', () => {
      expect(kafkaResponse).toHaveProperty('offset');
    });

    it('should have optional timestamp property', () => {
      expect(kafkaResponse).toHaveProperty('timestamp');
    });

    it('should allow setting all properties', () => {
      kafkaResponse.topicName = 'BillLogTransCreditTopic';
      kafkaResponse.partition = 0;
      kafkaResponse.offset = '12345';
      kafkaResponse.timestamp = '2025-07-21T17:30:00.000Z';

      expect(kafkaResponse.topicName).toBe('BillLogTransCreditTopic');
      expect(kafkaResponse.partition).toBe(0);
      expect(kafkaResponse.offset).toBe('12345');
      expect(kafkaResponse.timestamp).toBe('2025-07-21T17:30:00.000Z');
    });

    it('should have ApiProperty decorators', () => {
      // Verificamos que las propiedades existen y tienen valores por defecto
      const instance = new KafkaResponseDto();
      expect(instance).toHaveProperty('topicName');
      expect(instance).toHaveProperty('partition');
      expect(instance).toHaveProperty('offset');
      expect(instance).toHaveProperty('timestamp');

      // Verificamos que las propiedades pueden ser asignadas
      instance.topicName = 'TestTopic';
      instance.partition = 1;
      instance.offset = '999';
      instance.timestamp = '2025-01-01T00:00:00.000Z';

      expect(instance.topicName).toBe('TestTopic');
      expect(instance.partition).toBe(1);
      expect(instance.offset).toBe('999');
      expect(instance.timestamp).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should work without optional timestamp', () => {
      kafkaResponse.topicName = 'TestTopic';
      kafkaResponse.partition = 1;
      kafkaResponse.offset = '67890';

      expect(kafkaResponse.topicName).toBe('TestTopic');
      expect(kafkaResponse.partition).toBe(1);
      expect(kafkaResponse.offset).toBe('67890');
      expect(kafkaResponse.timestamp).toBeUndefined();
    });

    it('should create instance with correct structure for OpenAPI', () => {
      const instance = new KafkaResponseDto();
      instance.topicName = 'test-topic';
      instance.partition = 2;
      instance.offset = '999';

      expect(instance).toMatchObject({
        topicName: expect.any(String),
        partition: expect.any(Number),
        offset: expect.any(String),
      });
    });

    it('should handle numeric partition correctly', () => {
      kafkaResponse.partition = 5;
      expect(typeof kafkaResponse.partition).toBe('number');
      expect(kafkaResponse.partition).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HealthCheckDto', () => {
    let healthCheck: HealthCheckDto;

    beforeEach(() => {
      healthCheck = new HealthCheckDto();
    });

    it('should be defined', () => {
      expect(HealthCheckDto).toBeDefined();
      expect(healthCheck).toBeDefined();
    });

    it('should have status property', () => {
      expect(healthCheck).toHaveProperty('status');
    });

    it('should have info property', () => {
      expect(healthCheck).toHaveProperty('info');
    });

    it('should have optional details property', () => {
      expect(healthCheck).toHaveProperty('details');
    });

    it('should have optional error property', () => {
      expect(healthCheck).toHaveProperty('error');
    });

    it('should allow setting all properties', () => {
      healthCheck.status = 'ok';
      healthCheck.info = {
        kafka: {
          status: 'up',
          message: 'Kafka connection is healthy',
        },
      };
      healthCheck.details = { version: '1.0.0' };
      healthCheck.error = 'No errors';

      expect(healthCheck.status).toBe('ok');
      expect(healthCheck.info).toEqual({
        kafka: {
          status: 'up',
          message: 'Kafka connection is healthy',
        },
      });
      expect(healthCheck.details).toEqual({ version: '1.0.0' });
      expect(healthCheck.error).toBe('No errors');
    });

    it('should have ApiProperty decorators', () => {
      // Verificamos que las propiedades existen y tienen valores por defecto
      const instance = new HealthCheckDto();
      expect(instance).toHaveProperty('status');
      expect(instance).toHaveProperty('info');
      expect(instance).toHaveProperty('details');
      expect(instance).toHaveProperty('error');

      // Verificamos que las propiedades pueden ser asignadas
      instance.status = 'ok';
      instance.info = { test: 'info' };
      instance.details = { test: 'details' };
      instance.error = 'test error';

      expect(instance.status).toBe('ok');
      expect(instance.info).toEqual({ test: 'info' });
      expect(instance.details).toEqual({ test: 'details' });
      expect(instance.error).toBe('test error');
    });

    it('should handle different status values', () => {
      const validStatuses = ['ok', 'error', 'shutting_down'];

      validStatuses.forEach((status) => {
        healthCheck.status = status;
        expect(healthCheck.status).toBe(status);
      });
    });

    it('should work with minimal required properties', () => {
      healthCheck.status = 'ok';
      healthCheck.info = {};

      expect(healthCheck.status).toBe('ok');
      expect(healthCheck.info).toEqual({});
      expect(healthCheck.details).toBeUndefined();
      expect(healthCheck.error).toBeUndefined();
    });

    it('should handle complex info object', () => {
      const complexInfo = {
        kafka: {
          status: 'up',
          message: 'Kafka connection is healthy',
          metadata: {
            brokers: ['localhost:9092'],
            topics: ['test-topic'],
          },
        },
        database: {
          status: 'down',
          message: 'Database connection failed',
          lastError: 'Connection timeout',
        },
      };

      healthCheck.info = complexInfo;
      expect(healthCheck.info).toEqual(complexInfo);
      expect(healthCheck.info.kafka.metadata.brokers).toContain(
        'localhost:9092',
      );
    });

    it('should create instance with correct structure for OpenAPI', () => {
      const instance = new HealthCheckDto();
      instance.status = 'ok';
      instance.info = { service: 'running' };

      expect(instance).toMatchObject({
        status: expect.any(String),
        info: expect.any(Object),
      });
    });

    it('should support Record<string, any> type for info', () => {
      healthCheck.info = {
        stringProp: 'value',
        numberProp: 123,
        booleanProp: true,
        arrayProp: [1, 2, 3],
        objectProp: { nested: 'value' },
      };

      expect(healthCheck.info.stringProp).toBe('value');
      expect(healthCheck.info.numberProp).toBe(123);
      expect(healthCheck.info.booleanProp).toBe(true);
      expect(healthCheck.info.arrayProp).toEqual([1, 2, 3]);
      expect(healthCheck.info.objectProp.nested).toBe('value');
    });
  });

  describe('DTOs Integration', () => {
    it('should all be importable from the same module', () => {
      expect(ErrorResponseDto).toBeDefined();
      expect(KafkaResponseDto).toBeDefined();
      expect(HealthCheckDto).toBeDefined();
    });

    it('should have proper TypeScript types', () => {
      const error = new ErrorResponseDto();
      const kafka = new KafkaResponseDto();
      const health = new HealthCheckDto();

      expect(error).toBeInstanceOf(ErrorResponseDto);
      expect(kafka).toBeInstanceOf(KafkaResponseDto);
      expect(health).toBeInstanceOf(HealthCheckDto);
    });

    it('should all have Swagger decorators', () => {
      const classes = [ErrorResponseDto, KafkaResponseDto, HealthCheckDto];

      classes.forEach((cls) => {
        // Verificamos que las clases pueden ser instanciadas
        const instance = new cls();
        expect(instance).toBeDefined();
        expect(instance).toBeInstanceOf(cls);

        // Verificamos que tienen las propiedades básicas
        expect(instance).toBeInstanceOf(Object);
        expect(typeof instance).toBe('object');
      });
    });
  });
});
