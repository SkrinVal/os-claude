import { PermissionsAndroid, Platform } from "react-native";

export async function hasCallPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
}

export async function requestCallPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
