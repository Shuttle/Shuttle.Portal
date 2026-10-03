<template>
  <v-card flat v-if="drawerStore.size != 'full'">
    <v-card-title class="sv-card-title">
      <s-title :title="$t('states')" />
    </v-card-title>
    <v-divider></v-divider>
    <s-filter-bar :bar="filterBar" :describe="describeFilter" @refresh="refresh">
      <template v-slot:options>
        <s-maximum-rows v-model="specification.maximumRows" />
      </template>
      <template v-slot:editor="{ filter }">
        <div v-if="filter.key === 'key'" class="p-3">
          <v-text-field v-model="specification.keyMatch" :label="t('key')" density="compact" variant="solo-filled"
            flat hide-details clearable autofocus></v-text-field>
        </div>
        <s-date-range-filter v-else-if="filter.key === 'itemsEffective'"
          v-model:from="specification.itemStartEffectiveDate"
          v-model:to="specification.itemEndEffectiveDateExclusive" to-exclusive :precision="itemsEffectivePrecision"
          :max="null" />
      </template>
    </s-filter-bar>
    <v-divider></v-divider>
    <s-find-in-results v-model="search" :count="displayedItems.length" :total="items.length"
      :maximum-rows="specification.maximumRows" />
    <s-data-table :items="displayedItems" :headers="headers" :mobile="null" mobile-breakpoint="md" :loading="busy"
      show-expand expand-on-click v-model:expanded="expanded">
      <template v-slot:no-data>
        <div class="p-4 text-center">
          <div>{{ t("table-empty") }}</div>
          <s-clear-filters v-if="filterBar.hasNonDefaultFilters" class="mt-2" :bar="filterBar" />
        </div>
      </template>
      <template v-slot:header.action="">
        <s-strip>
          <s-btn-add :permission="Permissions.Workflow.States.Manage" @click="show(null)"></s-btn-add>
        </s-strip>
      </template>
      <template v-slot:item.key="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.key })"
          @click.stop="specification.keyMatch = item.key">{{ item.key }}</span>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <s-btn-edit :permission="Permissions.Workflow.States.Manage" @click.stop="show(item)" />
        </s-strip>
      </template>
      <template #expanded-row="{ columns, item: state }">
        <tr>
          <td :colspan="columns.length">
            <s-container show-border>
              <v-tabs v-model="state.tab" class="mb-2">
                <v-tab value="items">
                  {{ $t("items") }}
                </v-tab>
              </v-tabs>
              <v-divider></v-divider>
              <v-tabs-window v-model="state.tab">
                <v-tabs-window-item value="items">
                  <s-data-table :items="state.items" :headers="itemHeaders" :mobile="null" mobile-breakpoint="md"
                    :hide-default-footer="(state.items?.length ?? 0) < 10">
                    <template v-slot:header.action="">
                      <v-btn v-if="sessionStore.hasPermission(Permissions.Workflow.States.Manage)" :icon="mdiTableEdit"
                        size="x-small" @click.stop="showItems(state)" v-tooltip="t('edit')"></v-btn>
                    </template>
                    <template v-slot:item.action="{ item }">
                      <s-strip>
                        <v-btn v-if="
                          isOpenEnded(item.effectiveDateEnd) &&
                          sessionStore.hasPermission(Permissions.Workflow.States.Manage)
                        " :icon="mdiTimerOffOutline" size="x-small" @click.stop="expireItem(state, item)"
                          v-tooltip="t('expire')" />
                      </s-strip>
                    </template>
                  </s-data-table>
                </v-tabs-window-item>
              </v-tabs-window>
            </s-container>
          </td>
        </tr>
      </template>
    </s-data-table>
  </v-card>
  <s-drawer />
</template>

<script setup lang="ts">
import Permissions from "@/permissions";
import { workflowApi } from "@/api";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  mdiCalendarRange,
  mdiKeyOutline,
  mdiTableEdit,
  mdiTimerOffOutline,
} from "@mdi/js";
import { useDebounceFn } from "@vueuse/core";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import { useDateFormatter, isOpenEnded } from "@/composables/useDateFormatter";
import { describeDateRange, type TimePrecision } from "@/composables/useDateRange";
import { useFilterBar, type FilterDefinition } from "@/composables/useFilterBar";
import { useFindInResults } from "@/composables/useFindInResults";
import { useDrawerStore } from "@/stores/drawer";
import type {
  WorkflowState,
  WorkflowStateExpiry,
  WorkflowStateItem,
  WorkflowStateSpecification,
} from "@/portal";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSessionStore } from "@/stores/session";

