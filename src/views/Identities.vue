<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('identities')" />
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
      item-value="name"
      expand-on-click
    >
      <template v-slot:header.action="">
        <s-btn-add
          :permission="Permissions.Identities.Manage"
          @click="add"
        ></s-btn-add>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip
          v-if="sessionStore.hasPermission(Permissions.Identities.Manage)"
        >
          <v-btn
            v-if="shouldShowRoles(item)"
            :icon="mdiAccountGroupOutline"
            size="x-small"
            @click.stop="roles(item)"
          />
          <v-btn
            v-if="sessionStore.systemTenantActive"
            :icon="mdiDomain"
            size="x-small"
            @click.stop="tenants(item)"
          />
          <v-btn :icon="mdiKey" size="x-small" @click.stop="password(item)" />
          <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
        </s-strip>
      </template>
      <template v-slot:item.name="{ item }">
        <div class="flex items-center">
          <div class="grow">{{ item.name }}</div>
          <s-btn-edit @click.stop="rename(item)" class="flex-none" />
        </div>
      </template>
      <template v-slot:item.description="{ item }">
        <div class="flex items-center">
          <div class="grow">{{ item.description }}</div>
          <s-btn-edit @click.stop="description(item)" class="flex-none" />
        </div>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <s-container show-border>
              <v-tabs v-model="item.tab">
                <v-tab value="roles">
                  {{ $t("roles") }}
                </v-tab>
                <v-tab
                  value="tenants"
                  v-if="sessionStore.hasPermission(Permissions.Tenants.Manage)"
                >
                  {{ $t("tenants") }}
                </v-tab>
              </v-tabs>
              <v-divider></v-divider>
              <v-tabs-window v-model="item.tab">
                <v-tabs-window-item value="roles">
                  <s-data-table :items="item.roles" :headers="roleHeaders">
                  </s-data-table>
                </v-tabs-window-item>
                <v-tabs-window-item value="tenants">
                  <s-data-table
                    :items="item.tenants"
                    :headers="tenantHeaders"
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
  mdiMagnify,
  mdiDelete,
  mdiRefresh,
  mdiAccountGroupOutline,
  mdiKey,
  mdiDomain,
} from "@mdi/js";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import { useRouter } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import Permissions from "@/permissions";
import type { Identity } from "@/portal";
import { useSessionStore } from "@/stores/session";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const confirmationStore = useConfirmationStore();
const sessionStore = useSessionStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy = ref(false);
const search = ref("");
const expanded: Ref<string[]> = ref([]);

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Identities.Manage,
  },
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
  {
    title: t("generated-password"),
    value: "generatedPassword",
  },
  {
    title: t("date-registered"),
    key: "item.dateRegistered",
    value: (item: any) => {
      return useDateFormatter(item.dateRegistered).dateTimeMilliseconds();
    },
  },
  {
    title: t("registered-by"),
    value: "registeredBy",
  },
  {
    title: t("date-activated"),
    key: "item.dateActivated",
    value: (item: any) => {
      return useDateFormatter(item.dateActivated).dateTimeMilliseconds();
    },
  },
]);

const roleHeaders = useSecureTableHeaders([
  {
    title: t("role"),
    value: "name",
  },
  {
    title: t("tenant"),
    value: "tenantName",
  },
]);

const tenantHeaders = useSecureTableHeaders([
  {
    title: t("tenant"),
    value: "name",
  },
]);

const items: Ref<Identity[]> = ref([]);

const shouldShowRoles = (identity: Identity) => {
  return identity.tenants?.some((item) => {
    return item.id === sessionStore.tenantId;
  });
};

const getSelectedTab = (id: string) => {
  return items.value.find((item) => item.id === id)?.tab || "roles";
};

const refresh = async () => {
  busy.value = true;

  try {
    const { data } = await accessApi.post<Identity[]>("v1/identities/search", {
      shouldIncludeRoles: true,
      shouldIncludeTenants: true,
    });

    if (!data) {
      return;
    }

    data.forEach((item) => {
      item.tab = getSelectedTab(item.id ?? "");
    });

    items.value = data;
  } finally {
    busy.value = false;
  }
};

const remove = async (item: Identity) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" }))
      .confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await accessApi.delete(`v1/identities/${item.id}`);

    useSnackbarStore().requestSent();

    refresh();
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "identity" });
};

const roles = (item: Identity) => {
  router.push({ name: "identity-roles", params: { id: item.id } });
};

const tenants = (item: Identity) => {
  router.push({ name: "identity-tenants", params: { id: item.id } });
};

const password = (item: Identity) => {
  router.push({ name: "identity-password", params: { id: item.id } });
};

const rename = (item: Identity) => {
  router.push({ name: "identity-rename", params: { id: item.id } });
};

const description = (item: Identity) => {
  router.push({ name: "identity-description", params: { id: item.id } });
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/identities",
  });
});
</script>
