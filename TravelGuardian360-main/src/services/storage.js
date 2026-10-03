import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    if (value == null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private browsing); the session then lasts until reload.
  }
}
