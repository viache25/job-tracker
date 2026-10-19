import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

/** Lower-case hex SHA-256 of a UTF-8 string. */
export function sha256(value: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
}
