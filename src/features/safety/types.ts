/**
 * Safety Score domain types.
 */

export type SafetyBand = 'high' | 'moderate' | 'low';

/** One contribution to the score (positive or negative), for the breakdown UI. */
export type SafetyFactor = {
  key: string;
  label: string;
  /** Points added/subtracted relative to the 100 baseline. */
  impact: number;
  detail: string;
};

export type SafetyScore = {
  /** 0–100. */
  value: number;
  band: SafetyBand;
  factors: SafetyFactor[];
};

/** Inputs the score is computed from (derived from the app's stores). */
export type SafetyInputs = {
  isTracking: boolean;
  insideAlertingZone: boolean;
  nearestAlertingDistanceM: number | null;
  profileComplete: boolean;
  recentSosCount: number;
};
