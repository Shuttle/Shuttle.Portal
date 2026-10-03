<template>
  <v-card flat v-if="drawerStore.size != 'full'">
    <v-card-title class="sv-card-title">
      <s-title :title="$t('processes')" />
    </v-card-title>
    <v-divider></v-divider>
    <s-filter-bar :bar="filterBar" :describe="describeFilter" @refresh="refresh">
      <template v-slot:presets>
        <v-chip-group :model-value="preset" mandatory filter color="primary" @update:model-value="applyPreset">
          <v-chip v-for="item in presets" :key="item.value" :value="item.value" variant="outlined" density="compact"
            :prepend-icon="item.icon">
            {{ item.title }}
          </v-chip>
        </v-chip-group>
      </template>
      <template v-slot:chips>
        <v-chip v-if="showActiveOnlyChip" closable :prepend-icon="mdiPlayCircleOutline" variant="tonal" color="primary"
          @click:close="specification.activeOnly = false">
          {{ t("active-only") }}
        </v-chip>
      </template>
      <template v-slot:options>
        <s-maximum-rows v-model="specification.maximumRows" />
      </template>
      <template v-slot:editor="{ filter }">
        <div v-if="filter.key === 'name'" class="p-3">
          <WorkflowProcessDefinition v-model="specification.name" density="compact" variant="solo-filled" flat
            hide-details clearable></WorkflowProcessDefinition>
        </div>
        <div v-else-if="filter.key === 'key'" class="p-3">
          <v-text-field v-model="specification.keyMatch" :label="t('key')" density="compact" variant="solo-filled"
            flat hide-details clearable autofocus></v-text-field>
        </div>
        <div v-else-if="filter.key === 'ids'" class="p-3">
          <v-combobox v-model="specification.ids" :label="t('ids')" density="compact" variant="solo-filled" multiple
            chips closable-chips flat hide-details></v-combobox>
        </div>
        <s-date-range-filter v-else-if="filter.key === 'registered'"
          v-model:from="specification.fromDateRegisteredInclusive"
          v-model:to="specification.toDateRegisteredExclusive" to-exclusive :precision="registeredPrecision" />
        <s-date-range-filter v-else-if="filter.key === 'completed'"
          v-model:from="specification.fromDateCompletedInclusive"
          v-model:to="specification.toDateCompletedExclusive" to-exclusive :precision="completedPrecision" />
        <div v-else-if="filter.key === 'statuses'" class="p-3">
          <div class="flex flex-wrap gap-2">
            <v-chip v-for="status in statuses" :key="status"
              :variant="getStatusState(status) === 'none' ? 'outlined' : 'flat'"
              :color="getStatusState(status) === 'included' ? 'primary' : getStatusState(status) === 'excluded' ? 'error' : undefined"
              :class="{ 'text-decoration-line-through': getStatusState(status) === 'excluded' }"
              :prepend-icon="getStatusState(status) === 'included' ? mdiCheck : getStatusState(status) === 'excluded' ? mdiClose : getStatusIcon(status)"
              @click="cycleStatus(status)">
              {{ status }}
            </v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mt-2">{{ t("status-filter-hint") }}</div>
        </div>
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
          <s-btn-add :permission="Permissions.Workflow.Processes.Manage" @click="show(null)"></s-btn-add>
        </s-strip>
      </template>
      <template v-slot:item.name="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.name })"
          @click.stop="filterByName(item.name)">{{ item.name }}</span>
      </template>
      <template v-slot:item.status="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.status })"
          @click.stop="filterByStatus(item.status)">{{ item.status }}</span>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn :icon="mdiCancel" size="x-small" @click.stop="abandonProcess(item)" v-tooltip="t('process-abandon')" />
          <v-btn :icon="mdiPlayOutline" size="x-small" @click.stop="continueProcess(item)"
            v-tooltip="t('process-continue')" />
          <v-btn :icon="mdiContentCopy" size="x-small" @click.stop="show(item)" v-tooltip="t('clone')" />
          <v-btn :icon="mdiIdentifier" size="x-small" @click.stop="copyIdToClipboard(item)"
            v-tooltip="`${t('copy-id-to-clipboard')}: ${item.id}`" />
          <v-btn v-if="item.continuationToken" :icon="mdiLinkVariant" size="x-small"
            @click.stop="copyContinuationLinkToClipboard(item)" v-tooltip="t('copy-continuation-link-to-clipboard')" />
        </s-strip>
      </template>
      <template v-slot:item.statusIcon="{ item }">
        <v-icon :icon="getStatusIcon(item.status)" :class="getStatusIconClasses(item.status)"
          v-tooltip="item.status"></v-icon>
      </template>
      <template #expanded-row="{ columns, item: process }">
        <tr>
          <td :colspan="columns.length">
            <s-container show-border>
              <v-tabs v-model="process.tab" class="mb-2">
                <v-tab value="items">{{ $t("items") }}</v-tab>
                <v-tab value="messages">{{ $t("workflow-messages") }}</v-tab>
              </v-tabs>
              <v-divider></v-divider>
              <v-tabs-window v-model="process.tab">
                <v-tabs-window-item value="items">
                  <s-data-table :items="process.state?.items" :headers="itemHeaders" :mobile="null"
                    mobile-breakpoint="md" :hide-default-footer="(process.state?.items?.length ?? 0) < 10">
                    <template v-slot:header.action="">
                      <v-btn v-if="sessionStore.hasPermission(Permissions.Workflow.States.Manage)" :icon="mdiTableEdit"
                        size="x-small" @click.stop="showItems(process.state)" v-tooltip="t('edit')"></v-btn>
                    </template>
                  </s-data-table>
                </v-tabs-window-item>
                <v-tabs-window-item value="messages">
                  <s-data-table :items="process.messages" :headers="messageHeaders" :mobile="null"
                    mobile-breakpoint="md" :hide-default-footer="(process.messages?.length ?? 0) < 10">
                    <template v-slot:header.action="">
                      <s-btn-add :permission="Permissions.Workflow.Processes.Manage"
                        @click="showMessage(process)"></s-btn-add>
                    </template>
                    <template v-slot:item.action="{ item: message }">
                      <s-strip>
                        <v-btn v-if="
                          !message.dateCompleted &&
                          sessionStore.hasPermission(Permissions.Workflow.Processes.Manage)
                        " :icon="mdiDebugStepOver" size="x-small" @click.stop="completeMessage(process, message)"
                          v-tooltip="t('process-complete-message')" />
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
  mdiAlertCircleOutline,
  mdiCalendarCheck,
  mdiCalendarPlus,
  mdiCancel,
  mdiCheck,
  mdiCheckCircleOutline,
  mdiCircleOutline,
  mdiClose,
  mdiContentCopy,
  mdiDebugStepOver,
  mdiFileTree,
  mdiIdentifier,
  mdiKeyOutline,
  mdiLinkVariant,
  mdiListStatus,
  mdiPlayCircleOutline,
  mdiPlayOutline,
  mdiTableEdit,
  mdiTimerPauseOutline,
  mdiTimerSand,
} from "@mdi/js";
import { useDebounceFn } from "@vueuse/core";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import { useDateFormatter, isOpenEnded } from "@/composables/useDateFormatter";
import { describeDateRange, type TimePrecision } from "@/composables/useDateRange";
import { useFilterBar, type FilterDefinition } from "@/composables/useFilterBar";
import { useFindInResults } from "@/composables/useFindInResults";
import { useDrawerStore } from "@/stores/drawer";
import type {
  WorkflowProcess,
  WorkflowProcessMessage,
  WorkflowProcessSpecification,
  WorkflowStateItem,
  WorkflowState,
} from "@/portal";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSessionStore } from "@/stores/session";
import { useSnackbarStore } from "@/stores/snackbar";

