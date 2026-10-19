import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

/** Public project DSN (EU region). An env value overrides it, e.g. for a staging project. */
const DEFAULT_DSN =
  'https://39778f2b90d09a2812bff362914bca5d@o4512281628901376.ingest.de.sentry.io/4512281649414224';
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || DEFAULT_DSN;

/** Crash reports only in release builds. */
export const crashReportsEnabled = !!dsn && !__DEV__;

if (crashReportsEnabled) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 30,
    // Console output and request URLs may contain vacancy pages or notes: keep them out.
    beforeBreadcrumb: (crumb) =>
      crumb.category === 'console' || crumb.category === 'fetch' || crumb.category === 'xhr'
        ? null
        : crumb,
  });
}

/** Wraps the root component so render errors are reported too. */
export function withCrashReports(component: ComponentType): ComponentType {
  return crashReportsEnabled ? Sentry.wrap(component) : component;
}
