module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // NativeWind pulls in `import './global.css'`, which Jest's transformer can't
  // parse. Map any CSS import to an empty stub so component tests can load.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  // Several deps (React Navigation, NativeWind's css-interop) ship untranspiled
  // ESM. Whitelist them so Babel transforms them instead of Jest choking on
  // `export`/`import`.
  transformIgnorePatterns: [
    'node_modules/(?!((?:jest-)?@?react-native(?:-community)?|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-vector-icons)/)',
  ],
};