const { t } = useI18n({ useScope: "global" });
const drawerStore = useDrawerStore();
const confirmationStore = useConfirmationStore();
const sessionStore = useSessionStore();
const router = useRouter();

const busy = ref(false);
const expanded: Ref<string[]> = ref([]);
const specification = reactive<WorkflowProcessSpecification>({
  activeOnly: true,
  shouldIncludeMessages: true,
  name: "",
  keyMatch: "",
  maximumRows: 100,
});

const statuses: string[] = [
  "Abandoned",
  "Completed",
  "Deferred",
  "Failed",
  "Registered",
  "Started",
  "Waiting",
];

type FilterKey =
  | "name"
  | "key"
  | "ids"
  | "registered"
  | "completed"
  | "statuses";

// Used by both the date range editors and the chip text so that they cannot drift apart.
const registeredPrecision: TimePrecision = "Second";
const completedPrecision: TimePrecision = "Minute";

const hasValue = (key: FilterKey) => {
  switch (key) {
    case "name": {
      return !!specification.name;
    }
    case "key": {
      return !!specification.keyMatch;
    }
    case "ids": {
      return (specification.ids?.length ?? 0) > 0;
    }
    case "registered": {
      return (
        !!specification.fromDateRegisteredInclusive ||
        !!specification.toDateRegisteredExclusive
      );
    }
    case "completed": {
      return (
        !!specification.fromDateCompletedInclusive ||
        !!specification.toDateCompletedExclusive
      );
    }
    case "statuses": {
      return (
        (specification.includedStatuses?.length ?? 0) > 0 ||
        (specification.excludedStatuses?.length ?? 0) > 0
      );
    }
  }
};

