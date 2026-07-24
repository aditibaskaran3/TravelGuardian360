/**
 * Reusable score chip/gauge. `size="lg"` renders the big circular gauge used on
 * the Safety Score screen; the default compact chip is used on Home.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/useTranslation';
import type { TranslationKey } from '../../../i18n';
import type { SafetyBand } from '../types';

const BAND_LABEL_KEY: Record<SafetyBand, TranslationKey> = {
  high: 'safety.safe',
  moderate: 'safety.caution',
  low: 'safety.atRisk',
};

// Tailwind classes per band (bg + text).
const BAND_STYLE: Record<SafetyBand, { ring: string; text: string; chip: string }> = {
  high: { ring: 'border-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-100' },
  moderate: { ring: 'border-amber-500', text: 'text-amber-600', chip: 'bg-amber-100' },
  low: { ring: 'border-red-500', text: 'text-red-600', chip: 'bg-red-100' },
};

type Props = {
  value: number;
  band: SafetyBand;
  size?: 'sm' | 'lg';
};

export default function ScoreBadge({ value, band, size = 'sm' }: Props) {
  const { t } = useTranslation();
  const style = BAND_STYLE[band];

  if (size === 'lg') {
    return (
      <View className="items-center">
        <View
          className={`h-40 w-40 items-center justify-center rounded-full border-8 bg-white ${style.ring}`}
        >
          <Text className={`text-5xl font-extrabold ${style.text}`}>{value}</Text>
          <Text className="text-xs uppercase tracking-widest text-slate-400">{t('safety.of100')}</Text>
        </View>
        <View className={`mt-3 rounded-full px-4 py-1 ${style.chip}`}>
          <Text className={`text-sm font-semibold ${style.text}`}>{t(BAND_LABEL_KEY[band])}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-row items-center gap-2 rounded-full px-3 py-1 ${style.chip}`}>
      <Text className={`text-base font-bold ${style.text}`}>{value}</Text>
      <Text className={`text-xs font-medium ${style.text}`}>{t(BAND_LABEL_KEY[band])}</Text>
    </View>
  );
}
