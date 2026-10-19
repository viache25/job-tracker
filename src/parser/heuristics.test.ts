import {
  detectLanguage,
  findEmploymentType,
  findSalary,
  findStack,
  findWorkMode,
  parseAmount,
  type SalaryGuess,
} from './heuristics';

describe('parseAmount', () => {
  it.each([
    ['3.600', 3600],
    ['3600', 3600],
    ['50.400', 50400],
    ['50,400', 50400],
    ['3.600,50', 3600.5],
    ['3,600.50', 3600.5],
    ['1.234.567', 1234567],
    ["85'000", 85000],
    ['3 600', 3600],
    ['60k', 60000],
    ['60 k', 60000],
    ['25,50', 25.5],
    ['3.600,-', 3600],
  ])('%s → %d', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });
});

const salaryCases: [string, SalaryGuess][] = [
  [
    'Gehalt: € 3.600 brutto pro Monat',
    { salaryMin: 3600, salaryMax: 3600, salaryPeriod: 'month', salaryCurrency: 'EUR' },
  ],
  [
    'Das Mindestgehalt beträgt EUR 3.600 brutto/Monat, Bereitschaft zur Überzahlung.',
    { salaryMin: 3600, salaryPeriod: 'month', salaryCurrency: 'EUR' },
  ],
  [
    'Jahresbruttogehalt ab EUR 50.400 p.a.',
    { salaryMin: 50400, salaryPeriod: 'year', salaryCurrency: 'EUR' },
  ],
  [
    'Salary: €55,000 – €65,000 per year',
    { salaryMin: 55000, salaryMax: 65000, salaryPeriod: 'year', salaryCurrency: 'EUR' },
  ],
  [
    'Vergütung 4.000 - 5.000 EUR monatlich',
    { salaryMin: 4000, salaryMax: 5000, salaryPeriod: 'month', salaryCurrency: 'EUR' },
  ],
  ['ab 3.600 € brutto', { salaryMin: 3600, salaryPeriod: 'month', salaryCurrency: 'EUR' }],
  [
    'Wir bieten bis zu 70.000 € Jahresgehalt',
    { salaryMax: 70000, salaryPeriod: 'year', salaryCurrency: 'EUR' },
  ],
  [
    'CHF 110’000 – 130’000 pro Jahr',
    { salaryMin: 110000, salaryMax: 130000, salaryPeriod: 'year', salaryCurrency: 'CHF' },
  ],
  [
    'Stundenlohn: 18,50 € brutto',
    { salaryMin: 18.5, salaryMax: 18.5, salaryPeriod: 'hour', salaryCurrency: 'EUR' },
  ],
  [
    '€ 2.400 netto im Monat',
    {
      salaryMin: 2400,
      salaryMax: 2400,
      salaryPeriod: 'month',
      salaryCurrency: 'EUR',
      salaryIsNet: true,
    },
  ],
  [
    'Compensation: 60k–75k EUR',
    { salaryMin: 60000, salaryMax: 75000, salaryPeriod: 'year', salaryCurrency: 'EUR' },
  ],
  [
    'KV-Mindestgehalt EUR 2.986,00 brutto (Vollzeit)',
    { salaryMin: 2986, salaryPeriod: 'month', salaryCurrency: 'EUR' },
  ],
  [
    'Gehalt zwischen 45.000 und 55.000 Euro jährlich',
    { salaryMin: 45000, salaryMax: 55000, salaryPeriod: 'year', salaryCurrency: 'EUR' },
  ],
  ['Starting at $90,000 a year', { salaryMin: 90000, salaryPeriod: 'year', salaryCurrency: 'USD' }],
];

