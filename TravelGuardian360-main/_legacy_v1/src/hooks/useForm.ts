/**
 * Generic form hook — values, errors, touched state, and submit handling.
 *
 * In-house replacement for react-hook-form. Deliberately mirrors a subset of
 * its ergonomics (register-style field props, handleSubmit, formState) so
 * migrating later is mechanical.
 */
import { useCallback, useState } from 'react';
import type { Validator } from '../utils/validation';

export type FormSchema<T> = { [K in keyof T]: Validator<T[K]> };

export type FieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
};

export type UseFormReturn<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  setValue: (name: keyof T, value: T[keyof T]) => void;
  /** Returns props to spread onto a TextField for the given field. */
  field: (name: keyof T) => FieldProps & { error?: string };
  handleSubmit: (onValid: (values: T) => Promise<void> | void) => () => Promise<void>;
  reset: () => void;
};

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  schema: FormSchema<T>,
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, allValues: T): string | undefined => schema[name](allValues[name], allValues),
    [schema],
  );

  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        // Re-validate a field only after it has been touched, to avoid nagging.
        setErrors((prevErrors) =>
          touched[name] ? { ...prevErrors, [name]: validateField(name, next) } : prevErrors,
        );
        return next;
      });
    },
    [touched, validateField],
  );

  const onBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, values) }));
    },
    [validateField, values],
  );

  const field = useCallback(
    (name: keyof T) => ({
      value: values[name],
      onChangeText: (text: string) => setValue(name, text as T[keyof T]),
      onBlur: () => onBlur(name),
      error: touched[name] ? errors[name] : undefined,
    }),
    [values, errors, touched, setValue, onBlur],
  );

  const validateAll = useCallback((): Partial<Record<keyof T, string>> => {
    const nextErrors: Partial<Record<keyof T, string>> = {};
    (Object.keys(schema) as (keyof T)[]).forEach((name) => {
      const err = validateField(name, values);
      if (err) {
        nextErrors[name] = err;
      }
    });
    return nextErrors;
  }, [schema, validateField, values]);

  const handleSubmit = useCallback(
    (onValid: (values: T) => Promise<void> | void) => async () => {
      const nextErrors = validateAll();
      setErrors(nextErrors);
      setTouched(
        (Object.keys(schema) as (keyof T)[]).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>,
        ),
      );
      if (Object.keys(nextErrors).length > 0) {
        return;
      }
      try {
        setIsSubmitting(true);
        await onValid(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schema, validateAll, values],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, isSubmitting, setValue, field, handleSubmit, reset };
}
