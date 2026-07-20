/**
 * On-device behaviour analysis engine (pure, deterministic).
 *
 * Scans recent location history for movement anomalies that may indicate a
 * tourist in distress. Rule/statistics-based so it runs offline with zero
 * dependencies and is fully explainable — every signal states exactly why it
 * fired. Feeds a risk level used by alerts and the safety picture.
 */
import { haversineMeters } from '../../../utils/geo';
import type { LocationSample } from '../../tracking/types';
import type { BehaviorAnalysis, BehaviorRisk, BehaviorSignal, Severity } from '../types';

// --- Tunable thresholds ---------------------------------------------------
const INACTIVITY_WINDOW_MS = 5 * 60 * 1000; // look back 5 min
const INACTIVITY_RADIUS_M = 15; // "not moving" if all samples within this
const INACTIVITY_MODERATE_MS = 5 * 60 * 1000;
const INACTIVITY_HIGH_MS = 15 * 60 * 1000;

const JUMP_SPEED_MS = 55; // ~200 km/h between fixes = implausible on foot
const ERRATIC_WINDOW = 8; // samples
const ERRATIC_TURN_STD_DEG = 70; // high heading variance ⇒ erratic

const bearing = (a: LocationSample, b: LocationSample): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(b.longitude - a.longitude)) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(toRad(b.longitude - a.longitude));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const stdDev = (values: number[]): number => {
  if (values.length < 2) {
    return 0;
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const RISK_RANK: Record<Severity, number> = { low: 1, moderate: 2, high: 3 };

function detectInactivity(samples: LocationSample[], now: number): BehaviorSignal | null {
  const recent = samples.filter((s) => now - s.timestamp <= INACTIVITY_WINDOW_MS);
  if (recent.length < 3) {
    return null;
  }
  const first = recent[0];
  const maxDrift = Math.max(...recent.map((s) => haversineMeters(first, s)));
  if (maxDrift > INACTIVITY_RADIUS_M) {
    return null;
  }
  const span = recent[recent.length - 1].timestamp - first.timestamp;
  if (span < INACTIVITY_MODERATE_MS) {
    return null;
  }
  const severity: Severity = span >= INACTIVITY_HIGH_MS ? 'high' : 'moderate';
  const minutes = Math.round(span / 60000);
  return {
    type: 'inactivity',
    severity,
    message: `No movement detected for ~${minutes} min. Possible distress or lost signal.`,
    detectedAt: now,
  };
}

function detectSuddenJump(samples: LocationSample[], now: number): BehaviorSignal | null {
  for (let i = samples.length - 1; i > 0; i -= 1) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = (b.timestamp - a.timestamp) / 1000;
    if (dt <= 0) {
      continue;
    }
    const speed = haversineMeters(a, b) / dt;
    if (speed > JUMP_SPEED_MS) {
      return {
        type: 'sudden_jump',
        severity: 'high',
        message: `Sudden large location change (~${Math.round(speed * 3.6)} km/h). Possible transport or GPS anomaly.`,
        detectedAt: now,
      };
    }
  }
  return null;
}

function detectErratic(samples: LocationSample[], now: number): BehaviorSignal | null {
  if (samples.length < ERRATIC_WINDOW) {
    return null;
  }
  const window = samples.slice(-ERRATIC_WINDOW);
  const bearings: number[] = [];
  for (let i = 1; i < window.length; i += 1) {
    if (haversineMeters(window[i - 1], window[i]) < 2) {
      continue; // ignore jitter while stationary
    }
    bearings.push(bearing(window[i - 1], window[i]));
  }
  if (bearings.length < 4) {
    return null;
  }
  if (stdDev(bearings) < ERRATIC_TURN_STD_DEG) {
    return null;
  }
  return {
    type: 'erratic_movement',
    severity: 'moderate',
    message: 'Erratic movement pattern detected (frequent direction changes).',
    detectedAt: now,
  };
}

const riskFromSignals = (signals: BehaviorSignal[]): BehaviorRisk => {
  if (signals.length === 0) {
    return 'normal';
  }
  const top = Math.max(...signals.map((s) => RISK_RANK[s.severity]));
  return top === 3 ? 'high' : top === 2 ? 'moderate' : 'low';
};

/** Analyzes the (chronological) location history and returns risk + signals. */
export function analyzeBehavior(
  samples: LocationSample[],
  now: number = samples.length ? samples[samples.length - 1].timestamp : 0,
): BehaviorAnalysis {
  if (samples.length < 3) {
    return { risk: 'normal', signals: [] };
  }
  const signals = [
    detectInactivity(samples, now),
    detectSuddenJump(samples, now),
    detectErratic(samples, now),
  ].filter((s): s is BehaviorSignal => s !== null);

  return { risk: riskFromSignals(signals), signals };
}
