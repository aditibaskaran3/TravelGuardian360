/**
 * Behaviour store — holds the latest analysis result. `analyze()` runs the
 * engine over a location history and returns any newly-appeared high-severity
 * signals so the monitor can alert exactly once per new anomaly.
 */
import { create } from './createStore';
import { analyzeBehavior } from '../features/behavior/logic/analyzeBehavior';
import type { LocationSample } from '../features/tracking/types';
import type { BehaviorRisk, BehaviorSignal } from '../features/behavior/types';

type BehaviorState = {
  risk: BehaviorRisk;
  signals: BehaviorSignal[];
  analyzedAt: number | null;
  /** Signal types already alerted, so we don't repeat the same alert. */
  alertedTypes: string[];

  analyze: (samples: LocationSample[], now: number) => BehaviorSignal[];
  reset: () => void;
};

export const useBehaviorStore = create<BehaviorState>((set, get) => ({
  risk: 'normal',
  signals: [],
  analyzedAt: null,
  alertedTypes: [],

  analyze(samples, now) {
    const { risk, signals } = analyzeBehavior(samples, now);

    const { alertedTypes } = get();
    const newHigh = signals.filter(
      (s) => s.severity === 'high' && !alertedTypes.includes(s.type),
    );

    set({
      risk,
      signals,
      analyzedAt: now,
      alertedTypes: newHigh.length
        ? [...alertedTypes, ...newHigh.map((s) => s.type)]
        : alertedTypes,
    });

    return newHigh;
  },

  reset() {
    set({ risk: 'normal', signals: [], analyzedAt: null, alertedTypes: [] });
  },
}));
