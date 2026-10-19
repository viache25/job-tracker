import { squish, truncate } from './text';

describe('squish', () => {
  it('collapses whitespace', () => {
    expect(squish('  a \n\t b  ')).toBe('a b');
  });
});

describe('truncate', () => {
  it('keeps short strings', () => {
    expect(truncate('abc', 5)).toBe('abc');
  });

  it('cuts long strings with an ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
  });
});
