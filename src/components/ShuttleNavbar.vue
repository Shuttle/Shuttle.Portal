<template>
  <v-navigation-drawer
    v-model="drawerStore.showNavigationDrawer"
    :permanent="!$vuetify.display.mobile"
    class="pt-2"
  >
    <div class="flex justify-end">
      <v-btn
        :icon="mdiArrowCollapseLeft"
        @click.stop="
          drawerStore.showNavigationDrawer = !drawerStore.showNavigationDrawer
        "
        class="mr-4"
        flat
      ></v-btn>
    </div>
    <template v-for="section in sections" :key="section.name">
      <v-list>
        <v-list-subheader>{{ t(section.name) }}</v-list-subheader>
        <v-list-item
          v-for="(item, i) in section.items"
          :key="i"
          :value="item"
          color="primary"
          :to="item.to"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
  <v-app-bar class="shadow-sm">
    <template v-slot:prepend v-if="sessionStore.isAuthenticated">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="
          drawerStore.showNavigationDrawer = !drawerStore.showNavigationDrawer
        "
      ></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title
      class="cursor-pointer font-bold"
      @click="$router.push('/dashboard')"
      >Shuttle.Portal</v-app-bar-title
    >
    <template v-slot:append>
      <div class="flex items-center">
        <v-switch
          class="mr-2"
          v-model="isDarkTheme"
          :false-icon="mdiWhiteBalanceSunny"
          :true-icon="mdiWeatherNight"
          hide-details
        />
        <v-btn
          v-if="!sessionStore.isAuthenticated"
          :icon="mdiLogin"
          @click.prevent="signIn"
        ></v-btn>
        <v-btn
          v-else
          :icon="mdiDotsVertical"
          variant="text"
          @click.stop="
            drawerStore.showProfileDrawer = !drawerStore.showProfileDrawer
          "
        ></v-btn>
      </div>
    </template>
  </v-app-bar>
  <v-navigation-drawer
    v-model="drawerStore.showProfileDrawer"
    location="right"
    temporary
  >
    <v-list>
      <v-list-item
        :title="sessionStore.identityName ?? t('(unknown)')"
        class="select-none"
      ></v-list-item>
      <v-divider></v-divider>
      <v-list-item
        v-if="sessionStore.tenant"
        :prepend-icon="mdiSwapHorizontal"
        @click.prevent="selectTenant"
        :title="sessionStore.tenant.name ?? t('(unknown)')"
      ></v-list-item>
      <v-divider v-if="sessionStore.tenant"></v-divider>
      <v-list-item
        v-if="eventStoreStore.eventStores.length > 1"
        :prepend-icon="mdiDatabaseOutline"
        @click.prevent="selectEventStore"
        :title="eventStoreStore.selected?.name ?? t('event-store')"
      ></v-list-item>
      <v-divider v-if="eventStoreStore.eventStores.length > 1"></v-divider>
      <v-list-item
        :prepend-icon="mdiShieldAccountOutline"
        to="/password/token"
        :title="t('change-password')"
      ></v-list-item>
      <v-list-item
        :prepend-icon="mdiLogout"
        @click.prevent="signOut"
        :title="t('sign-out')"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import map from "./navigation-map";
import {
  mdiArrowCollapseLeft,
  mdiDatabaseOutline,
  mdiDotsVertical,
  mdiLogin,
  mdiLogout,
  mdiWhiteBalanceSunny,
  mdiWeatherNight,
  mdiShieldAccountOutline,
  mdiSwapHorizontal,
} from "@mdi/js";
import { computed, ref, watch } from "vue";
import { useSessionStore } from "@/stores/session";
import { useEventStoreStore } from "@/stores/eventStore";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTheme } from "vuetify";
import type { NavigationItem } from "@/portal";
import { accessApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import configuration from "@/configuration";

const { t } = useI18n({ useScope: "global" });

const drawerStore = useDrawerStore();
const sessionStore = useSessionStore();
const eventStoreStore = useEventStoreStore();
const router = useRouter();
const theme = useTheme();
const storedTheme =
  localStorage.getItem("app-theme") || theme.global.name.value;
const isDarkTheme: Ref<boolean> = ref(storedTheme === "dark");

const applyTheme = (selectedTheme: string) => {
  if (selectedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  theme.change(selectedTheme);
};

applyTheme(isDarkTheme.value ? "dark" : "light");

watch(isDarkTheme, (newValue) => {
  const selectedTheme = newValue ? "dark" : "light";
  applyTheme(selectedTheme);
  localStorage.setItem("app-theme", selectedTheme);
});

const items = computed(() => {
  if (!sessionStore.tenantId) {
    return [];
  }

  return map
    .filter(
      (item: NavigationItem) =>
        !item.permission || sessionStore.hasPermission(item.permission),
    )
    .map((item: NavigationItem) => ({
      section: item.section ?? "access",
      icon: item.icon,
      title: t(item.title),
      to: item.to || "",
    }));
});

const sections = computed(() => {
  const order = ["access", "recall", "abacus"];

  return order
    .map((name) => ({
      name,
      items: items.value.filter((item) => item.section === name),
    }))
    .filter((section) => section.items.length > 0);
});

const selectTenant = () => {
  router.push({ name: "tenant-selection" });
};

const selectEventStore = () => {
  router.push({ name: "event-store-selection" });
};

const refreshEventStores = async () => {
  if (!configuration.isRecallAvailable()) {
    return;
  }

  try {
    await eventStoreStore.initialize();
  } catch {
    // ignore - the Recall API may not be reachable
  }
};

watch(
  () => sessionStore.isAuthenticated,
  () => {
    refreshEventStores();
  },
);

onMounted(() => {
  refreshEventStores();
});

const signIn = () => {
  router.push({ name: "sign-in" });
};

const signOut = async () => {
  try {
    await accessApi.delete("v1/sessions/self");
  } catch {
    // ignore
  }

  sessionStore.signOut();
  drawerStore.showNavigationDrawer = false;
  drawerStore.showProfileDrawer = false;

  signIn();
};
</script>