describe('findSalary', () => {
  it.each(salaryCases)('%s', (text, expected) => {
    expect(findSalary(text)).toEqual(expected);
  });

  it.each([
    'Wir sind seit 2006 am Markt und haben 250 Mitarbeitende.',
    'Bewerbungsfrist: 30.11.2026',
    'Umsatz von über 3.000.000 € und 40 Standorte',
    'Telefon +43 1 234 5678',
  ])('ignores non-salary numbers: %s', (text) => {
    expect(findSalary(text)).toEqual({});
  });
});

describe('findWorkMode', () => {
  it.each([
    ['100% Remote möglich', 'remote'],
    ['Fully remote within the EU', 'remote'],
    ['Hybrides Arbeiten: 2 Tage Homeoffice pro Woche', 'hybrid'],
    ['Hybrid (Vienna office + remote days)', 'hybrid'],
    ['Flexible Arbeitszeiten und Homeoffice', 'hybrid'],
    ['This is a remote position', 'remote'],
    ['Arbeitsort: vor Ort in Linz', 'onsite'],
    ['On-site role in our Munich office', 'onsite'],
    ['Wir bieten einen modernen Arbeitsplatz', undefined],
  ])('%s → %s', (text, expected) => {
    expect(findWorkMode(text)).toBe(expected);
  });
});

describe('findEmploymentType', () => {
  it.each([
    ['Frontend Developer (Vollzeit)', '', 'full_time'],
    ['Buchhalter:in Teilzeit 20h', '', 'part_time'],
    ['Werkstudent Data (m/w/d)', 'Teilzeit, 20 Stunden', 'internship'],
    ['Praktikum Marketing', '', 'internship'],
    ['Backend Engineer', 'Full-time, permanent', 'full_time'],
    ['Backend Engineer', 'Vollzeit oder Teilzeit möglich', 'full_time'],
    ['UX Designer', 'Freelance project, 6 months', 'contract'],
    ['Data Analyst', 'Part-time 25h/week', 'part_time'],
    ['Engineer', 'Wir freuen uns auf dich', undefined],
  ])('%s / %s → %s', (title, text, expected) => {
    expect(findEmploymentType(title, text)).toBe(expected);
  });
});

describe('findStack', () => {
  it.each([
    ['Erfahrung mit React, TypeScript und Node.js', ['React', 'TypeScript', 'Node.js']],
    ['Kenntnisse in C#, .NET Core und MS SQL', ['C#', '.NET', 'MS SQL Server']],
    ['We use Go, Kubernetes (K8s) and PostgreSQL', ['Go', 'Kubernetes', 'PostgreSQL']],
    ['Java/Spring Boot, Kafka, Docker', ['Java', 'Spring Boot', 'Kafka', 'Docker']],
    ['JavaScript ist nicht Java', ['JavaScript', 'Java']],
    ['Python (Pandas, NumPy), SQL, Power BI', ['Python', 'Pandas', 'NumPy', 'SQL', 'Power BI']],
    ['C++ und Embedded C für AUTOSAR', ['C++', 'Embedded C', 'AUTOSAR']],
    ['React Native & Expo for iOS and Android', ['React Native', 'Expo', 'iOS', 'Android']],
    ['React Native and also plain React', ['React Native', 'React']],
    ['Let us go and react quickly', []],
    ['Vue.js 3, Nuxt and Tailwind', ['Vue.js', 'Nuxt', 'Tailwind CSS']],
    ['AWS, Terraform, GitHub Actions, CI/CD', ['AWS', 'Terraform', 'GitHub Actions', 'CI/CD']],
  ])('%s', (text, expected) => {
    expect(findStack(text)).toEqual(expected);
  });
});

describe('detectLanguage', () => {
  it('detects German and English', () => {
    expect(
      detectLanguage(
        'Wir suchen dich für unser Team in Wien. Du arbeitest mit der Cloud und bist ein Profi.',
      ),
    ).toBe('de');
    expect(
      detectLanguage(
        'We are looking for you to join our team in Vienna. You will work with the cloud and are a pro.',
      ),
    ).toBe('en');
    expect(detectLanguage('React')).toBeUndefined();
  });
});
