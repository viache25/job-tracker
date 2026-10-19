const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Sentry's wrapper adds debug IDs so crash stack traces map back to source.
const config = getSentryExpoConfig(__dirname);

// Drizzle migrations are bundled as .sql strings.
config.resolver.sourceExts.push('sql');

// Web preview only: expo-sqlite runs on wa-sqlite (wasm) and needs SharedArrayBuffer,
// which requires cross-origin isolation headers from the dev server.
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
