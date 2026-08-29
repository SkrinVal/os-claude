import { NativeModule, requireNativeModule } from "expo";

declare class ValityWakeWordModule extends NativeModule<{}> {
  /** Schreibt AccessKey + Ein/Aus in SharedPreferences, startet/stoppt den Foreground-Service. */
  configure(accessKey: string, enabled: boolean): Promise<void>;
  isRunning(): Promise<boolean>;
  isOverlayPermissionGranted(): Promise<boolean>;
  openOverlayPermissionSettings(): void;
}

export default requireNativeModule<ValityWakeWordModule>("ValityWakeWord");
