import Fastify from 'fastify';
import txidPlugin from '@share/domain/config/txid/txid.plugin';
import { als } from '@share/domain/config/txid/als';

describe('TxId Plugin', () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(txidPlugin);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('onRequest hook', () => {
    it('should generate a new transaction ID when no headers are provided', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.headers['x-transaction-id']).toBeDefined();
      expect(response.headers['x-transaction-id']).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should use x-transaction-id header when provided', async () => {
      const txId = 'test-transaction-id';

      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-transaction-id': txId,
        },
      });

      expect(response.headers['x-transaction-id']).toBe(txId);
    });

    it('should use x-request-id header when x-transaction-id is not provided', async () => {
      const requestId = 'test-request-id';

      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-request-id': requestId,
        },
      });

      expect(response.headers['x-transaction-id']).toBe(requestId);
    });

    it('should prioritize x-transaction-id over x-request-id when both are provided', async () => {
      const txId = 'test-transaction-id';
      const requestId = 'test-request-id';

      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-transaction-id': txId,
          'x-request-id': requestId,
        },
      });

      expect(response.headers['x-transaction-id']).toBe(txId);
    });

    it('should set transaction ID in async local storage', async () => {
      const txId = 'test-transaction-id';
      let capturedTxId: string | undefined;

      fastify.get('/', async (request, reply) => {
        capturedTxId = als.getStore()?.txId;
        return { success: true };
      });

      await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-transaction-id': txId,
        },
      });

      expect(capturedTxId).toBe(txId);
    });

    it('should generate unique transaction IDs for multiple requests', async () => {
      const response1 = await fastify.inject({
        method: 'GET',
        url: '/',
      });

      const response2 = await fastify.inject({
        method: 'GET',
        url: '/',
      });

      expect(response1.headers['x-transaction-id']).toBeDefined();
      expect(response2.headers['x-transaction-id']).toBeDefined();
      expect(response1.headers['x-transaction-id']).not.toBe(
        response2.headers['x-transaction-id'],
      );
    });

    it('should handle case-insensitive headers', async () => {
      const txId = 'test-transaction-id';

      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'X-Transaction-ID': txId,
        },
      });

      expect(response.headers['x-transaction-id']).toBe(txId);
    });
  });

  describe('generateTxId function', () => {
    it('should generate transaction IDs with correct format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/',
      });

      const txId = response.headers['x-transaction-id'] as string;
      const parts = txId.split('-');

      expect(parts).toHaveLength(2);
      expect(Number(parts[0])).toBeGreaterThan(0); // timestamp
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // counter in base36
    });

    it('should increment counter for consecutive requests', async () => {
      const responses = await Promise.all([
        fastify.inject({ method: 'GET', url: '/' }),
        fastify.inject({ method: 'GET', url: '/' }),
        fastify.inject({ method: 'GET', url: '/' }),
      ]);

      const txIds = responses.map(
        (r) => r.headers['x-transaction-id'] as string,
      );
      const counters = txIds.map((id) => parseInt(id.split('-')[1], 36));

      expect(counters[1]).toBe(counters[0] + 1);
      expect(counters[2]).toBe(counters[1] + 1);
    });
  });

  describe('error handling', () => {
    it('should handle empty header values', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-transaction-id': '',
        },
      });

      // Should generate a new ID when header is empty
      expect(response.headers['x-transaction-id']).toBeDefined();
      expect(response.headers['x-transaction-id']).not.toBe('');
      expect(response.headers['x-transaction-id']).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should handle null header values', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-transaction-id': null as any,
        },
      });

      // Should generate a new ID when header is null
      expect(response.headers['x-transaction-id']).toBeDefined();
      expect(response.headers['x-transaction-id']).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });
});
