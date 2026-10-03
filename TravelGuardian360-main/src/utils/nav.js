/** Goes back when there is history; after a page reload or a deep link there is none, so return to the main tabs. */
export function goBack(navigation) {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate('Main');
}
