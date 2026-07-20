/**
 * Validation for the emergency-contact form (in-house validators).
 */
import type { FormSchema } from '../../../hooks/useForm';
import { compose, minLength, phone, required } from '../../../utils/validation';

export type ContactFormValues = {
  name: string;
  phone: string;
  relationship: string;
};

export const contactInitialValues: ContactFormValues = {
  name: '',
  phone: '',
  relationship: '',
};

export const contactSchema: FormSchema<ContactFormValues> = {
  name: compose(required('Name is required.'), minLength(2, 'Name is too short.')),
  phone: compose(required('Phone number is required.'), phone()),
  relationship: required('Relationship is required (e.g. Parent, Friend).'),
};
