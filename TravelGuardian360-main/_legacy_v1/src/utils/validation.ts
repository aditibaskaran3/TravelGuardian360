/**
 * Small, composable validators.
 *
 * Each rule returns an error string when INVALID, or undefined when valid.
 * These compose into per-form validators (see features/auth/schemas). This is
 * the in-house replacement for Yup while it is blocked by the network proxy.
 */
export type Validator<V = string> = (value: V, allValues?: Record<string, unknown>) => string | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts +, spaces, dashes and 7–15 digits (loose international format).
const PHONE_RE = /^\+?[0-9\s-]{7,15}$/;

export const required =
  (message = 'This field is required.'): Validator =>
  (value) =>
    value != null && String(value).trim().length > 0 ? undefined : message;

export const email =
  (message = 'Enter a valid email address.'): Validator =>
  (value) =>
    !value || EMAIL_RE.test(String(value).trim()) ? undefined : message;

export const phone =
  (message = 'Enter a valid phone number.'): Validator =>
  (value) =>
    !value || PHONE_RE.test(String(value).trim()) ? undefined : message;

export const minLength =
  (length: number, message?: string): Validator =>
  (value) =>
    !value || String(value).length >= length
      ? undefined
      : message ?? `Must be at least ${length} characters.`;

export const matchesField =
  (field: string, message = 'Values do not match.'): Validator =>
  (value, allValues) =>
    allValues && value === allValues[field] ? undefined : message;

/** Runs rules in order and returns the first error found. */
export const compose =
  (...rules: Validator[]): Validator =>
  (value, allValues) => {
    for (const rule of rules) {
      const error = rule(value, allValues);
      if (error) {
        return error;
      }
    }
    return undefined;
  };
