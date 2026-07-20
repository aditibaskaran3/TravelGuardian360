/**
 * Emergency contacts domain types.
 */

export type EmergencyContactRecord = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  /** Exactly one contact is primary; SOS alerts the primary first. */
  isPrimary: boolean;
};
