/**
 * Behaviour-analysis domain types.
 */

export type BehaviorSignalType = 'inactivity' | 'sudden_jump' | 'erratic_movement';

export type Severity = 'low' | 'moderate' | 'high';

/** A detected movement anomaly. */
export type BehaviorSignal = {
  type: BehaviorSignalType;
  severity: Severity;
  message: string;
  detectedAt: number;
};

/** Overall behavioural risk derived from the active signals. */
export type BehaviorRisk = 'normal' | 'low' | 'moderate' | 'high';

export type BehaviorAnalysis = {
  risk: BehaviorRisk;
  signals: BehaviorSignal[];
};
