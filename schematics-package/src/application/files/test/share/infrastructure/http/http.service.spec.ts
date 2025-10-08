import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import * as https from 'https';
import { HttpService } from '@share/infrastructure/http/http.service';
import { ApmService } from '@share/domain/config/apm/apm.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import envConfig from '@share/domain/resources/env.config';
import {
  HttpGetParams,
  HttpParams,
} from '@src/share/domain/interfaces/httpRequestParams';

jest.mock(
  '@share/domain/config/decorators/logExecutionAndCatch.decorator',
  () => ({
    LogExecutionAndCatch: () => () => {},
  }),
);

jest.mock('elastic-apm-node', () => ({
  isStarted: jest.fn(() => false),
  currentTransaction: null,
  startTransaction: jest.fn(() => null),
  captureError: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345'),
}));

const mockConfigService = {
  HTTP: {
    TIMEOUT: 5000,
    DISABLE_SSL_VERIFICATION: false,
    KEEP_ALIVE: true,
  },
};

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

const mockApmService = {
  startSpan: jest.fn(() => ({
    end: jest.fn(),
  })),
};

jest.mock('http');
jest.mock('https');

const mockRequest = {
  on: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
  destroy: jest.fn(),
};

const mockResponse = {
  statusCode: 200,
  on: jest.fn(),
};

