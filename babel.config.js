/**
 * Babel configuration for TravelGuardian360.
 *
 * NativeWind's `nativewind/babel` preset delegates to
 * `react-native-css-interop/babel`, which (in css-interop 0.2.6) hardcodes
 * `react-native-worklets/plugin`. This project uses react-native-reanimated
 * 3.19.5 (which does NOT ship / require react-native-worklets) and authors no
 * animated classNames, so the Worklets plugin is neither available nor needed.
 * We load NativeWind's babel output and strip that plugin to avoid a
 * "Cannot find module 'react-native-worklets/plugin'" transform error.
 * NativeWind's static styling and its react-native-reanimated runtime import
 * are unaffected.
 */
const nativewindBabel = require('nativewind/babel');

module.exports = function (api) {
  api.cache(true);

  const nw = nativewindBabel();

  const plugins = (nw.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return !(typeof name === 'string' && name.includes('react-native-worklets/plugin'));
  });

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins,
  };
};
