<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('semaphores')" />
    </v-card-title>
    <v-divider></v-divider>
    <s-filter-bar :bar="filterBar" :describe="describeFilter" @refresh="refresh">
      <template v-slot:options>
        <s-maximum-rows v-model="specification.maximumRows" />
      </template>
      <template v-slot:editor="{ filter }">
        <div v-if="filter.key === 'key'" class="p-3">
          <s-text-field v-model="specification.keyMatch" :label="t('key')" density="compact" variant="solo-filled"
            flat hide-details clearable autofocus></s-text-field>
        </div>
        <div v-else-if="filter.key === 'owner'" class="p-3">
          <s-text-field v-model="specification.ownerMatch" :label="t('owner')" density="compact"
            variant="solo-filled" flat hide-details clearable autofocus></s-text-field>
        </div>
      </template>
    </s-filter-bar>
    <v-divider></v-divider>
    <s-find-in-results v-model="search" :count="displayedItems.length" :total="items.length"
      :maximum-rows="specification.maximumRows" />
    <s-data-table :items="displayedItems" :headers="headers" :mobile="null" mobile-breakpoint="md" :loading="busy">
      <template v-slot:no-data>
        <div class="p-4 text-center">
          <div>{{ t("table-empty") }}</div>
          <s-clear-filters v-if="filterBar.hasNonDefaultFilters" class="mt-2" :bar="filterBar" />
        </div>
      </template>
      <template v-slot:item.key="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.key })"
          @click.stop="specification.keyMatch = item.key">{{ item.key }}</span>
      </template>
      <template v-slot:item.owner="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.owner })"
          @click.stop="specification.ownerMatch = item.owner">{{ item.owner }}</span>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn v-if="sessionStore.hasPermission(Permissions.Workflow.Semaphores.Manage)" :icon="mdiTrashCanOutline"
            size="x-small" @click.stop="remove(item)" v-tooltip="t('remove')" />
        </s-strip>
      </template>
    </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import Permissions from "@/permissions";
import { workflowApi } from "@/api";
import { useI18n } from "vue-i18n";
import { mdiAccountOutline, mdiKeyOutline, mdiTrashCanOutline } from "@mdi/js";
import { useDebounceFn } from "@vueuse/core";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import type { WorkflowSemaphore, WorkflowSemaphoreSpecification } from "@/portal";
import { useSessionStore } from "@/stores/session";
import { useConfirmationStore } from "@/stores/confirmation";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useFilterBar, type FilterDefinition } from "@/composables/useFilterBar";
import { useFindInResults } from "@/composables/useFindInResults";

const { t } = useI18n({ useScope: "global" });
const sessionStore = useSessionStore();
const confirmationStore = useConfirmationStore();

const busy = ref(false);
const specification = reactive<WorkflowSemaphoreSpecification>({
  key: "",
  keyMatch: "",
  owner: "",
  ownerMatch: "",
  maximumRows: 100,
});

type FilterKey = "key" | "owner";

const filterBar = useFilterBar<FilterKey>({
  definitions: [
    { key: "key", title: t("key"), icon: mdiKeyOutline },
    { key: "owner", title: t("owner"), icon: mdiAccountOutline },
  ],
  hasValue: (key) => {
    switch (key) {
      case "key": {
        return !!specification.keyMatch;
      }
      case "owner": {
        return !!specification.ownerMatch;
      }
    }
  },
  clear: (key) => {
    switch (key) {
      case "key": {
        specification.keyMatch = "";
        break;
      }
      case "owner": {
        specification.ownerMatch = "";
        break;
      }
    }
  },
});

const describeFilter = (filter: FilterDefinition<FilterKey>) => {
  const value =
    filter.key === "key" ? specification.keyMatch : specification.ownerMatch;

  return value ? `${filter.title}: ${value}` : filter.title;
};

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
  },
  {
    title: t("key"),
    value: "key",
  },
  {
    title: t("owner"),
    value: "owner",
  },
  {
    title: t("date-registered"),
    key: "date-registered",
    value: (item: WorkflowSemaphore) => {
      return useDateFormatter(item.dateRegistered).dateTime();
    },
  },
  {
    title: t("expires-at"),
    key: "expiresAt",
    value: (item: WorkflowSemaphore) => {
      return useDateFormatter(item.expiresAt).dateTime();
    },
  },
]);

const items: Ref<WorkflowSemaphore[]> = ref([]);

const { search, displayedItems } = useFindInResults(items, headers);

let latestRequest = 0;

const refresh = async () => {
  const request = ++latestRequest;

  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowSemaphore[]>(
      "/v1/semaphores/search",
      specification,
    );

    // Filters are applied as they change, so a slower, earlier response should not replace a later one.
    if (request !== latestRequest || !response || !response.data) {
      return;
    }

    items.value = response.data;
  } finally {
    if (request === latestRequest) {
      busy.value = false;
    }
  }
};

const refreshDebounced = useDebounceFn(refresh, 400);

watch(specification, refreshDebounced, { deep: true });

const remove = async (item: WorkflowSemaphore) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" }))
      .confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await workflowApi.delete<WorkflowSemaphore[]>("/v1/semaphores/" + item.id);
  } finally {
    busy.value = false;
  }

  await refresh();
};

onMounted(async () => {
  await refresh();
});
</script>
