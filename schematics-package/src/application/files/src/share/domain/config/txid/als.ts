// share/domain/config/als.ts
import { AsyncLocalStorage } from 'async_hooks';

export const als = new AsyncLocalStorage<RequestStore>();

export interface RequestStore {
  txId: string;
}

export async function runWithTx<T>(fn: () => Promise<T> | T, txId: string) {
  return await als.run({ txId }, async () => {
    try {
      return await fn();
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  });
}
