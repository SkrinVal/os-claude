import { NativeModule, requireNativeModule } from "expo";
import type { ValityMessagingEvents } from "./ValityMessaging.types";

declare class ValityMessagingModule extends NativeModule<ValityMessagingEvents> {
  configure(
    serverUrl: string,
    token: string,
    whatsappEnabled: boolean,
    smsEnabled: boolean
  ): Promise<void>;
  isNotificationAccessGranted(): Promise<boolean>;
  openNotificationAccessSettings(): void;
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}

export default requireNativeModule<ValityMessagingModule>("ValityMessaging");
