<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('tenants')" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="x-small" @click="refresh"></v-btn>
        <v-text-field
          v-model="search"
          density="compact"
          :label="$t('search')"
          :prepend-inner-icon="mdiMagnify"
          variant="solo-filled"
          flat
          hide-details
          single-line
        ></v-text-field>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <s-data-table
      :items="items"
      :headers="headers"
      :mobile="null"
      mobile-breakpoint="md"
      v-model:search="search"
      :loading="busy"
    >
      <template v-slot:header.action="">
        <s-strip v-if="sessionStore.hasPermission(Permissions.Tenants.Manage)">
          <s-btn-add @click="add"></s-btn-add>
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
      </template>
      <template v-slot:item.status="{ item }">
        <v-switch
          :model-value="item.status === 1"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="setStatus(item)"
        ></v-switch>
      </template>
    </s-data-table>
  </v-card>
  <s-drawer></s-drawer>
</template>

<script setup lang="ts">
import { accessApi } from "@/api";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { mdiDelete, mdiMagnify, mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { Tenant } from "@/portal";
import { useAlertStore } from "@/stores/alert";
import { useConfirmationStore } from "@/stores/confirmation";
import { useDrawerStore } from "@/stores/drawer";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const confirmationStore = useConfirmationStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<Tenant[]> = ref([]);
const search: Ref<string> = ref("");

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    filterable: false,
  },
  {
    title: t("id"),
    value: "id",
  },
  {
    title: t("name"),
    value: "name",
  },
  {
    permission: Permissions.Tenants.Manage,
    title: t("status"),
    key: "status",
  },
]);

const refresh = async () => {
  busy.value = true;

  try {
    const response = await accessApi.post("v1/tenants/search", {});
    items.value = response.data;
  } finally {
    busy.value = false;
  }
};

const setStatus = async (item: Tenant) => {
  try {
    item.status = item.status === 1 ? 0 : 1;
    await accessApi.patch(`v1/tenants/${item.id}/status`, {
      status: item.status,
    });
  } catch (error: any) {
    useAlertStore().add({
      message: error.toString(),
      type: "error",
      name: "tenant-status",
    });
    item.status = item.status === 1 ? 0 : 1;
  }
};

const add = () => {
  router.push({ name: "tenant" });
};

const remove = async (item: Tenant) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" }))
      .confirmed
  ) {
    return;
  }

  busy.value = true;

  accessApi
    .delete(`v1/tenants/${item.id}`)
    .then(function () {
      refresh();
    })
    .finally(() => {
      busy.value = false;
    });
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/tenants",
  });
});
</script>