const { t } = useI18n({ useScope: "global" });
const drawerStore = useDrawerStore();
const confirmationStore = useConfirmationStore();
const sessionStore = useSessionStore();
const router = useRouter();

const busy = ref(false);
const expanded: Ref<string[]> = ref([]);

const specification = reactive<WorkflowStateSpecification>({
  keyMatch: "",
  maximumRows: 100,
});

// Used by both the date range editor and the chip text so that they cannot drift apart.
const itemsEffectivePrecision: TimePrecision = "Second";

type FilterKey = "key" | "itemsEffective";

const filterBar = useFilterBar<FilterKey>({
  definitions: [
    { key: "key", title: t("key"), icon: mdiKeyOutline },
    {
      key: "itemsEffective",
      title: t("items-effective"),
      icon: mdiCalendarRange,
      wide: true,
    },
  ],
  hasValue: (key) => {
    switch (key) {
      case "key": {
        return !!specification.keyMatch;
      }
      case "itemsEffective": {
        return (
          !!specification.itemStartEffectiveDate ||
          !!specification.itemEndEffectiveDateExclusive
        );
      }
    }
  },
  clear: (key) => {
    switch (key) {
      case "key": {
        specification.keyMatch = "";
        break;
      }
      case "itemsEffective": {
        specification.itemStartEffectiveDate = undefined;
        specification.itemEndEffectiveDateExclusive = undefined;
        break;
      }
    }
  },
});

const describeFilter = (filter: FilterDefinition<FilterKey>) => {
  let value = "";

  switch (filter.key) {
    case "key": {
      value = specification.keyMatch ?? "";
      break;
    }
    case "itemsEffective": {
      value = describeDateRange(
        specification.itemStartEffectiveDate,
        specification.itemEndEffectiveDateExclusive,
        { precision: itemsEffectivePrecision, toExclusive: true },
      );
      break;
    }
  }

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
]);

const itemHeaders = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
  },
  {
    title: t("name"),
    value: "name",
  },
  {
    title: t("type"),
    value: "type",
  },
  {
    title: t("value"),
    value: "value",
  },
  {
    title: t("effective-date"),
    key: "item.effectiveDate",
    value: (item: WorkflowStateItem) => {
      return useDateFormatter(item.effectiveDate).dateTimeMilliseconds();
    },
  },
  {
    title: t("effective-date-end"),
    key: "item.effectiveDateEnd",
    value: (item: WorkflowStateItem) => {
      return isOpenEnded(item.effectiveDateEnd)
        ? t("current")
        : useDateFormatter(item.effectiveDateEnd).dateTimeMilliseconds();
    },
  },
  {
    title: t("date-registered"),
    key: "item.dateRegistered",
    value: (item: WorkflowStateItem) => {
      return useDateFormatter(item.dateRegistered).dateTimeMilliseconds();
    },
  },
]);

const items: Ref<WorkflowState[]> = ref([]);

const { search, displayedItems } = useFindInResults(items, headers);

const getSelectedTab = (id: string) => {
  return items.value.find((item) => item.id === id)?.tab || "items";
};

let latestRequest = 0;

const refresh = async () => {
  const request = ++latestRequest;

  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowState[]>(
      "/v1/states/search",
      specification,
    );

    // Filters are applied as they change, so a slower, earlier response should not replace a later one.
    if (request !== latestRequest || !response || !response.data) {
      return;
    }

    response.data.forEach((item) => {
      item.tab = getSelectedTab(item.id ?? "");
    });

    items.value = response.data;
  } finally {
    if (request === latestRequest) {
      busy.value = false;
    }
  }
};

const refreshDebounced = useDebounceFn(refresh, 400);

watch(specification, refreshDebounced, { deep: true });

const show = (item: WorkflowState | null) => {
  router.push({ name: "workflow-state", params: { id: item?.id } });
};

const showItems = (item: WorkflowState) => {
  router.push({ name: "workflow-state-items", params: { id: item.id } });
};

const expireItem = async (state: WorkflowState, item: WorkflowStateItem) => {
  if (
    !(
      await confirmationStore.show({
        messageKey: "confirm-expire-state-item",
      })
    ).confirmed
  ) {
    return;
  }

  const expiries: WorkflowStateExpiry[] = [{ name: item.name }];

  await workflowApi.patch(`v1/states/${state.id}/expire`, expiries);
  await refresh();
};

onMounted(async () => {
  await refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/workflow/states",
  });
});
</script>
