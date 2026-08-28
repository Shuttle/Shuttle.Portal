<template>
  <div>
    <div class="flex flex-col sm:flex-row items-stretch gap-2 p-2">
      <div v-for="item in items" :key="item.route"
        class="group flex flex-col items-center justify-center border border-solid rounded-lg p-2 w-full"
        :class="canNavigate(item) ? 'cursor-pointer hover:bg-[rgb(var(--v-theme-primary--hover))] active:bg-[rgb(var(--v-theme-primary--active))]' : ''"
        @click="canNavigate(item) && click(item)">
        <v-icon :icon="item.svg"
          class="text-[rgb(var(--v-theme-primary--hover))]"
          :class="canNavigate(item) ? 'group-hover:text-[rgb(var(--v-theme-secondary--hover))]' : ''"></v-icon>
        <div class="text-2xl font-bold" :class="canNavigate(item) ? 'group-hover:text-[rgb(var(--v-theme-primary-text--hover))]' : ''">
          {{ item.title }}
        </div>
        <div class="text-xl font-semibold">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardItem } from "@/portal";
import { accessApi } from "@/api";
import configuration from "@/configuration";
import Permissions from "@/permissions";
import { useSessionStore } from "@/stores/session";
import {
  mdiAccount,
  mdiAccountGroup,
  mdiBadgeAccount,
  mdiDatabaseClockOutline,
  mdiDomain,
  mdiFunctionVariant,
  mdiGrid,
  mdiShield,
  mdiTable,
  mdiTestTube,
} from "@mdi/js";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n({ useScope: "global" });
const router = useRouter();
const sessionStore = useSessionStore();

const items = ref<DashboardItem[]>([]);

const canNavigate = (item: DashboardItem) =>
  sessionStore.hasPermission(item.permission);

const click = (item: DashboardItem) => {
  router.push({ name: item.route });
};

const addItem = (
  title: string,
  value: number,
  route: string,
  svg: string,
  permission: string,
) => {
  items.value.push({
    title: title,
    value: value,
    route: route,
    svg: svg,
    permission: permission,
  });
};

const refresh = async () => {
  if (configuration.isAccessAvailable()) {
    const response = await accessApi.get("v1/statistics/dashboard");

    addItem(
      t("permissions"),
      response.data.permissionCount,
      "permissions",
      mdiShield,
      Permissions.Permissions.View,
    );
    addItem(
      t("identities"),
      response.data.identityCount,
      "identities",
      mdiAccount,
      Permissions.Identities.View,
    );
    addItem(
      t("roles"),
      response.data.roleCount,
      "roles",
      mdiAccountGroup,
      Permissions.Roles.View,
    );
    addItem(
      t("sessions"),
      response.data.sessionCount,
      "sessions",
      mdiBadgeAccount,
      Permissions.Sessions.View,
    );
    addItem(
      t("tenants"),
      response.data.tenantCount,
      "tenants",
      mdiDomain,
      Permissions.Tenants.View,
    );
  }

  if (configuration.isRecallAvailable()) {
    addItem(
      t("events"),
      0,
      "events",
      mdiDatabaseClockOutline,
      Permissions.Events.View,
    );
  }

  if (configuration.isAbacusAvailable()) {
    addItem(t("arguments"), 0, "arguments", mdiTable, Permissions.Arguments.Manage);
    addItem(t("formulas"), 0, "formulas", mdiFunctionVariant, Permissions.Formulas.Manage);
    addItem(t("matrices"), 0, "matrices", mdiGrid, Permissions.Matrices.Manage);
    addItem(t("tests"), 0, "tests", mdiTestTube, Permissions.Tests.Manage);
  }
};

onMounted(() => {
  refresh();
});
</script>
