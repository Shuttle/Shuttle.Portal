<template>
  <s-filter-drawer @filter="refresh">
    <v-text-field
      v-model="specification.keyMatch"
      :label="$t('key')"
      density="compact"
      variant="solo-filled"
      flat
      hide-details
    ></v-text-field>
    <s-maximum-rows v-model="specification.maximumRows" />
  </s-filter-drawer>
  <v-card flat v-if="drawerStore.size != 'full'">
    <v-card-title class="sv-card-title">
      <s-title :title="$t('states')" />
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
            :permission="Permissions.Workflow.States.Manage"
            @click="show(null)"
          ></s-btn-add>
          <s-filter-toggle />
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <s-btn-edit
            :permission="Permissions.Workflow.States.Manage"
            @click.stop="show(item)"
          />
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
                  <s-data-table
                    :items="state.items"
                    :headers="itemHeaders"
                    :mobile="null"
                    mobile-breakpoint="md"
                    :hide-default-footer="(state.items?.length ?? 0) < 10"
                  >
                    <template v-slot:header.action="">
                      <v-btn
                        v-if="sessionStore.hasPermission(Permissions.Workflow.States.Manage)"
                        :icon="mdiTableEdit"
                        size="x-small"
                        @click.stop="showItems(state)"
                        v-tooltip="t('edit')"
                      ></v-btn>
                    </template>
                    <template v-slot:item.action="{ item }">
                      <s-strip>
                        <v-btn
                          v-if="
                            isOpenEnded(item.effectiveDateEnd) &&
                            sessionStore.hasPermission(Permissions.Workflow.States.Manage)
                          "
                          :icon="mdiTimerOffOutline"
                          size="x-small"
                          @click.stop="expireItem(state, item)"
                          v-tooltip="t('expire')"
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
import { mdiMagnify, mdiTableEdit, mdiTimerOffOutline } from "@mdi/js";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import { useDateFormatter, isOpenEnded } from "@/composables/useDateFormatter";
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
const search = ref("");
const expanded: Ref<string[]> = ref([]);

const specification = reactive<WorkflowStateSpecification>({
  maximumRows: 100,
});

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
]);

const items: Ref<WorkflowState[]> = ref([]);

const getSelectedTab = (id: string) => {
  return items.value.find((item) => item.id === id)?.tab || "items";
};

const refresh = async () => {
  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowState[]>(
      "/v1/states/search",
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
        messageKey: "_workflow.confirm-expire-state-item",
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
