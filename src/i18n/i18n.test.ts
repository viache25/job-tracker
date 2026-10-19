import de from './de.json';
import en from './en.json';
import { resolveLanguage } from './index';
import ru from './ru.json';

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

describe('translations', () => {
  const ruKeys = keys(ru).sort();

  it.each([
    ['de', de],
    ['en', en],
  ])('%s has the same keys as ru', (_name, tree) => {
    expect(keys(tree as Tree).sort()).toEqual(ruKeys);
  });

  it('has no empty strings', () => {
    for (const tree of [ru, de, en]) {
      const empty = keys(tree as Tree).filter((k) => {
        const value = k
          .split('.')
          .reduce<string | Tree>((node, part) => (node as Tree)[part]!, tree);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(empty).toEqual([]);
    }
  });
});

describe('resolveLanguage', () => {
  it('uses an explicit preference', () => {
    expect(resolveLanguage('de', ['en-US'])).toBe('de');
  });

  it('uses the first supported device language', () => {
    expect(resolveLanguage('system', ['fr-FR', 'de-AT', 'en'])).toBe('de');
  });

  it('falls back to ru', () => {
    expect(resolveLanguage('system', ['fr-FR', null])).toBe('ru');
  });
});
