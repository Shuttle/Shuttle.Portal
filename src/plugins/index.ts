/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from "./vuetify";
import pinia from "@/stores";
import router from "@/router";
import { i18n } from "@/i18n";
import "@/styles/base.css";

// Types
import type { App } from "vue";

// Components
import ShuttleButton from "@/components/ShuttleButton.vue";
import ShuttleButtonAdd from "@/components/ShuttleButtonAdd.vue";
import ShuttleButtonAlert from "@/components/ShuttleButtonAlert.vue";
import ShuttleButtonEdit from "@/components/ShuttleButtonEdit.vue";
import ShuttleButtonUrl from "@/components/ShuttleButtonUrl.vue";
import ShuttleContainer from "@/components/ShuttleContainer.vue";
import ShuttleDataTable from "@/components/ShuttleDataTable.vue";
import ShuttleDrawer from "@/components/ShuttleDrawer.vue";
import ShuttleFilterDrawer from "@/components/ShuttleFilterDrawer.vue";
import ShuttleFilterToggle from "@/components/ShuttleFilterToggle.vue";
import ShuttleForm from "@/components/ShuttleForm.vue";
import ShuttleNumberInput from "@/components/ShuttleNumberInput.vue";
import ShuttleStrip from "@/components/ShuttleStrip.vue";
import ShuttleTitle from "@/components/ShuttleTitle.vue";

document.querySelector("html")?.setAttribute("lang", i18n.global.locale.value);

export function registerPlugins(app: App) {
  app.use(vuetify).use(router).use(pinia).use(i18n);

  app.component("s-btn", ShuttleButton);
  app.component("s-btn-add", ShuttleButtonAdd);
  app.component("s-btn-alert", ShuttleButtonAlert);
  app.component("s-btn-edit", ShuttleButtonEdit);
  app.component("s-btn-url", ShuttleButtonUrl);
  app.component("s-container", ShuttleContainer);
  app.component("s-data-table", ShuttleDataTable);
  app.component("s-drawer", ShuttleDrawer);
  app.component("s-filter-drawer", ShuttleFilterDrawer);
  app.component("s-filter-toggle", ShuttleFilterToggle);
  app.component("s-form", ShuttleForm);
  app.component("s-number-input", ShuttleNumberInput);
  app.component("s-strip", ShuttleStrip);
  app.component("s-title", ShuttleTitle);
}
