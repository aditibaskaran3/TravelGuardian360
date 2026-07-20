/**
 * Pure Tourist Safety Score model.
 *
 * Starts from a 100 baseline and applies transparent adjustments. Kept pure so
 * it is trivially testable and reused anywhere (screen, home badge, backend).
 */
import type { SafetyBand, SafetyFactor, SafetyInputs, SafetyScore } from '../types';

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const bandFor = (value: number): SafetyBand => {
  if (value >= 80) {
    return 'high';
  }
  if (value >= 50) {
    return 'moderate';
  }
  return 'low';
};

export function computeSafetyScore(input: SafetyInputs): SafetyScore {
  const factors: SafetyFactor[] = [];

  // Location sharing on = easier to locate in an emergency.
  if (input.isTracking) {
    factors.push({
      key: 'tracking',
      label: 'Live tracking on',
      impact: 0,
      detail: 'Your location can be shared in an emergency.',
    });
  } else {
    factors.push({
      key: 'tracking',
      label: 'Live tracking off',
      impact: -15,
      detail: 'Turn on tracking so help can find you faster.',
    });
  }

  // Proximity to restricted/hazardous zones.
  if (input.insideAlertingZone) {
    factors.push({
      key: 'zone',
      label: 'Inside a restricted/hazardous zone',
      impact: -50,
      detail: 'Leave the area to raise your safety score.',
    });
  } else if (input.nearestAlertingDistanceM != null && input.nearestAlertingDistanceM < 100) {
    factors.push({
      key: 'zone',
      label: 'Very close to a hazardous zone',
      impact: -25,
      detail: 'You are within 100 m of a flagged zone.',
    });
  } else if (input.nearestAlertingDistanceM != null && input.nearestAlertingDistanceM < 500) {
    factors.push({
      key: 'zone',
      label: 'Near a hazardous zone',
      impact: -10,
      detail: 'You are within 500 m of a flagged zone.',
    });
  }

  // Profile / emergency contact completeness.
  if (!input.profileComplete) {
    factors.push({
      key: 'profile',
      label: 'Incomplete emergency contact',
      impact: -15,
      detail: 'Add an emergency contact to your profile.',
    });
  }

  // Recent SOS activity indicates elevated risk.
  if (input.recentSosCount > 0) {
    const impact = -Math.min(30, input.recentSosCount * 10);
    factors.push({
      key: 'sos',
      label: `Recent SOS activity (${input.recentSosCount})`,
      impact,
      detail: 'Recent emergencies lower your score for 24 hours.',
    });
  }

  const value = clamp(
    100 + factors.reduce((sum, f) => sum + f.impact, 0),
    0,
    100,
  );

  return { value, band: bandFor(value), factors };
}
