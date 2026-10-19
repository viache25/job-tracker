module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|lucide-react-native|react-native-svg|drizzle-orm)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The first render test in a suite pays for cold transforms; on shared CI runners that
  // alone can pass the 5 s default.
  testTimeout: 15_000,
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__fixtures__/**'],
};
