package com.travelguardian360

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Pass `null` to super.onCreate so Android does NOT try to restore
   * react-native-screens fragment state after process death / configuration
   * change. Restoring that state crashes with
   * `Fragment$InstantiationException: ...ScreenStackFragment` because the
   * fragments cannot be re-instantiated before the React context is ready.
   * This is the fix recommended by the react-native-screens docs.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TravelGuardian360"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
