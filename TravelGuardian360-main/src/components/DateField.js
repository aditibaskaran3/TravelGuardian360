import React from 'react';

import Input from './Input';
import { t } from '../i18n';

export default function DateField({ label, value, onChange, error }) {
  return (
    <Input
      label={label}
      icon="calendar"
      value={value}
      onChangeText={onChange}
      error={error}
      placeholder={t('YYYY-MM-DD')}
      keyboardType="numbers-and-punctuation"
      maxLength={10}
    />
  );
}
