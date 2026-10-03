const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  resolver: {
    // The archived first iteration is not part of the app bundle.
    blockList: [/_legacy_v1\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
