import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Crash reports only in release builds that have a DSN configured. */
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
