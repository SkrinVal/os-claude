import { NativeModule, registerWebModule } from "expo";

// Web/Desktop hat keinen Android-Foreground-Service - Stub, damit
// `expo start --web` nicht bricht. Alle Aufrufe sind No-Ops.
class ValityWakeWordModule extends NativeModule<{}> {
  async configure() {}
  async isRunning() {
    return false;
  }
  async isOverlayPermissionGranted() {
    return false;
  }
  openOverlayPermissionSettings() {}
}

export default registerWebModule(ValityWakeWordModule, "ValityWakeWordModule");
