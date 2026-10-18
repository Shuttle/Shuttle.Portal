<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('roles')} - ${name}`" close-drawer type="borderless"></s-title>
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
        <s-text-field v-model="search" density="compact" :label="$t('search')" :prepend-inner-icon="mdiMagnify"
          variant="solo-filled" flat hide-details single-line></s-text-field>
        <div v-if="sessionStore.systemTenantActive" class="w-64">
          <v-select v-model="tenantFilter" :items="tenantOptions" :label="$t('tenant')" density="compact"
            variant="solo-filled" flat hide-details clearable></v-select>
        </div>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <s-data-table :items="items" :headers="headers" :mobile="null" mobile-breakpoint="md" v-model:search="search"
      :loading="busy">
      <template v-slot:item.active="{ item }">
        <v-icon v-if="item.working" :icon="mdiTimerSand"></v-icon>
        <v-checkbox-btn v-else v-model="item.active" @update:model-value="toggle(item)" />
      </template>
    </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { accessApi } from "@/api";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiTimerSand, mdiMagnify, mdiRefresh } from "@mdi/js";
import type { IdentifierAvailability } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";
import { useSessionStore } from "@/stores/session";

const { t } = useI18n({ useScope: "global" });
const snackbarStore = useSnackbarStore();
const sessionStore = useSessionStore();

const id: Ref<string | string[]> = ref(useRoute().params.id);
const name: Ref<string> = ref("");
const identityRoles: Ref = ref([]);
const identityTenants: Ref = ref([]);
const roles: Ref = ref([]);
const busy: Ref<boolean> = ref(false);
const search = ref("");
const tenantFilter: Ref<string | null> = ref(null);
let timeoutId: ReturnType<typeof setTimeout> | undefined;

const tenantOptions = computed(() =>
  identityTenants.value.map((item: any) => ({
    title: item.name,
    value: item.id,
  })),
);

// While operating in the system tenant, roles across any of the identity's tenants can be applied, so a Tenant
// column is shown to tell those roles apart; otherwise the list stays scoped to the current tenant as before.
const headers = computed(() => [
  {
    value: "active",
    align: "center",
    headerProps: {
      class: "w-1",
    },
  },
  {
    title: t("role-name"),
    value: "roleName",
  },
  ...(sessionStore.systemTenantActive
    ? [
      {
        title: t("tenant"),
        value: "tenantName",
      },
    ]
    : []),
]);

export type RoleItem = {
  roleId: string;
  roleName: string;
  tenantId?: string;
  tenantName?: string;
  active: boolean;
  activeOnToggle?: boolean;
  working: boolean;
};

const items = computed(() => {
  const result: RoleItem[] = [];

  identityRoles.value
    .filter(
      (item: any) =>
        sessionStore.systemTenantActive ||
        item.tenantId === sessionStore.tenantId,
    )
    .forEach((item: any) => {
      result.push(
        reactive({
          roleId: item.id,
          roleName: item.name,
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          active: true,
          working: false,
        }),
      );
    });

  roles.value
    .filter((item: any) => {
      return !result.some((r) => r.roleId == item.id);
    })
    .forEach((item: any) => {
      result.push(
        reactive({
          roleId: item.id,
          roleName: item.name,
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          active: false,
          working: false,
        }),
      );
    });

  return sessionStore.systemTenantActive && tenantFilter.value
    ? result.filter((item) => item.tenantId === tenantFilter.value)
    : result;
});

const refresh = async () => {
  busy.value = true;

  try {
    const identityResponse = await accessApi.get(`v1/identities/${id.value}`);

    name.value = identityResponse.data.name;
    identityRoles.value = identityResponse.data.roles;
    identityTenants.value = identityResponse.data.tenants;

    if (
      tenantFilter.value &&
      !identityTenants.value.some((item: any) => item.id === tenantFilter.value)
    ) {
      tenantFilter.value = null;
    }

    const roleResponse = await accessApi.post(
      "v1/roles/search",
      sessionStore.systemTenantActive
        ? {
          tenantIds: identityTenants.value.map((item: any) => item.id),
        }
        : {},
    );

    roles.value = roleResponse.data;
  } finally {
    busy.value = false;
  }
};

const workingItems = computed(() => {
  return items.value.filter((item) => {
    return item.working;
  });
});

const workingCount = computed(() => {
  return workingItems.value.length;
});

const getRoleAssignment = (id: string): RoleItem | undefined => {
  return items.value.find((item) => item.roleId === id);
};

const getWorkingRoles = async () => {
  if (workingCount.value === 0) {
    return;
  }

  const response = await accessApi.post(
    `v1/identities/${id.value}/roles/availability`,
    {
      values: workingItems.value.map((item) => item.roleId),
    },
  );

  response.data.forEach((availability: IdentifierAvailability) => {
    const roleItem = getRoleAssignment(availability.id);

    if (!roleItem) {
      return;
    }

    roleItem.working = roleItem.activeOnToggle
      ? availability.active
      : !availability.active;
  });

  timeoutId = setTimeout(async () => {
    await getWorkingRoles();
  }, 1000);
};

const toggle = async (item: RoleItem) => {
  if (item.working) {
    snackbarStore.working();
    return;
  }

  item.working = true;
  item.activeOnToggle = !item.active;

  await accessApi.patch(
    `v1/identities/${id.value}/roles/${item.roleId}/status`,
    {
      active: item.active,
    },
  );

  getWorkingRoles();
};

onMounted(() => {
  refresh();
});

onBeforeUnmount(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
});
</script>
