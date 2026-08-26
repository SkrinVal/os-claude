import { NativeModule, registerWebModule } from "expo";
import type { ValityMessagingEvents } from "./ValityMessaging.types";

// Web hat kein Android-Benachrichtigungssystem/SMS - Stub, damit
// `expo start --web` nicht bricht. Alle Aufrufe sind No-Ops.
class ValityMessagingModule extends NativeModule<ValityMessagingEvents> {
  async configure() {}
  async isNotificationAccessGranted() {
    return false;
  }
  openNotificationAccessSettings() {}
  async sendSms() {
    return false;
  }
}

export default registerWebModule(ValityMessagingModule, "ValityMessagingModule");
