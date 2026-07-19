/**
 * Validation schemas for the auth forms, expressed with the in-house
 * validators. When Yup is available, these become yup.object({...}) schemas
 * and are wired via a resolver — the field names/messages carry over directly.
 */
import type { FormSchema } from '../../../hooks/useForm';
import { compose, email, matchesField, minLength, phone, required } from '../../../utils/validation';

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  password: string;
  confirmPassword: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export const loginInitialValues: LoginFormValues = {
  email: '',
  password: '',
};

export const loginSchema: FormSchema<LoginFormValues> = {
  email: compose(required('Email is required.'), email()),
  password: required('Password is required.'),
};

export const registerInitialValues: RegisterFormValues = {
  fullName: '',
  email: '',
  phone: '',
  nationality: '',
  password: '',
  confirmPassword: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export const registerSchema: FormSchema<RegisterFormValues> = {
  fullName: compose(required('Full name is required.'), minLength(2, 'Name is too short.')),
  email: compose(required('Email is required.'), email()),
  phone: compose(required('Phone number is required.'), phone()),
  nationality: required('Nationality is required.'),
  password: compose(
    required('Password is required.'),
    minLength(8, 'Password must be at least 8 characters.'),
  ),
  confirmPassword: compose(
    required('Please confirm your password.'),
    matchesField('password', 'Passwords do not match.'),
  ),
  emergencyContactName: required('Emergency contact name is required.'),
  emergencyContactPhone: compose(
    required('Emergency contact phone is required.'),
    phone(),
  ),
};
