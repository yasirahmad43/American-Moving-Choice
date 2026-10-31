import { fileURLToPath } from "node:url";

export default {
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["components/admin/growth/*.test.mjs", "lib/admin/*.test.mjs"], environment: "node" },
};
