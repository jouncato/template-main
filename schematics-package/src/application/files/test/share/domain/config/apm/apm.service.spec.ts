// apm.service.spec.ts
import { Logger } from '@nestjs/common';

jest.mock('elastic-apm-node', () => ({
  isStarted: jest.fn(),
  captureError: jest.fn(),
  startTransaction: jest.fn(),
  setTransactionName: jest.fn(),
  endTransaction: jest.fn(),
  startSpan: jest.fn(),
  setCustomContext: jest.fn(),
  currentTransaction: null as any,
}));

import apm from 'elastic-apm-node';
import { ApmService } from '@src/share/domain/config/apm/apm.service';

const apmMock = apm as unknown as {
  isStarted: jest.Mock;
  captureError: jest.Mock;
  startTransaction: jest.Mock;
  setTransactionName: jest.Mock;
  endTransaction: jest.Mock;
  startSpan: jest.Mock;
  setCustomContext: jest.Mock;
  currentTransaction: any;
};

describe('ApmService', () => {
  let service: ApmService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance; // por si luego usas debug

  beforeAll(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    debugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    apmMock.currentTransaction = null;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('loggea cuando APM está iniciado', () => {
      apmMock.isStarted.mockReturnValue(true);
      service = new ApmService();
      expect(logSpy).toHaveBeenCalledWith(
        'APM Agent already initialized and active',
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('advierte cuando APM NO está iniciado', () => {
      apmMock.isStarted.mockReturnValue(false);
      service = new ApmService();
      expect(warnSpy).toHaveBeenCalledWith('APM Agent is not started');
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  it('isStarted delega en apm.isStarted', () => {
    apmMock.isStarted.mockReturnValue(true);
    service = new ApmService();
    expect(service.isStarted()).toBe(true);
    expect(apmMock.isStarted).toHaveBeenCalled();
  });

  it('captureError delega en apm.captureError', () => {
    service = new ApmService();
    const err = new Error('boom');
    service.captureError(err);
    expect(apmMock.captureError).toHaveBeenCalledWith(err);
  });

  describe('Transacciones y spans', () => {
    beforeEach(() => {
      service = new ApmService();
    });

    it('startTransaction delega en apm.startTransaction', () => {
      apmMock.startTransaction.mockReturnValue({ id: 'tx1' });
      const tx = service.startTransaction('MyTx');
      expect(apmMock.startTransaction).toHaveBeenCalledWith('MyTx');
      expect(tx).toEqual({ id: 'tx1' });
    });

    it('setTransactionName delega en apm.setTransactionName', () => {
      service.setTransactionName('tx-name');
      expect(apmMock.setTransactionName).toHaveBeenCalledWith('tx-name');
    });

    it('endTransaction delega en apm.endTransaction', () => {
      service.endTransaction();
      expect(apmMock.endTransaction).toHaveBeenCalled();
    });

    it('startSpan delega en apm.startSpan', () => {
      const span = { id: 'span1' };
      apmMock.startSpan.mockReturnValue(span);
      const res = service.startSpan('db', 'db', 'postgres', 'query');
      expect(apmMock.startSpan).toHaveBeenCalledWith(
        'db',
        'db',
        'postgres',
        'query',
      );
      expect(res).toBe(span);
    });
  });

  describe('Helpers de labels/contexto', () => {
    beforeEach(() => {
      service = new ApmService();
    });

    it('sanitizeLabelKey reemplaza . y caracteres especiales y minúsculas', () => {
      const input = 'X-Request.ID user:name@domain.com';
      const out = service.sanitizeLabelKey(input);
      expect(out).toBe('x_request_id_user_name_domain_com');
    });

    it('setLabel usa la transacción actual y sanitiza la clave', () => {
      const setLabel = jest.fn();
      apmMock.currentTransaction = { setLabel };

      service.setLabel('X-Request.ID', 'abc123');
      expect(setLabel).toHaveBeenCalledWith('x_request_id', 'abc123');
    });

    it('setLabel no hace nada si no hay transacción', () => {
      apmMock.currentTransaction = null;
      // No debe lanzar ni llamar apm.* (solo setLabel del tx si existiera)
      service.setLabel('foo', 'bar');
    });

    it('setCustomContext delega en apm.setCustomContext', () => {
      const ctx = { a: 1, b: 'x' };
      service.setCustomContext(ctx);
      expect(apmMock.setCustomContext).toHaveBeenCalledWith(ctx);
    });
  });
});
