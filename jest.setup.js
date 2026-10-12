/* global jest */
// Node implementations of expo-crypto for tests.
jest.mock('expo-crypto', () => {
  const crypto = require('crypto');
  return {
    randomUUID: () => crypto.randomUUID(),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algorithm, data) =>
      crypto.createHash('sha256').update(data).digest('hex'),
  };
});
