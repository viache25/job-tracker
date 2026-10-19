import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { IMPORT_LIMITS, ImportError } from './transfer';

/** Writes CSV to the cache and opens the share sheet. False if sharing is unavailable. */
export async function shareCsv(csv: string, fileName: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  // BOM so Excel opens UTF-8 (umlauts, Cyrillic) correctly.
  file.write('﻿' + csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: fileName,
  });
  return true;
}

/** Lets the user pick a CSV file; null when cancelled. Enforces the size limit. */
export async function pickCsv(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if ((asset.size ?? 0) > IMPORT_LIMITS.bytes) throw new ImportError('tooLarge');
  const file = new File(asset.uri);
  if ((file.size ?? 0) > IMPORT_LIMITS.bytes) throw new ImportError('tooLarge');
  return file.text();
}
