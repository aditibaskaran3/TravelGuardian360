/**
 * Labeled text input with inline validation error display.
 * Integrates directly with useForm's `field()` output.
 */
import React, { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, ...rest }, ref) => {
    const hasError = !!error;
    return (
      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-slate-700">{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor="#94a3b8"
          className={`h-12 rounded-xl border bg-white px-4 text-base text-slate-900 ${
            hasError ? 'border-red-500' : 'border-slate-300'
          }`}
          {...rest}
        />
        {hasError ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
