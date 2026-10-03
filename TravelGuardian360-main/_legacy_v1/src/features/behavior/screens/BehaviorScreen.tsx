/**
 * Behaviour Analysis screen — shows the current movement-risk level and the
 * list of detected signals with explanations.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useBehaviorStore } from '../../../store/behaviorStore';
import { useLocationStore } from '../../../store/locationStore';
import { useTranslation } from '../../../i18n/useTranslation';
import type { TranslationKey } from '../../../i18n';
import type { BehaviorRisk } from '../types';

const RISK_STYLE: Record<BehaviorRisk, { chip: string; text: string; labelKey: TranslationKey }> = {
  normal: { chip: 'bg-emerald-100', text: 'text-emerald-700', labelKey: 'behavior.normal' },
  low: { chip: 'bg-lime-100', text: 'text-lime-700', labelKey: 'behavior.lowConcern' },
  moderate: { chip: 'bg-amber-100', text: 'text-amber-700', labelKey: 'behavior.moderate' },
  high: { chip: 'bg-red-100', text: 'text-red-700', labelKey: 'behavior.high' },
};

export default function BehaviorScreen() {
  const { t } = useTranslation();
  const risk = useBehaviorStore((s) => s.risk);
  const signals = useBehaviorStore((s) => s.signals);
  const analyzedAt = useBehaviorStore((s) => s.analyzedAt);
  const historyLen = useLocationStore((s) => s.history.length);

  const style = RISK_STYLE[risk];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 gap-4">
      <View className="items-center rounded-2xl bg-white p-6">
        <Text className="text-xs uppercase tracking-widest text-slate-400">{t('behavior.movementRisk')}</Text>
        <View className={`mt-3 rounded-full px-5 py-2 ${style.chip}`}>
          <Text className={`text-xl font-bold ${style.text}`}>{t(style.labelKey)}</Text>
        </View>
        <Text className="mt-4 text-center text-slate-500">{t('behavior.description')}</Text>
      </View>

      {signals.length > 0 ? (
        <View className="rounded-2xl bg-white p-5">
          <Text className="mb-2 text-base font-bold text-slate-900">{t('behavior.detectedSignals')}</Text>
          {signals.map((s) => (
            <View key={s.type} className="border-b border-slate-100 py-3">
              <Text className="font-semibold capitalize text-slate-800">
                {t('behavior.signalLabel', { type: s.type.replace('_', ' '), severity: s.severity })}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500">{s.message}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="rounded-2xl bg-emerald-50 p-5">
          <Text className="text-sm text-emerald-800">
            {historyLen < 3
              ? t('behavior.startTracking')
              : t('behavior.noAnomalies')}
          </Text>
        </View>
      )}

      {analyzedAt ? (
        <Text className="text-center text-xs text-slate-400">
          {t('behavior.lastAnalyzed', { time: new Date(analyzedAt).toLocaleTimeString(), count: historyLen })}
        </Text>
      ) : null}
    </ScrollView>
  );
}
