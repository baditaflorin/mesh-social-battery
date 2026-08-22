import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-social-battery",
  description: "A browser-local, accessible shared social-energy check-in.",
  accentHex: "#06b6d4",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
