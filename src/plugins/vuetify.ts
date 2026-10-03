/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { i18n } from "@/i18n";

// Components
import { VDateInput } from "vuetify/components/VDateInput";
import { VFileUpload } from "vuetify/components/VFileUpload";

// Composables
import { createVuetify, type ThemeDefinition } from "vuetify";
import { VBtn } from "vuetify/components/VBtn";
import { useI18n } from "vue-i18n";

const colors = {
  primary: "#F97316",
  "primary--hover": "#fa7d24",
  "primary--active": "#eb7826",
  "primary-text--hover": "#f9f9f9",
  "primary-text--active": "#d1d1d1",
  error: "#bb4445",
  info: "#2196F3",
  success: "#4caf50",
  warning: "#fb8c00",
};

// The secondary colour is a slate blue that contrasts with the orange primary; it is lighter on the dark
// background and darker on the light background so that it remains legible in both themes.
const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    ...colors,
    secondary: "#7FA8D6",
    "secondary--hover": "#93B6DD",
    "secondary-darken-1": "#6690BF",
  },
};

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    ...colors,
    secondary: "#3B6EA8",
    "secondary--hover": "#4A7EB8",
    "secondary-darken-1": "#2F5A8C",
  },
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VDateInput,
    VFileUpload,
  },
  aliases: {
    VBtnPrimary: VBtn,
  },
  defaults: {
    VBtn: {
      variant: "elevated",
    },
    VBtnPrimary: {
      variant: "tonal",
      color: "primary",
    },
    VTimePicker: {
      format: "24hr",
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: darkTheme,
      light: lightTheme,
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});
