/**
 * Standard screen wrapper: safe-area aware, keyboard-avoiding, and scrollable.
 * Used by every screen so layout/padding stay consistent app-wide.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = ViewProps & {
  /** When true (default), content scrolls and avoids the keyboard. */
  scroll?: boolean;
  /** Extra classes applied to the content wrapper. */
  contentClassName?: string;
};

export default function ScreenContainer({
  children,
  scroll = true,
  contentClassName = '',
  ...rest
}: ScreenContainerProps) {
  const content = (
    <View className={`flex-1 px-6 py-6 ${contentClassName}`} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
