// Global Jest setup: mock native modules that have no JS implementation under
// the test runtime.

// AsyncStorage ships an official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