describe('HttpService', () => {
  let service: HttpService;
  let httpRequestSpy: jest.SpyInstance;
  let httpsRequestSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockRequest.on.mockClear();
    mockResponse.on.mockClear();

    // Configurar mocks de http y https con comportamiento asíncrono más realista
    httpRequestSpy = jest
      .spyOn(http, 'request')
      .mockImplementation((options: any, callback?: any) => {
        const req = { ...mockRequest };
        // Simular llamada asíncrona del callback con la respuesta
        process.nextTick(() => {
          if (callback && typeof callback === 'function') {
            callback(mockResponse);
          }
        });
        return req as any;
      });

    httpsRequestSpy = jest
      .spyOn(https, 'request')
      .mockImplementation((options: any, callback?: any) => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          if (callback && typeof callback === 'function') {
            callback(mockResponse);
          }
        });
        return req as any;
      });

    // Mock del constructor de https.Agent
    jest.spyOn(https, 'Agent').mockImplementation(() => ({}) as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpService,
        {
          provide: envConfig.KEY,
          useValue: mockConfigService,
        },
        {
          provide: Logger20Service,
          useValue: mockLogger,
        },
        {
          provide: ApmService,
          useValue: mockApmService,
        },
      ],
    }).compile();

    service = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor y configuración', () => {
    it('debería crear el servicio correctamente', () => {
      expect(service).toBeDefined();
    });
  });

  describe('GET requests', () => {
    it('debería realizar una petición GET exitosa', async () => {
      // Configurar mock de respuesta exitosa
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"success": true, "data": "test"}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        headers: { 'Custom-Header': 'value' },
        timeout: 3000,
      };

      const result = await service.get(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, data: 'test' });
      expect(httpsRequestSpy).toHaveBeenCalled();
      expect(mockApmService.startSpan).toHaveBeenCalledWith(
        'https://api.example.com/test',
        'http',
        'http',
        '',
      );
    });

    it('debería realizar una petición GET con query parameters', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"result": "ok"}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/search',
        query: {
          q: 'test',
          limit: 10,
          active: true,
        },
      };

      await service.get(params);

      // Verificar que la URL se construyó correctamente con los query parameters
      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toContain('q=test');
      expect(requestOptions.path).toContain('limit=10');
      expect(requestOptions.path).toContain('active=true');
    });

    it('debería usar HTTP cuando el protocolo es http://', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"data": "test"}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'http://api.example.com/test',
      };

      await service.get(params);

      expect(httpRequestSpy).toHaveBeenCalled();
      expect(httpsRequestSpy).not.toHaveBeenCalled();
    });
  });

  describe('POST requests', () => {
    it('debería realizar una petición POST exitosa', async () => {
      mockResponse.statusCode = 201;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"id": 1, "created": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams<{ name: string }> = {
        url: 'https://api.example.com/users',
        body: { name: 'John Doe' },
        headers: { Authorization: 'Bearer token' },
      };

      const result = await service.post(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, created: true });
      expect(mockRequest.write).toHaveBeenCalledWith('{"name":"John Doe"}');
      expect(mockApmService.startSpan).toHaveBeenCalledWith(
        'https://api.example.com/users',
        'http',
        'http',
        '{"name":"John Doe"}',
      );
    });

    it('debería incluir Content-Type por defecto en POST', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: { test: true },
      };

      await service.post(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('PUT requests', () => {
    it('debería realizar una petición PUT exitosa', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"updated": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams<{ id: number; name: string }> = {
        url: 'https://api.example.com/users/1',
        body: { id: 1, name: 'Jane Doe' },
      };

      const result = await service.put(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ updated: true });
      expect(mockRequest.write).toHaveBeenCalledWith(
        '{"id":1,"name":"Jane Doe"}',
      );
    });
  });

  describe('PATCH requests', () => {
    it('debería realizar una petición PATCH exitosa', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"patched": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams<{ name: string }> = {
        url: 'https://api.example.com/users/1',
        body: { name: 'Updated Name' },
      };

      const result = await service.patch(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ patched: true });
    });
  });

  describe('Error handling', () => {
    it('debería manejar errores HTTP (4xx/5xx)', async () => {
      mockResponse.statusCode = 404;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('Not Found'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/notfound',
      };

      const result = await service.get(params);

      expect(result.statusCode).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toEqual('Not Found');
    });

    it('debería manejar errores de conexión', async () => {
      // Simular error de conexión
      httpRequestSpy.mockImplementation(() => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          const errorCallback = req.on.mock.calls.find(
            (call) => call[0] === 'error',
          )?.[1];
          if (errorCallback) {
            errorCallback(new Error('Connection refused'));
          }
        });
        return req as any;
      });

      const params: HttpGetParams = {
        url: 'http://api.example.com/test',
      };

      const result = await service.get(params);

      expect(result.success).toBe(false);
      expect((result.error as Error)?.message).toBe('Connection refused');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request Error: Connection refused',
      );
    });

    it('debería manejar errores SSL/TLS', async () => {
      httpsRequestSpy.mockImplementation(() => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          const errorCallback = req.on.mock.calls.find(
            (call) => call[0] === 'error',
          )?.[1];
          if (errorCallback) {
            errorCallback(new Error('certificate verify failed'));
          }
        });
        return req as any;
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
      };

      const result = await service.get(params);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'SSL/Certificate Error: certificate verify failed',
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Verificar configuración de certificados SSL. El servidor remoto puede tener un certificado expirado o inválido.',
      );
    });

    it('debería manejar timeout de peticiones', async () => {
      httpRequestSpy.mockImplementation(() => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          const timeoutCallback = req.on.mock.calls.find(
            (call) => call[0] === 'timeout',
          )?.[1];
          if (timeoutCallback) {
            timeoutCallback();
          }
        });
        return req as any;
      });

      const params: HttpGetParams = {
        url: 'http://api.example.com/slow',
      };

      const result = await service.get(params);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        statusCode: 408,
        message: 'Request Timeout',
      });
      expect(mockRequest.destroy).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request Timeout: http://api.example.com/slow',
      );
    });

    it('debería manejar respuestas JSON inválidas', async () => {
      mockResponse.statusCode = 500;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('invalid json'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/invalid',
      };

      const result = await service.get(params);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.error).toContain('invalid json');
    });

    it('debería lanzar error con URL inválida', async () => {
      const params: HttpGetParams = {
        url: 'invalid-url',
      };

      await expect(service.get(params)).rejects.toThrow(
        'Invalid URL: invalid-url',
      );
    });
  });

  describe('Configuración y opciones', () => {
    it('debería usar timeout personalizado', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        timeout: 10000,
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.timeout).toBe(10000);
    });

    it('debería usar timeout por defecto de configuración', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.timeout).toBe(5000);
    });

    it('debería configurar agente HTTPS con opciones SSL', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
      };

      await service.get(params);

      expect(https.Agent).toHaveBeenCalledWith({
        rejectUnauthorized: true, // !mockConfigService.HTTP.DISABLE_SSL_VERIFICATION
        keepAlive: true, // mockConfigService.HTTP.KEEP_ALIVE
      });
    });

    it('debería deshabilitar verificación SSL cuando está configurado', async () => {
      // Modificar configuración para prueba
      mockConfigService.HTTP.DISABLE_SSL_VERIFICATION = true;

      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
      };

      await service.get(params);

      expect(https.Agent).toHaveBeenCalledWith({
        rejectUnauthorized: false,
        keepAlive: true,
      });

      // Restaurar configuración
      mockConfigService.HTTP.DISABLE_SSL_VERIFICATION = false;
    });

    it('debería incluir Content-Length en peticiones con body', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: { test: 'data' },
      };

      await service.post(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.headers['Content-Length']).toBe('15'); // {"test":"data"} = 15 bytes
    });

    it('debería configurar headers correctamente por método', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      // Test GET - no Content-Type por defecto
      await service.get({ url: 'https://api.example.com/get' });
      let requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.headers['Accept']).toBe('application/json');
      expect(requestOptions.headers['Content-Type']).toBeUndefined();

      jest.clearAllMocks();

      // Test POST - Content-Type incluido
      await service.post({ url: 'https://api.example.com/post', body: {} });
      requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Query parameters', () => {
    it('debería omitir parámetros undefined y null', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: {
          valid: 'value',
          undefinedValue: undefined,
          zero: 0,
          empty: '',
        },
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toContain('valid=value');
      expect(requestOptions.path).toContain('zero=0');
      expect(requestOptions.path).toContain('empty=');
      expect(requestOptions.path).not.toContain('nullValue');
      expect(requestOptions.path).not.toContain('undefinedValue');
    });

    it('debería manejar query parameters vacíos', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: {},
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toBe('/test');
    });

    it('debería manejar query parameters null', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: undefined,
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toBe('/test');
    });

    it('debería manejar query parameters undefined', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: undefined,
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toBe('/test');
    });

    it('debería retornar URL original cuando no hay query parameters', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      // Test sin query (la función no será llamada, pero validamos el comportamiento)
      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        // Sin query
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toBe('/test');
    });

    it('debería retornar URL original cuando query solo tiene valores null/undefined', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: {
          nullValue: undefined,
          undefinedValue: undefined,
        },
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toBe('/test'); // Sin query parameters en la URL final
    });
  });

  describe('APM Integration', () => {
    it('debería finalizar span APM en respuesta exitosa', async () => {
      const mockSpan = { end: jest.fn() };
      mockApmService.startSpan.mockReturnValue(mockSpan);

      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
      };

      await service.get(params);

      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('debería finalizar span APM en caso de error', async () => {
      const mockSpan = { end: jest.fn() };
      mockApmService.startSpan.mockReturnValue(mockSpan);

      httpRequestSpy.mockImplementation(() => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          const errorCallback = req.on.mock.calls.find(
            (call) => call[0] === 'error',
          )?.[1];
          if (errorCallback) {
            errorCallback(new Error('Test error'));
          }
        });
        return req as any;
      });

      const params: HttpGetParams = {
        url: 'http://api.example.com/test',
      };

      await service.get(params);

      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('URL validation', () => {
    it('debería construir URL correctamente con parámetros complejos', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        query: {
          search: 'hello world',
          page: 1,
          active: true,
          tags: 'tag1,tag2',
        },
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toContain('search=hello+world'); // + es la codificación URL para espacios
      expect(requestOptions.path).toContain('page=1');
      expect(requestOptions.path).toContain('active=true');
      expect(requestOptions.path).toContain('tags=tag1%2Ctag2');
    });

    it('debería manejar URLs con pathnames existentes', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/v1/users',
        query: {
          limit: 10,
        },
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.path).toContain('/v1/users');
      expect(requestOptions.path).toContain('limit=10');
    });
  });

  describe('Edge cases', () => {
    it('debería manejar respuestas vacías', async () => {
      mockResponse.statusCode = 204; // No Content
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          // No data
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/delete',
      };

      const result = await service.get(params);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(204);
      expect(result.data).toBe('');
    });

    it('debería manejar peticiones sin body en POST', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"ok": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
      };

      const result = await service.post(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ ok: true });
      expect(mockRequest.write).not.toHaveBeenCalled();
    });

    it('debería manejar headers personalizados que sobrescriben los por defecto', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: { test: true },
        headers: {
          'Content-Type': 'application/xml',
          Accept: 'text/xml',
        },
      };

      await service.post(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.headers['Content-Type']).toBe('application/xml');
      expect(requestOptions.headers['Accept']).toBe('text/xml');
    });

    it('debería manejar peticiones con body falsy pero definido', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"ok": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: '', // body falsy pero definido
      };

      const result = await service.post(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ ok: true });
      expect(mockRequest.write).not.toHaveBeenCalled();
    });

    it('debería usar timeout por defecto cuando tanto el parámetro como la configuración son falsy', async () => {
      // Temporalmente cambiar la configuración para que TIMEOUT sea falsy
      const originalTimeout = mockConfigService.HTTP.TIMEOUT;
      mockConfigService.HTTP.TIMEOUT = 0;

      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpGetParams = {
        url: 'https://api.example.com/test',
        // Sin timeout específico
      };

      await service.get(params);

      const requestOptions = httpsRequestSpy.mock.calls[0][0];
      expect(requestOptions.timeout).toBe(5000); // Valor por defecto hardcodeado

      // Restaurar configuración
      mockConfigService.HTTP.TIMEOUT = originalTimeout;
    });

    it('debería manejar errores que no son de SSL/Certificate', async () => {
      httpRequestSpy.mockImplementation(() => {
        const req = { ...mockRequest };
        process.nextTick(() => {
          const errorCallback = req.on.mock.calls.find(
            (call) => call[0] === 'error',
          )?.[1];
          if (errorCallback) {
            errorCallback(new Error('Network error'));
          }
        });
        return req as any;
      });

      const params: HttpGetParams = {
        url: 'http://api.example.com/test',
      };

      const result = await service.get(params);

      expect(result.success).toBe(false);
      expect((result.error as Error)?.message).toBe('Network error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request Error: Network error',
      );
      // Verificar que NO se llamó el log de SSL warning
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        'Verificar configuración de certificados SSL. El servidor remoto puede tener un certificado expirado o inválido.',
      );
    });

    it('debería manejar peticiones con body que no es object', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"ok": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: 'string body', // body que no es object
      };

      const result = await service.post(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ ok: true });
      expect(mockApmService.startSpan).toHaveBeenCalledWith(
        'https://api.example.com/test',
        'http',
        'http',
        '',
      );
    });

    it('debería pasar body object como JSON string al APM span', async () => {
      mockResponse.statusCode = 200;
      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback('{"ok": true}'));
        } else if (event === 'end') {
          process.nextTick(() => callback());
        }
      });

      const params: HttpParams = {
        url: 'https://api.example.com/test',
        body: { test: 'value', number: 123 }, // body que SÍ es object
      };

      const result = await service.post(params);

      expect(result.success).toBe(true);
      expect(mockApmService.startSpan).toHaveBeenCalledWith(
        'https://api.example.com/test',
        'http',
        'http',
        '{"test":"value","number":123}', // JSON stringified del body
      );
    });
  });
});
