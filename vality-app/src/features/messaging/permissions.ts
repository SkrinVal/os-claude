import { PermissionsAndroid, Platform } from "react-native";

export type SmsPermissionResult = "granted" | "denied" | "unsupported";

export async function requestSmsPermissions(): Promise<SmsPermissionResult> {
  if (Platform.OS !== "android") return "unsupported";
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
  ]);
  const allGranted = Object.values(results).every(
    (r) => r === PermissionsAndroid.RESULTS.GRANTED
  );
  return allGranted ? "granted" : "denied";
}

export async function hasSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  const checks = await Promise.all([
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS),
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS),
  ]);
  return checks.every(Boolean);
}
