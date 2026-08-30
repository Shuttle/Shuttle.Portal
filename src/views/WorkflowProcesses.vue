<template>
  <s-filter-drawer @filter="refresh">
    <v-switch
      v-model="specification.activeOnly"
      :label="$t('_workflow.show-active-only')"
      hide-details
      @update:model-value="refresh"
    ></v-switch>
    <WorkflowProcessDefinition
      v-model="specification.name"
      density="compact"
      variant="solo-filled"
      flat
      hide-details
      clearable
    ></WorkflowProcessDefinition>
    <v-text-field
      v-model="specification.keyMatch"
      :label="$t('key')"
      density="compact"
      variant="solo-filled"
      flat
      hide-details
    ></v-text-field>
    <v-combobox
      v-model="specification.ids"
      :label="$t('_workflow.ids')"
      variant="solo-filled"
      multiple
      chips
      closable-chips
      flat
      hide-details
    ></v-combobox>
    <v-date-input
      prepend-icon=""
      prepend-inner-icon="$calendar"
      v-model="specification.fromDateRegisteredInclusive"
      :label="$t('_workflow.from-date-registered-inclusive')"
      clearable
      hide-details
      :max="new Date()"
    ></v-date-input>
    <v-date-input
      prepend-icon=""
      prepend-inner-icon="$calendar"
      v-model="specification.toDateRegisteredExclusive"
      :label="$t('_workflow.to-date-registered-exclusive')"
      clearable
      hide-details
      :max="new Date()"
    ></v-date-input>
    <v-date-input
      prepend-icon=""
      prepend-inner-icon="$calendar"
      v-model="specification.fromDateCompletedInclusive"
      :label="$t('_workflow.from-date-completed-inclusive')"
      clearable
      hide-details
      :max="new Date()"
    ></v-date-input>
    <v-date-input
      prepend-icon=""
      prepend-inner-icon="$calendar"
      v-model="specification.toDateCompletedExclusive"
      :label="$t('_workflow.to-date-completed-exclusive')"
      clearable
      hide-details
      :max="new Date()"
    ></v-date-input>
    <v-select
      chips
      clearable
      closable-chips
      hide-details
      :items="statuses"
      :label="$t('_workflow.included-statuses')"
      multiple
      v-model="specification.includedStatuses"
    ></v-select>
    <v-select
      chips
      clearable
      closable-chips
      hide-details
      :items="statuses"
      :label="$t('_workflow.excluded-statuses')"
      multiple
      v-model="specification.excludedStatuses"
    ></v-select>
    <s-maximum-rows v-model="specification.maximumRows" />
  </s-filter-drawer>
  <v-card flat v-if="drawerStore.size != 'full'">
    <v-card-title class="sv-card-title">
      <s-title :title="$t('processes')" />
      <s-strip>
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
      expand-on-click
      v-model:expanded="expanded"
    >
      <template v-slot:header.action="">
        <s-strip>
          <s-btn-add
            :permission="Permissions.Workflow.Processes.Manage"
            @click="show(null)"
          ></s-btn-add>
          <s-filter-toggle />
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn
            :icon="mdiCancel"
            size="x-small"
            @click.stop="abandonProcess(item)"
            v-tooltip="t('_workflow.process-abandon')"
          />
          <v-btn
            :icon="mdiPlayOutline"
            size="x-small"
            @click.stop="continueProcess(item)"
            v-tooltip="t('_workflow.process-continue')"
          />
          <v-btn
            v-if="(item.status ?? '') === 'Deferred'"
            :icon="mdiTimerPlayOutline"
            size="x-small"
            @click.stop="continueDeferredProcess(item)"
            v-tooltip="t('_workflow.process-continue-deferred')"
          />
          <v-btn
            :icon="mdiContentCopy"
            size="x-small"
            @click.stop="show(item)"
            v-tooltip="t('clone')"
          />
          <v-btn
            :icon="mdiIdentifier"
            size="x-small"
            @click.stop="copyIdToClipboard(item)"
            v-tooltip="`${t('_workflow.copy-id-to-clipboard')}: ${item.id}`"
          />
          <v-btn
            v-if="item.continuationToken"
            :icon="mdiLinkVariant"
            size="x-small"
            @click.stop="copyContinuationLinkToClipboard(item)"
            v-tooltip="t('_workflow.copy-continuation-link-to-clipboard')"
          />
        </s-strip>
      </template>
      <template #expanded-row="{ columns, item: process }">
        <tr>
          <td :colspan="columns.length">
            <s-container show-border>
              <v-tabs v-model="process.tab" class="mb-2">
                <v-tab value="items">{{ $t("items") }}</v-tab>
                <v-tab value="messages">{{ $t("_workflow.messages") }}</v-tab>
              </v-tabs>
              <v-divider></v-divider>
              <v-tabs-window v-model="process.tab">
                <v-tabs-window-item value="items">
                  <s-data-table
                    :items="process.state?.items"
                    :headers="itemHeaders"
                    :mobile="null"
                    mobile-breakpoint="md"
                    :hide-default-footer="(process.state?.items?.length ?? 0) < 10"
                  >
                    <template v-slot:header.action="">
                      <v-btn
                        v-if="sessionStore.hasPermission(Permissions.Workflow.States.Manage)"
                        :icon="mdiTableEdit"
                        size="x-small"
                        @click.stop="showItems(process.state)"
                        v-tooltip="t('edit')"
                      ></v-btn>
                    </template>
                  </s-data-table>
                </v-tabs-window-item>
                <v-tabs-window-item value="messages">
                  <s-data-table
                    :items="process.messages"
                    :headers="messageHeaders"
                    :mobile="null"
                    mobile-breakpoint="md"
                    :hide-default-footer="(process.messages?.length ?? 0) < 10"
                  >
                    <template v-slot:header.action="">
                      <s-btn-add
                        :permission="Permissions.Workflow.Processes.Manage"
                        @click="showMessage(process)"
                      ></s-btn-add>
                    </template>
                    <template v-slot:item.action="{ item: message }">
                      <s-strip>
                        <v-btn
                          v-if="
                            !message.dateCompleted &&
                            sessionStore.hasPermission(Permissions.Workflow.Processes.Manage)
                          "
                          :icon="mdiDebugStepOver"
                          size="x-small"
                          @click.stop="completeMessage(process, message)"
                          v-tooltip="t('_workflow.process-complete-message')"
                        />
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
  mdiCancel,
  mdiContentCopy,
  mdiDebugStepOver,
  mdiIdentifier,
  mdiLinkVariant,
  mdiMagnify,
  mdiPlayOutline,
  mdiTableEdit,
  mdiTimerPlayOutline,
} from "@mdi/js";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import { useDateFormatter, isOpenEnded } from "@/composables/useDateFormatter";
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
const search = ref("");
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

