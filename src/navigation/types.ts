/**
 * Navigation param lists — the typed contract for every route in the app.
 * New modules add their screens to AppStackParamList.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  /** The bottom-tab shell (Home / Track / SOS / Zones / More). */
  Main: undefined;
  // Detail screens pushed on top of the tabs:
  SafetyScore: undefined;
  Behavior: undefined;
  Contacts: undefined;
  ContactForm: { id?: string };
  Language: undefined;
  Profile: undefined;
  Notifications: undefined;
  TravelDocuments: undefined;
  TripTools: undefined;
};
