// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect } from '@jest/globals';

describe('Hash Utility', () => {
  describe('hashPassword', () => {
    it('should export hashPassword function', async () => {
      const { hashPassword } = await import('../../src/utils/hash.js');
      expect(typeof hashPassword).toBe('function');
    });
  });

  describe('comparePassword', () => {
    it('should export comparePassword function', async () => {
      const { comparePassword } = await import('../../src/utils/hash.js');
      expect(typeof comparePassword).toBe('function');
    });
  });
});