const headers = useSecureTableHeaders([
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
    title: t("_workflow.deferred-till"),
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
    title: t("_workflow.status-message"),
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
    title: t("_workflow.effective-date"),
    key: "item.effectiveDate",
    value: (item: WorkflowStateItem) => {
      return useDateFormatter(item.effectiveDate).dateTimeMilliseconds();
    },
  },
  {
    title: t("_workflow.effective-date-end"),
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
    title: t("_workflow.type-name"),
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

const copyIdToClipboard = async (item: WorkflowProcess) => {
  if (!item.id) {
    return;
  }

  await navigator.clipboard.writeText(item.id);

  useSnackbarStore().open(t("_workflow.copied"));
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

  useSnackbarStore().open(t("_workflow.copied"));
};

const show = (item: WorkflowProcess | null) => {
  router.push({ name: "workflow-process", params: { id: item?.id } });
};

const abandonProcess = async (item: WorkflowProcess) => {
  router.push({ name: "workflow-process-abandon", params: { id: item?.id } });
};

const continueProcess = async (item: WorkflowProcess) => {
  await workflowApi.patch(`v1/processes/${item.id}/continue`);
  await refresh();
};

const continueDeferredProcess = async (item: WorkflowProcess) => {
  if (
    !(
      await confirmationStore.show({
        messageKey: "_workflow.confirm-continue-deferred-process",
      })
    ).confirmed
  ) {
    return;
  }

  await workflowApi.patch(`v1/processes/${item.id}/continue-deferred`);
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
        messageKey: "_workflow.confirm-complete-message",
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

const refresh = async () => {
  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowProcess[]>(
      "/v1/processes/search",
      specification,
    );

    if (!response || !response.data) {
      return;
    }

    response.data.forEach((item) => {
      item.tab = getSelectedTab(item.id ?? "");
    });

    items.value = response.data;
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  await refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/workflow/processes",
  });
});
</script>
