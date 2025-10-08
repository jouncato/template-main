// test/share/domain/config/apm/apm-init.spec.ts
import * as path from 'path';

// Ruta ABSOLUTA a tu módulo real:
const MODULE = path.join(
  process.cwd(),
  'src/share/domain/config/apm/apm-init', // ← ajusta si cambia
);

describe('apm-init', () => {
  const originalEnv = process.env;
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.resetModules(); // limpia el cache de require
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    logSpy.mockRestore();
  });

  // Helper para crear mock de APM por test
  function withApmMock(impl?: Partial<Record<string, any>>) {
    const base = {
      start: jest.fn(),
      isStarted: jest.fn(),
      setGlobalLabel: jest.fn(),
    };
    const mocked = { ...base, ...impl };

    // mock de dotenv/config a NO-OP para evitar que un .env interfiera
    jest.doMock('dotenv/config', () => ({}), { virtual: true });

    jest.doMock('elastic-apm-node', () => mocked, { virtual: true });
    return mocked as {
      start: jest.Mock;
      isStarted: jest.Mock;
      setGlobalLabel: jest.Mock;
    };
  }

  it('no inicia cuando ELASTIC_APM_ACTIVE=false', () => {
    process.env.ELASTIC_APM_ACTIVE = 'false';

    const apm = withApmMock(); // no importa el valor de isStarted en este caso

    jest.isolateModules(() => {
      require(MODULE);
    });

    expect(apm.isStarted).not.toHaveBeenCalled();
    expect(apm.start).not.toHaveBeenCalled();
    expect(apm.setGlobalLabel).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      '⚠️ APM Agent está deshabilitado (ELASTIC_APM_ACTIVE=false)',
    );
  });

  it('inicia cuando ELASTIC_APM_ACTIVE=true y apm.isStarted()=false', () => {
    process.env.ELASTIC_APM_ACTIVE = 'true';
    process.env.SERVICE_NAME = 'MyService';
    process.env.ELASTIC_APM_SERVER_URL = 'http://apm.local';
    process.env.ELASTIC_APM_ENVIRONMENT = 'qa';
    process.env.ELASTIC_APM_SECRET_TOKEN = 'secret';
    process.env.ELASTIC_APM_LOG_LEVEL = 'debug';

    const apm = withApmMock({ isStarted: jest.fn(() => false) });

    jest.isolateModules(() => {
      require(MODULE);
    });

    expect(console.log).toHaveBeenCalledWith('🎯 Inicializando APM Agent...');
    expect(apm.start).toHaveBeenCalledTimes(1);
    expect(apm.start).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: 'MyService',
        serverUrl: 'http://apm.local',
        environment: 'qa',
        secretToken: 'secret',
        logLevel: 'debug',
        instrument: true,
        instrumentIncomingHTTPRequests: true,
        captureHeaders: true,
      }),
    );
    expect(apm.setGlobalLabel).toHaveBeenCalledWith('region', 'co');
    expect(apm.setGlobalLabel).toHaveBeenCalledWith('runtime', 'node');
    expect(apm.setGlobalLabel).toHaveBeenCalledWith('framework', 'nestjs');
    expect(console.log).toHaveBeenLastCalledWith(
      '🎯 APM Agent iniciado correctamente',
    );
  });

  it('no reinicia cuando apm.isStarted()=true', () => {
    process.env.ELASTIC_APM_ACTIVE = 'true';

    const apm = withApmMock({ isStarted: jest.fn(() => true) });

    jest.isolateModules(() => {
      require(MODULE);
    });

    expect(apm.start).not.toHaveBeenCalled();
    expect(apm.setGlobalLabel).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('🎯 APM Agent ya estaba iniciado');
  });

  it('usa nombre por defecto cuando SERVICE_NAME no está definido', () => {
    process.env.ELASTIC_APM_ACTIVE = 'true';
    delete process.env.SERVICE_NAME;

    const apm = withApmMock({ isStarted: jest.fn(() => false) });

    jest.isolateModules(() => {
      require(MODULE);
    });

    expect(apm.start).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: 'EstandarNetjs' }),
    );
  });
});
