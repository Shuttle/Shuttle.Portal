<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('roles')" />
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
      show-expand
      v-model:expanded="expanded"
      expand-on-click
      show-select
      v-model="selected"
    >
      <template v-slot:header.action="">
        <s-strip v-if="sessionStore.hasPermission(Permissions.Roles.Manage)">
          <s-btn-add @click="add"></s-btn-add>
          <v-btn :icon="mdiUpload" size="x-small" @click="upload"></v-btn>
          <v-btn
            :icon="mdiDownload"
            size="x-small"
            @click="download"
            v-if="selected.length"
          ></v-btn>
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn
            :icon="mdiShield"
            size="x-small"
            @click.stop="permissions(item)"
          />
          <v-btn
            :icon="mdiAccount"
            size="x-small"
            @click.stop="identities(item)"
          />
          <s-btn-edit @click.stop="rename(item)" />
          <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
        </s-strip>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <s-container show-border>
              <v-tabs v-model="item.tab">
                <v-tab value="permissions">
                  {{ $t("permissions") }}
                </v-tab>
                <v-tab value="identities">
                  {{ $t("identities") }}
                </v-tab>
              </v-tabs>
              <v-divider></v-divider>
              <v-tabs-window v-model="item.tab">
                <v-tabs-window-item value="permissions">
                  <s-data-table
                    :items="item.permissions"
                    :headers="permissionHeaders"
                    :mobile="null"
                    mobile-breakpoint="md"
                  >
                  </s-data-table>
                </v-tabs-window-item>
                <v-tabs-window-item value="identities">
                  <s-data-table
                    :items="item.identities"
                    :headers="identityHeaders"
                    hide-default-header
                  >
                  </s-data-table>
                </v-tabs-window-item>
              </v-tabs-window>
            </s-container>
          </td>
        </tr>
      </template>
    </s-data-table>
  </v-card>
  <s-drawer></s-drawer>
</template>

<script setup lang="ts">
import { accessApi } from "@/api";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  mdiDelete,
  mdiDownload,
  mdiMagnify,
  mdiRefresh,
  mdiUpload,
  mdiShield,
  mdiAccount,
} from "@mdi/js";
import { useRouter } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { Permission, Role } from "@/portal";
import { useSessionStore } from "@/stores/session";
import { usePermissionStatuses } from "@/composables/useData";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const confirmationStore = useConfirmationStore();
const sessionStore = useSessionStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<Role[]> = ref([]);
const search: Ref<string> = ref("");
const expanded: Ref<string[]> = ref([]);
const selected: Ref<string[]> = ref([]);
const permissionStatuses = usePermissionStatuses();

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Roles.Manage,
    filterable: false,
  },
  {
    title: t("role-name"),
    value: "name",
  },
]);

const permissionHeaders = useSecureTableHeaders([
  {
    headerProps: {
      class: "w-96",
    },
    title: t("permission"),
    value: "name",
  },
  {
    headerProps: {
      class: "w-96",
    },
    title: t("description"),
    value: "description",
  },
  {
    title: t("status"),
    key: "status",
    value: (item: Permission) => {
      return (
        permissionStatuses.find((status) => status.value === item.status)
          ?.text || item.status
      );
    },
  },
]);

const identityHeaders = useSecureTableHeaders([
  {
    headerProps: {
      class: "w-96",
    },
    title: t("name"),
    value: "name",
  },
  {
    headerProps: {
      class: "w-96",
    },
    title: t("description"),
    value: "description",
  },
]);

const getSelectedTab = (id: string) => {
  return items.value.find((item) => item.id === id)?.tab || "permissions";
};

const refresh = async () => {
  busy.value = true;

  try {
    const { data } = await accessApi.post<Role[]>("v1/roles/search", {
      shouldIncludePermissions: true,
    });
    data.forEach((item: Role) => {
      item.tab = getSelectedTab(item.id);
    });
    items.value = data;
  } finally {
    busy.value = false;
  }
};

const remove = async (item: Role) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" }))
      .confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await accessApi.delete(`v1/roles/${item.id}`);

    useSnackbarStore().requestSent();

    refresh();
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "role" });
};

const upload = () => {
  router.push({ name: "role-upload" });
};

const identities = (item: Role) => {
  router.push({ name: "role-identities", params: { id: item.id } });
};

const permissions = (item: Role) => {
  router.push({ name: "role-permissions", params: { id: item.id } });
};

const rename = (item: Role) => {
  router.push({ name: "role-rename", params: { id: item.id } });
};

const download = async () => {
  if (selected.value.length === 0) {
    return;
  }

  const response = await accessApi.post("v1/roles/download", selected.value, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "roles.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/roles",
  });
});
</script>