const describeFilter = (filter: FilterDefinition<FilterKey>) => {
  let value = "";

  switch (filter.key) {
    case "name": {
      value = specification.name ?? "";
      break;
    }
    case "key": {
      value = specification.keyMatch ?? "";
      break;
    }
    case "ids": {
      value = `${specification.ids?.length ?? 0}`;
      break;
    }
    case "registered": {
      value = describeDateRange(
        specification.fromDateRegisteredInclusive,
        specification.toDateRegisteredExclusive,
        { precision: registeredPrecision, toExclusive: true },
      );
      break;
    }
    case "completed": {
      value = describeDateRange(
        specification.fromDateCompletedInclusive,
        specification.toDateCompletedExclusive,
        { precision: completedPrecision, toExclusive: true },
      );
      break;
    }
    case "statuses": {
      value = [
        ...(specification.includedStatuses ?? []),
        ...(specification.excludedStatuses ?? []).map((status) =>
          t("not-value", { value: status }),
        ),
      ].join(", ");
      break;
    }
  }

  return value ? `${filter.title}: ${value}` : filter.title;
};

const clear = (key: FilterKey) => {
  switch (key) {
    case "name": {
      specification.name = "";
      break;
    }
    case "key": {
      specification.keyMatch = "";
      break;
    }
    case "ids": {
      specification.ids = undefined;
      break;
    }
    case "registered": {
      specification.fromDateRegisteredInclusive = undefined;
      specification.toDateRegisteredExclusive = undefined;
      break;
    }
    case "completed": {
      specification.fromDateCompletedInclusive = undefined;
      specification.toDateCompletedExclusive = undefined;
      break;
    }
    case "statuses": {
      specification.includedStatuses = undefined;
      specification.excludedStatuses = undefined;
      break;
    }
  }
};

type PresetValue = "active" | "all" | "Deferred" | "Failed" | "Completed";

const presets: { value: PresetValue; title: string; icon?: string }[] = [
  { value: "active", title: t("active"), icon: mdiPlayCircleOutline },
  { value: "Deferred", title: t("deferred"), icon: mdiTimerSand },
  { value: "Failed", title: t("failed"), icon: mdiAlertCircleOutline },
  { value: "Completed", title: t("completed"), icon: mdiCheckCircleOutline },
  { value: "all", title: t("all") },
];

