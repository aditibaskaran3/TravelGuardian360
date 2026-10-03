/**
 * Device-level emergency actions built on React Native's built-in Linking and
 * Share APIs — no third-party packages. These open the phone's native SMS
 * composer / dialer / share sheet (the user confirms the final send/call,
 * which is the correct, permission-safe behavior without a paid SMS gateway).
 */
import { Linking, Platform, Share } from 'react-native';
import type { Coordinates } from '../../tracking/types';

/** Google Maps link for a coordinate (opens in any maps app / browser). */
export const buildLocationLink = (coords: Coordinates): string =>
  `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;

/** Composes the emergency message body. */
export function buildSosMessage(
  fullName: string,
  touristId: string,
  coords: Coordinates | null,
): string {
  const location = coords
    ? `My location: ${buildLocationLink(coords)}`
    : 'My location is currently unavailable.';
  return (
    `SOS! This is an emergency alert from ${fullName} (Tourist ID: ${touristId}).\n` +
    `I need help. ${location}`
  );
}

/** Opens the SMS composer pre-filled with the emergency message. */
export async function openSmsComposer(phone: string, message: string): Promise<void> {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phone}${separator}body=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

/** Opens the dialer for the given number. */
export async function callNumber(phone: string): Promise<void> {
  await Linking.openURL(`tel:${phone}`);
}

/** Opens the native share sheet with the emergency message. */
export async function shareLocation(message: string): Promise<void> {
  await Share.share({ message });
}
