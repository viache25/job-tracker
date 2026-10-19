import type { Stage, WorkMode } from '@/db/schema';

import type { ApplicationsRepo } from './repo';

const COMPANIES = [
  'Muster Software GmbH',
  'Alpenblick AG',
  'Donau Digital',
  'Nordlicht Logistik',
  'Helvetic AI',
  'Bergwerk Games',
  'Stadtwerke Linz',
  'Cloudhaus',
  'Beispiel AG',
  'Wiener Daten',
  'Innsbruck Mobility',
  'Graz Robotics',
];
const TITLES = [
  'Frontend Developer (m/w/d)',
  'Senior Backend Engineer',
  'Data Analyst',
  'Product Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Mobile Developer (React Native)',
  'Projektmanager:in IT',
  'Werkstudent:in Softwareentwicklung',
  'Machine Learning Engineer',
];
const CITIES: [string, string][] = [
  ['Wien', 'AT'],
  ['Graz', 'AT'],
  ['Linz', 'AT'],
  ['Berlin', 'DE'],
  ['München', 'DE'],
  ['Zürich', 'CH'],
];
const STACKS = [
  ['React', 'TypeScript'],
  ['Java', 'Spring Boot', 'Kafka'],
  ['Python', 'SQL', 'Power BI'],
  ['Figma'],
  ['Kubernetes', 'Terraform', 'AWS'],
  ['Go', 'PostgreSQL'],
];
const MODES: (WorkMode | null)[] = ['onsite', 'hybrid', 'remote', null];

/** Fills the database with plausible fake applications (dev builds only). */
export function createDemoApplications(
  repo: ApplicationsRepo,
  stages: readonly Stage[],
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    const [city, country] = CITIES[i % CITIES.length]!;
    const withSalary = i % 3 !== 0;
    repo.create({
      company: `${COMPANIES[i % COMPANIES.length]}${count > COMPANIES.length ? ` ${Math.floor(i / COMPANIES.length) + 1}` : ''}`,
      title: TITLES[(i * 7) % TITLES.length]!,
      city,
      country,
      workMode: MODES[i % MODES.length]!,
      stack: STACKS[i % STACKS.length]!,
      salaryMin: withSalary ? 3000 + ((i * 137) % 30) * 100 : null,
      salaryCurrency: withSalary ? (country === 'CH' ? 'CHF' : 'EUR') : null,
      salaryPeriod: withSalary ? 'month' : null,
      deadline:
        i % 4 === 0
          ? new Date(Date.now() + (i % 20) * 86_400_000).toISOString().slice(0, 10)
          : null,
      url: `https://example.com/jobs/${i}`,
      source: 'example.com',
      stageId: stages[i % stages.length]!.id,
    });
  }
}