// A preset is only shown as selected when the status related part of the specification matches it exactly.
const preset = computed<PresetValue | undefined>(() => {
  const included = specification.includedStatuses ?? [];
  const excluded = specification.excludedStatuses ?? [];

  if (excluded.length > 0) {
    return undefined;
  }

  if (included.length === 0) {
    return specification.activeOnly ? "active" : "all";
  }

  if (!specification.activeOnly && included.length === 1) {
    return presets.find((item) => item.value === included[0])?.value;
  }

  return undefined;
});

const applyPreset = (value: PresetValue | undefined) => {
  if (!value) {
    return;
  }

  specification.activeOnly = value === "active";
  specification.includedStatuses =
    value === "active" || value === "all" ? undefined : [value];
  specification.excludedStatuses = undefined;
};

// The "active only" flag is a status shortcut that combines with the other filters, so it is
// shown separately when it does not form part of the selected preset.
const showActiveOnlyChip = computed(
  () => !!specification.activeOnly && preset.value !== "active",
);

const filterBar = useFilterBar<FilterKey>({
  definitions: [
    { key: "name", title: t("process-definition"), icon: mdiFileTree },
    { key: "key", title: t("key"), icon: mdiKeyOutline },
    { key: "ids", title: t("ids"), icon: mdiIdentifier },
    {
      key: "registered",
      title: t("date-registered"),
      icon: mdiCalendarPlus,
      wide: true,
    },
    {
      key: "completed",
      title: t("date-completed"),
      icon: mdiCalendarCheck,
      wide: true,
    },
    { key: "statuses", title: t("status"), icon: mdiListStatus },
  ],
  hasValue,
  clear,
  reset: () => applyPreset("active"),
  isDefault: () => preset.value === "active",
});

const getStatusState = (status: string) => {
  if (specification.includedStatuses?.includes(status)) {
    return "included";
  }

  return specification.excludedStatuses?.includes(status)
    ? "excluded"
    : "none";
};

// Each click moves the status through: included -> excluded -> cleared.
const cycleStatus = (status: string) => {
  const included = new Set(specification.includedStatuses ?? []);
  const excluded = new Set(specification.excludedStatuses ?? []);

  if (included.has(status)) {
    included.delete(status);
    excluded.add(status);
  } else if (excluded.has(status)) {
    excluded.delete(status);
  } else {
    included.add(status);

    // Including a specific status conflicts with showing active processes only.
    specification.activeOnly = false;
  }

  specification.includedStatuses = included.size > 0 ? [...included] : undefined;
  specification.excludedStatuses = excluded.size > 0 ? [...excluded] : undefined;
};

const filterByName = (name?: string) => {
  specification.name = name;
};

const filterByStatus = (status?: string) => {
  if (!status) {
    return;
  }

  specification.activeOnly = false;
  specification.includedStatuses = [status];
  specification.excludedStatuses = undefined;
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case "Abandoned": {
      return mdiCancel;
    }
    case "Completed": {
      return mdiCheckCircleOutline;
    }
    case "Deferred": {
      return mdiTimerSand;
    }
    case "Failed": {
      return mdiAlertCircleOutline;
    }
    case "Started": {
      return mdiPlayCircleOutline;
    }
    case "Waiting": {
      return mdiTimerPauseOutline;
    }
    default: {
      return mdiCircleOutline;
    }
  }
};

const getStatusIconClasses = (status?: string) => {
  switch (status) {
    case "Abandoned": {
      return "text-gray-500";
    }
    case "Completed": {
      return "text-green-500";
    }
    case "Deferred": {
      return "text-orange-500";
    }
    case "Failed": {
      return "text-red-500";
    }
    case "Started": {
      return "text-blue-500";
    }
    case "Waiting": {
      return "text-yellow-500";
    }
    default: {
      return "text-gray-400";
    }
  }
};

