import { defineConfig, loadEnv } from 'vite';

// The same React Native source runs in the browser through react-native-web.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    esbuild: {
      loader: 'jsx',
      jsx: 'automatic',
      include: /^(?!.*node_modules).*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: { loader: { '.js': 'jsx' }, resolveExtensions: ['.web.js', '.js', '.jsx', '.json'] },
    },
    resolve: {
      alias: { 'react-native': 'react-native-web' },
      extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.json'],
    },
    define: {
      __DEV__: JSON.stringify(mode !== 'production'),
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
      global: 'globalThis',
    },
    server: { host: true, port: 5173 },
  };
});
