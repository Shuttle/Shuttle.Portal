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
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('semaphores')" />
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
    >
      <template v-slot:header.action="">
        <s-strip>
          <s-filter-toggle />
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn
            v-if="sessionStore.hasPermission(Permissions.Workflow.Semaphores.Manage)"
            :icon="mdiTrashCanOutline"
            size="x-small"
            @click.stop="remove(item)"
            v-tooltip="t('remove')"
          />
        </s-strip>
      </template>
    </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import Permissions from "@/permissions";
import { workflowApi } from "@/api";
import { useI18n } from "vue-i18n";
import { mdiMagnify, mdiTrashCanOutline } from "@mdi/js";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import type { WorkflowSemaphore, WorkflowSemaphoreSpecification } from "@/portal";
import { useSessionStore } from "@/stores/session";
import { useConfirmationStore } from "@/stores/confirmation";
import { useDateFormatter } from "@/composables/useDateFormatter";

const { t } = useI18n({ useScope: "global" });
const sessionStore = useSessionStore();
const confirmationStore = useConfirmationStore();

const busy = ref(false);
const search = ref("");
const specification = reactive<WorkflowSemaphoreSpecification>({
  key: "",
  keyMatch: "",
  owner: "",
  ownerMatch: "",
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
    title: t("_workflow.expires-at"),
    key: "expiresAt",
    value: (item: WorkflowSemaphore) => {
      return useDateFormatter(item.expiresAt).dateTime();
    },
  },
]);

const items: Ref<WorkflowSemaphore[]> = ref([]);

const refresh = async () => {
  busy.value = true;

  try {
    const response = await workflowApi.post<WorkflowSemaphore[]>(
      "/v1/semaphores/search",
      specification,
    );

    if (!response || !response.data) {
      return;
    }

    items.value = response.data;
  } finally {
    busy.value = false;
  }
};

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