const headers = useSecureTableHeaders([
  {
    value: "statusIcon",
    headerProps: {
      class: "w-1",
    },
    filterable: false,
  },
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
    title: t("key"),
    value: "key",
  },
  {
    title: t("date-registered"),
    key: "item.dateRegistered",
    value: (item: WorkflowProcess) => {
      return useDateFormatter(item.dateRegistered).dateTimeMilliseconds();
    },
  },
  {
    title: t("date-completed"),
    key: "item.dateCompleted",
    value: (item: WorkflowProcess) => {
      return useDateFormatter(item.dateCompleted).dateTimeMilliseconds();
    },
  },
  {
    title: t("deferred-till"),
    key: "item.deferredTill",
    value: (item: WorkflowProcess) => {
      return useDateFormatter(item.deferredTill).dateTimeMilliseconds();
    },
  },
  {
    title: t("status"),
    value: "status",
  },
  {
    title: t("status-message"),
    value: "statusMessage",
  },
]);

const itemHeaders = [
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Workflow.States.Manage,
  },
  {
    title: t("name"),
    value: "name",
  },
  {
    title: t("value"),
    value: "value",
  },
  {
    title: t("type"),
    value: "type",
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
];

const messageHeaders = [
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Workflow.Processes.Manage,
  },
  {
    title: t("sequence-number"),
    value: "sequenceNumber",
  },
  {
    title: t("type-name"),
    value: "typeName",
  },
  {
    title: t("date-sent"),
    key: "item.dateSent",
    value: (item: WorkflowProcessMessage) => {
      return useDateFormatter(item.dateSent).dateTimeMilliseconds();
    },
  },
  {
    title: t("date-completed"),
    key: "item.dateCompleted",
    value: (item: WorkflowProcessMessage) => {
      return useDateFormatter(item.dateCompleted).dateTimeMilliseconds();
    },
  },
];

const items: Ref<WorkflowProcess[]> = ref([]);

const { search, displayedItems } = useFindInResults(items, headers);

const copyIdToClipboard = async (item: WorkflowProcess) => {
  if (!item.id) {
    return;
  }

  await navigator.clipboard.writeText(item.id);

  useSnackbarStore().open(t("copied"));
};

const copyContinuationLinkToClipboard = async (item: WorkflowProcess) => {
  if (!item.id || !item.continuationToken) {
    return;
  }

  const { href } = router.resolve({
    name: "workflow-process-continuation",
    params: { id: item.id, token: item.continuationToken },
  });

  await navigator.clipboard.writeText(
    new URL(href, window.location.origin).href,
  );

  useSnackbarStore().open(t("copied"));
};

const show = (item: WorkflowProcess | null) => {
  router.push({ name: "workflow-process", params: { id: item?.id } });
};

const abandonProcess = async (item: WorkflowProcess) => {
  router.push({ name: "workflow-process-abandon", params: { id: item?.id } });
};

const continueProcess = async (item: WorkflowProcess) => {
  if ((item.status ?? "") === "Deferred") {
    if (
      !(
        await confirmationStore.show({
          messageKey: "confirm-continue-deferred-process",
        })
      ).confirmed
    ) {
      return;
    }

    await workflowApi.patch(`v1/processes/${item.id}/continue-deferred`);
    await refresh();
    return;
  }

  await workflowApi.patch(`v1/processes/${item.id}/continue`);
  await refresh();
};

const showMessage = (process: WorkflowProcess) => {
  router.push({
    name: "workflow-process-message",
    params: { processId: process.id },
  });
};

const completeMessage = async (
  process: WorkflowProcess,
  message: WorkflowProcessMessage,
) => {
  if (
    !(
      await confirmationStore.show({
        messageKey: "confirm-complete-message",
      })
    ).confirmed
  ) {
    return;
  }

  await workflowApi.patch(
    `v1/processes/${process.id}/message-completed/${message.id}`,
  );
  await refresh();
};

const showItems = (item: WorkflowState | undefined) => {
  if (!item) {
    return;
  }

  router.push({
    name: "workflow-process-state-items",
    params: { id: item.id },
  });
};

const getSelectedTab = (id: string) => {
  return items.value.find((item) => item.id === id)?.tab || "items";
};

let latestRequest = 0;

const refresh = async () => {
  const request = ++latestRequest;

  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowProcess[]>(
      "/v1/processes/search",
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

onMounted(async () => {
  await refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/workflow/processes",
  });
});
</script>
