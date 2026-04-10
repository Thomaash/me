import { createPinia } from "pinia";
import { persistPlugin } from "./persist";
import { syncPlugin } from "./sync";

export const pinia = createPinia();
pinia.use(persistPlugin);
pinia.use(syncPlugin);
