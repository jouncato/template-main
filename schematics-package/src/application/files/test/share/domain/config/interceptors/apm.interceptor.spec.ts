// apm.interceptor.spec.ts
import { of, throwError, firstValueFrom } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';

// Mock de ApmService
const apmServiceMock = {
  setLabel: jest.fn(),
  captureError: jest.fn(),
};

// Mock del ALS (txid)
jest.mock('@src/share/domain/config/txid/als', () => ({
  als: { getStore: jest.fn() },
}));
import { als } from '@src/share/domain/config/txid/als';
import { ApmInterceptor } from '@src/share/domain/config/interceptors/apm.interceptor';

describe('ApmInterceptor', () => {
  const makeCtx = (method = 'GET') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method }),
      }),
      // handler con nombre legible para el label "component"
      getHandler: () =>
        function myHandler() {
          /* noop */
        },
      getClass: () => ({ name: 'TestController' }),
    }) as unknown as ExecutionContext;

  const makeNext = (result$: any): CallHandler => ({
    handle: () => result$,
  });

  let interceptor: ApmInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new ApmInterceptor(apmServiceMock as any);
  });

  it('setea labels y deja pasar la respuesta (con txId presente)', async () => {
    (als.getStore as jest.Mock).mockReturnValue({ txId: 'abc-123' });

    const ctx = makeCtx('POST');
    const next = makeNext(of({ ok: true }));

    const out = await firstValueFrom(interceptor.intercept(ctx, next));
    expect(out).toEqual({ ok: true });

    // Labels
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'transaction.id',
      'abc-123',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'component',
      'myHandler',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'class',
      'TestController',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith('method', 'POST');

    // No error capturado
    expect(apmServiceMock.captureError).not.toHaveBeenCalled();
  });

  it('usa fallback "transaction_id" cuando no hay store ni txId', async () => {
    (als.getStore as jest.Mock).mockReturnValue(undefined);

    const ctx = makeCtx('GET');
    const next = makeNext(of('ok'));

    const out = await firstValueFrom(interceptor.intercept(ctx, next));
    expect(out).toBe('ok');

    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'transaction.id',
      'transaction_id',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith('method', 'GET');
  });

  it('captura error y lo re-lanza', async () => {
    (als.getStore as jest.Mock).mockReturnValue({ txId: 'tx-err' });

    const boom = new Error('boom');
    const ctx = makeCtx('PATCH');
    const next = makeNext(throwError(() => boom));

    // Verifica que re-lanza
    await expect(
      firstValueFrom(interceptor.intercept(ctx, next)),
    ).rejects.toThrow('boom');

    // Se setean labels igual antes del error
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'transaction.id',
      'tx-err',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'component',
      'myHandler',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith(
      'class',
      'TestController',
    );
    expect(apmServiceMock.setLabel).toHaveBeenCalledWith('method', 'PATCH');

    // Captura el error en APM
    expect(apmServiceMock.captureError).toHaveBeenCalledTimes(1);
    expect(apmServiceMock.captureError).toHaveBeenCalledWith(boom);
  });
});
