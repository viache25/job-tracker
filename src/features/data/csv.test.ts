import { escapeFormula, parseCsv, toCsv, unescapeFormula } from './csv';

describe('csv', () => {
  it('round-trips quotes, commas and line breaks', () => {
    const rows = [['Acme, GmbH', 'Said "hi"\nthen left', '']];
    const text = toCsv(['company', 'notes', 'x'], rows);
    expect(parseCsv(text)).toEqual([['company', 'notes', 'x'], ...rows]);
  });

  it('neutralises formulas and restores them on import', () => {
    for (const v of ['=SUM(A1)', '+43 660', '-1', '@cmd', '\tx']) {
      expect(escapeFormula(v)).toBe(`'${v}`);
      expect(unescapeFormula(escapeFormula(v))).toBe(v);
    }
    expect(escapeFormula('Vienna')).toBe('Vienna');
    expect(unescapeFormula("'quoted")).toBe("'quoted");
    expect(toCsv(['a'], [['=1+1']])).toBe("a\r\n'=1+1\r\n");
  });

  it('handles BOM, CRLF, blank lines and a missing final newline', () => {
    expect(parseCsv('﻿a,b\r\n\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('rejects an unterminated quote', () => {
    expect(() => parseCsv('a\n"oops')).toThrow();
  });
});
