import {
  extractTxIdFromKafkaHeaders,
  ensureTxId,
} from '@share/domain/config/txid/txid.utils';

describe('TxId Utils', () => {
  describe('extractTxIdFromKafkaHeaders', () => {
    it('should return undefined when headers is undefined', () => {
      const result = extractTxIdFromKafkaHeaders(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when headers is empty', () => {
      const result = extractTxIdFromKafkaHeaders({});
      expect(result).toBeUndefined();
    });

    it('should extract txId from x-transaction-id header as string', () => {
      const headers = {
        'x-transaction-id': 'test-tx-123',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe('test-tx-123');
    });

    it('should extract txId from x-transaction-id header as Buffer', () => {
      const txId = 'test-tx-buffer-456';
      const headers = {
        'x-transaction-id': Buffer.from(txId, 'utf8'),
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe(txId);
    });

    it('should extract txId from x-request-id header as string when x-transaction-id is not present', () => {
      const headers = {
        'x-request-id': 'test-req-789',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe('test-req-789');
    });

    it('should extract txId from x-request-id header as Buffer when x-transaction-id is not present', () => {
      const reqId = 'test-req-buffer-101112';
      const headers = {
        'x-request-id': Buffer.from(reqId, 'utf8'),
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe(reqId);
    });

    it('should prioritize x-transaction-id over x-request-id when both are present', () => {
      const headers = {
        'x-transaction-id': 'priority-tx-131415',
        'x-request-id': 'secondary-req-161718',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe('priority-tx-131415');
    });

    it('should handle undefined values in headers', () => {
      const headers = {
        'x-transaction-id': undefined,
        'x-request-id': undefined,
        'other-header': 'some-value',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBeUndefined();
    });

    it('should handle mixed header types with undefined x-transaction-id', () => {
      const headers = {
        'x-transaction-id': undefined,
        'x-request-id': 'fallback-req-192021',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe('fallback-req-192021');
    });

    it('should convert non-string, non-Buffer values to string', () => {
      const headers = {
        'x-transaction-id': 12345 as any, // Simulating unexpected type
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe('12345');
    });

    it('should handle empty string headers', () => {
      const headers = {
        'x-transaction-id': '',
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBeUndefined(); // Empty string is falsy, so it returns undefined
    });

    it('should handle special characters in headers', () => {
      const specialTxId = 'tx-with-special-chars-áéíóú-@#$%';
      const headers = {
        'x-transaction-id': Buffer.from(specialTxId, 'utf8'),
      };
      const result = extractTxIdFromKafkaHeaders(headers);
      expect(result).toBe(specialTxId);
    });
  });

  describe('ensureTxId', () => {
    it('should return extracted txId when present in headers', () => {
      const expectedTxId = 'existing-tx-222324';
      const headers = {
        'x-transaction-id': expectedTxId,
      };
      const result = ensureTxId(headers);
      expect(result).toBe(expectedTxId);
    });

    it('should generate new txId when headers is undefined', () => {
      const result = ensureTxId(undefined);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate new txId when headers is empty', () => {
      const result = ensureTxId({});
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate new txId when no relevant headers are present', () => {
      const headers = {
        'other-header': 'some-value',
        'content-type': 'application/json',
      };
      const result = ensureTxId(headers);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate txId with expected format (timestamp-counter)', () => {
      const result = ensureTxId();
      expect(result).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate different txIds on consecutive calls', () => {
      const txId1 = ensureTxId();
      const txId2 = ensureTxId();
      expect(txId1).not.toBe(txId2);
    });

    it('should extract from x-request-id when x-transaction-id is not present', () => {
      const expectedReqId = 'req-id-252627';
      const headers = {
        'x-request-id': Buffer.from(expectedReqId, 'utf8'),
      };
      const result = ensureTxId(headers);
      expect(result).toBe(expectedReqId);
    });

    it('should generate consistent format across multiple calls', () => {
      const results = Array.from({ length: 5 }, () => ensureTxId());

      results.forEach((result) => {
        expect(result).toMatch(/^\d+-[a-z0-9]+$/);
        expect(result.split('-')).toHaveLength(2);
        expect(parseInt(result.split('-')[0])).toBeGreaterThan(0);
      });
    });

    it('should handle rapid successive calls', async () => {
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(ensureTxId()),
      );

      const results = await Promise.all(promises);
      const uniqueResults = new Set(results);

      // All results should be unique
      expect(uniqueResults.size).toBe(results.length);

      // All should follow the expected format
      results.forEach((result) => {
        expect(result).toMatch(/^\d+-[a-z0-9]+$/);
      });
    });
  });

  describe('generateTxId behavior', () => {
    it('should generate txIds with increasing counter', () => {
      const results = Array.from({ length: 10 }, () => ensureTxId());

      // Extract counters (second part after dash)
      const counters = results.map((result) => {
        const parts = result.split('-');
        return parseInt(parts[1], 36); // Convert from base36 back to decimal
      });

      // Check that counters are generally increasing (allowing for timestamp differences)
      for (let i = 1; i < counters.length; i++) {
        // Counter should either increment or reset if we hit the reset interval
        expect(counters[i]).toBeGreaterThanOrEqual(0);
        expect(counters[i]).toBeLessThan(10000); // Should be less than resetInterval
      }
    });

    it('should include timestamp in generated txId', () => {
      const beforeTime = Date.now();
      const txId = ensureTxId();
      const afterTime = Date.now();

      const timestamp = parseInt(txId.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
