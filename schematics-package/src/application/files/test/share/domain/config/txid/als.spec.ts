import { als, runWithTx, RequestStore } from '@share/domain/config/txid/als';

describe('AsyncLocalStorage', () => {
  describe('als', () => {
    it('should be defined', () => {
      expect(als).toBeDefined();
    });

    it('should return undefined when no context is set', () => {
      const store = als.getStore();
      expect(store).toBeUndefined();
    });
  });

  describe('runWithTx', () => {
    it('should execute function with txId in context', async () => {
      const testTxId = 'test-tx-123';
      let capturedTxId: string | undefined;

      await runWithTx(() => {
        const store = als.getStore();
        capturedTxId = store?.txId;
        return Promise.resolve('success');
      }, testTxId);

      expect(capturedTxId).toBe(testTxId);
    });

    it('should return the result of the executed function', async () => {
      const expectedResult = 'test-result';

      const result = await runWithTx(() => {
        return Promise.resolve(expectedResult);
      }, 'test-tx-456');

      expect(result).toBe(expectedResult);
    });

    it('should handle synchronous functions', async () => {
      const testTxId = 'sync-tx-789';
      let capturedTxId: string | undefined;

      const result = await runWithTx(() => {
        const store = als.getStore();
        capturedTxId = store?.txId;
        return 'sync-result';
      }, testTxId);

      expect(capturedTxId).toBe(testTxId);
      expect(result).toBe('sync-result');
    });

    it('should handle asynchronous functions', async () => {
      const testTxId = 'async-tx-101112';
      let capturedTxId: string | undefined;

      const result = await runWithTx(async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        const store = als.getStore();
        capturedTxId = store?.txId;
        return 'async-result';
      }, testTxId);

      expect(capturedTxId).toBe(testTxId);
      expect(result).toBe('async-result');
    });

    it('should propagate errors from the executed function', async () => {
      const testError = new Error('Test error');

      await expect(
        runWithTx(() => {
          throw testError;
        }, 'error-tx-131415'),
      ).rejects.toThrow(testError);
    });

    it('should propagate async errors from the executed function', async () => {
      const testError = new Error('Async test error');

      await expect(
        runWithTx(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw testError;
        }, 'async-error-tx-161718'),
      ).rejects.toThrow(testError);
    });

    it('should isolate contexts between different executions', async () => {
      const txId1 = 'tx-1';
      const txId2 = 'tx-2';
      const results: string[] = [];

      const promise1 = runWithTx(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        const store = als.getStore();
        results.push(store?.txId || 'undefined-1');
        return 'result-1';
      }, txId1);

      const promise2 = runWithTx(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const store = als.getStore();
        results.push(store?.txId || 'undefined-2');
        return 'result-2';
      }, txId2);

      await Promise.all([promise1, promise2]);

      expect(results).toContain(txId1);
      expect(results).toContain(txId2);
      expect(results.length).toBe(2);
    });

    it('should maintain context across nested async operations', async () => {
      const testTxId = 'nested-tx-192021';
      const capturedTxIds: string[] = [];

      await runWithTx(async () => {
        // First level
        const store1 = als.getStore();
        capturedTxIds.push(store1?.txId || 'undefined-1');

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Second level
        const store2 = als.getStore();
        capturedTxIds.push(store2?.txId || 'undefined-2');

        // Nested function call
        await (async () => {
          const store3 = als.getStore();
          capturedTxIds.push(store3?.txId || 'undefined-3');
        })();

        return 'nested-result';
      }, testTxId);

      expect(capturedTxIds).toEqual([testTxId, testTxId, testTxId]);
    });
  });

  describe('RequestStore interface', () => {
    it('should define the correct structure', () => {
      const store: RequestStore = { txId: 'test-id' };
      expect(store.txId).toBe('test-id');
      expect(typeof store.txId).toBe('string');
    });
  });
});
