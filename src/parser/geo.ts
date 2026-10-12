/** Country and city normalisation for the DACH market (plus common neighbours). */

const COUNTRY_ALIASES: Record<string, string> = {
  at: 'AT',
  aut: 'AT',
  austria: 'AT',
  österreich: 'AT',
  oesterreich: 'AT',
  австрия: 'AT',
  de: 'DE',
  deu: 'DE',
  ger: 'DE',
  germany: 'DE',
  deutschland: 'DE',
  германия: 'DE',
  ch: 'CH',
  che: 'CH',
  switzerland: 'CH',
  schweiz: 'CH',
  suisse: 'CH',
  svizzera: 'CH',
  швейцария: 'CH',
  li: 'LI',
  liechtenstein: 'LI',
  nl: 'NL',
  netherlands: 'NL',
  niederlande: 'NL',
  pl: 'PL',
  poland: 'PL',
  polen: 'PL',
  cz: 'CZ',
  czechia: 'CZ',
  'czech republic': 'CZ',
  tschechien: 'CZ',
  hu: 'HU',
  hungary: 'HU',
  ungarn: 'HU',
  it: 'IT',
  italy: 'IT',
  italien: 'IT',
  fr: 'FR',
  france: 'FR',
  frankreich: 'FR',
  gb: 'GB',
  uk: 'GB',
  'united kingdom': 'GB',
  us: 'US',
  usa: 'US',
  'united states': 'US',
};

export function normalizeCountry(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/\.$/, '');
  return COUNTRY_ALIASES[key];
}

/** Country from a top-level domain (karriere.at → AT). Generic TLDs give nothing. */
export function countryFromHost(host: string | null | undefined): string | undefined {
  const tld = host?.toLowerCase().split('.').pop();
  if (!tld) return undefined;
  return { at: 'AT', de: 'DE', ch: 'CH', li: 'LI' }[tld];
}

const CITIES: [name: string, aliases: string[], country: string][] = [
  ['Wien', ['wien', 'vienna', 'вена'], 'AT'],
  ['Graz', ['graz'], 'AT'],
  ['Linz', ['linz'], 'AT'],
  ['Salzburg', ['salzburg'], 'AT'],
  ['Innsbruck', ['innsbruck'], 'AT'],
  ['Klagenfurt', ['klagenfurt'], 'AT'],
  ['St. Pölten', ['st. pölten', 'st. poelten', 'sankt pölten'], 'AT'],
  ['Dornbirn', ['dornbirn'], 'AT'],
  ['Wels', ['wels'], 'AT'],
  ['Villach', ['villach'], 'AT'],
  ['Hagenberg', ['hagenberg'], 'AT'],
  ['Berlin', ['berlin', 'берлин'], 'DE'],
  ['München', ['münchen', 'muenchen', 'munich', 'мюнхен'], 'DE'],
  ['Hamburg', ['hamburg', 'гамбург'], 'DE'],
  ['Köln', ['köln', 'koeln', 'cologne'], 'DE'],
  ['Frankfurt am Main', ['frankfurt am main', 'frankfurt'], 'DE'],
  ['Stuttgart', ['stuttgart'], 'DE'],
  ['Düsseldorf', ['düsseldorf', 'duesseldorf'], 'DE'],
  ['Leipzig', ['leipzig'], 'DE'],
  ['Dresden', ['dresden'], 'DE'],
  ['Nürnberg', ['nürnberg', 'nuernberg', 'nuremberg'], 'DE'],
  ['Hannover', ['hannover', 'hanover'], 'DE'],
  ['Karlsruhe', ['karlsruhe'], 'DE'],
  ['Bonn', ['bonn'], 'DE'],
  ['Mannheim', ['mannheim'], 'DE'],
  ['Zürich', ['zürich', 'zuerich', 'zurich'], 'CH'],
  ['Basel', ['basel'], 'CH'],
  ['Bern', ['bern'], 'CH'],
  ['Genf', ['genf', 'genève', 'geneva'], 'CH'],
  ['Lausanne', ['lausanne'], 'CH'],
  ['Luzern', ['luzern', 'lucerne'], 'CH'],
  ['Zug', ['zug'], 'CH'],
  ['St. Gallen', ['st. gallen', 'st gallen'], 'CH'],
  ['Winterthur', ['winterthur'], 'CH'],
];

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CITY_PATTERNS = CITIES.map(([name, aliases, country]) => ({
  name,
  country,
  re: new RegExp(`(^|[^\\p{L}])(${aliases.map(escapeRe).join('|')})(?=$|[^\\p{L}])`, 'iu'),
}));

/** First known city mentioned in the text (earliest position wins). */
export function findCity(text: string): { city: string; country: string } | undefined {
  let best: { city: string; country: string; index: number } | undefined;
  for (const { name, country, re } of CITY_PATTERNS) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.index)) best = { city: name, country, index: m.index };
  }
  return best && { city: best.city, country: best.country };
}

export function countryOfCity(city: string | undefined): string | undefined {
  if (!city) return undefined;
  return findCity(city)?.country;
}
