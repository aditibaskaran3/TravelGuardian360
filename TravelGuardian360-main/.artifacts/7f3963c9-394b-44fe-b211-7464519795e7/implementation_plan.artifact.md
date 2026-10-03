# Implementation Plan - Add React Native Web Support

This plan details the steps to integrate React Native Web into the existing `TravelGuardian360` project, allowing it to run in Chrome for UI development while maintaining full Android functionality.

## User Review Required

> [!IMPORTANT]
> - I will be adding several Webpack and Babel-related devDependencies.
> - I will create a custom `webpack.config.js` to handle the build process for web, including NativeWind (Tailwind CSS) support.
> - A new entry point `index.web.js` and a `public/index.html` file will be created.
> - I will refactor `realLocationService.ts` to handle both native and web geolocation APIs.

## Proposed Changes

### [Component] Project Configuration

#### [MODIFY] [package.json](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/package.json)
- Add scripts: `"web": "webpack serve --mode development --config webpack.config.js"`.
- Add devDependencies: `webpack`, `webpack-cli`, `webpack-dev-server`, `babel-loader`, `css-loader`, `style-loader`, `html-webpack-plugin`, `babel-plugin-react-native-web`, `process`.

#### [MODIFY] [babel.config.js](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/babel.config.js)
- Add `react-native-web` to the plugins list to handle aliasing.

#### [NEW] [webpack.config.js](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/webpack.config.js)
- Define the Webpack configuration to alias `react-native` to `react-native-web`, handle TypeScript/JavaScript transpilation, and process CSS for NativeWind.

### [Component] Web Entry Points

#### [NEW] [index.web.js](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/index.web.js)
- Use `AppRegistry.runApplication` to launch the app on the web.

#### [NEW] [public/index.html](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/public/index.html)
- Create a basic HTML template with a root `div`.

### [Component] Services & Platform-Specific Code

#### [MODIFY] [src/features/tracking/services/realLocationService.ts](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/src/features/tracking/services/realLocationService.ts)
- Add logic to use `navigator.geolocation` when `Platform.OS === 'web'`.

#### [MODIFY] [src/features/sos/services/emergencyActions.ts](file:///C:/Users/Aditi Baskaran/Downloads/TravelGuardian360/src/features/sos/services/emergencyActions.ts)
- Ensure basic compatibility for web (e.g., fallback for `Share` if not supported).

## Verification Plan

### Automated Tests
- Run `npm run android` to ensure the Android build is still working.
- Run `npm run web` and check for errors.

### Manual Verification
- Open `http://localhost:8080` (or the port specified) in Chrome and verify the UI renders correctly.
- Test the GPS feature on web (browser prompt for location).
- Verify Android emulator still launches and functions as expected.
