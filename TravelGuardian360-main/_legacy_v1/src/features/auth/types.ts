/**
 * Auth domain types — shared by the store, services, forms and screens.
 */

export type EmergencyContact = {
  name: string;
  phone: string;
};

/** The authenticated user / Digital Tourist ID holder. */
export type User = {
  id: string;
  /** Human-facing Digital Tourist ID, e.g. "TG-8F3K2A". */
  touristId: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  emergencyContact: EmergencyContact;
  createdAt: string;
};

/** Payload sent to the register endpoint (mirrors the register form). */
export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

/** Payload sent to the login endpoint. */
export type LoginPayload = {
  email: string;
  password: string;
};

/** Standard auth response shape (matches the planned FastAPI/JWT contract). */
export type AuthResponse = {
  token: string;
  user: User;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
