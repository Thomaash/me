import { resolve } from "node:path";
import { fileURLToPath } from "url";

export default {
  resolve: {
    alias: {
      "@": resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
    },
    extensions: [".js", ".json", ".ts", ".vue", ".wasm"],
  },
};
