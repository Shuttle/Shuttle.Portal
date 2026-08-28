<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('tests')" />
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
        <s-strip>
          <s-btn-add @click="add"></s-btn-add>
        </s-strip>
      </template>
      <template v-slot:item.action="{ item }">
        <s-strip>
          <v-btn :icon="mdiPlaylistEdit" size="x-small" @click.stop="testArguments(item)" />
          <v-btn :icon="mdiPlay" size="x-small" @click.stop="run(item)" />
          <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
        </s-strip>
      </template>
    </s-data-table>
  </v-card>
  <s-drawer></s-drawer>
  <v-dialog v-model="resultDialog" max-width="700">
    <v-card v-if="result">
      <v-card-title :class="result.passed ? 'text-green' : 'text-red'">
        {{ result.passed ? t("passed") : t("failed") }}
      </v-card-title>
      <v-card-text>
        <div class="mb-2"><strong>{{ t("result") }}:</strong> {{ result.result }}</div>
        <div v-if="result.exception" class="mb-2 text-red">
          <strong>{{ t("exception") }}:</strong> {{ result.exception }}
        </div>
        <v-divider class="my-2"></v-divider>
        <div class="text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
          <div v-for="(line, index) in result.logLines" :key="index" :style="{ paddingLeft: `${line.indent * 16}px` }">
            {{ line.text }}
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="resultDialog = false">{{ t("ok") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { mdiDelete, mdiMagnify, mdiPlay, mdiPlaylistEdit, mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { AbacusTest, TestRunResult } from "@/portal";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const confirmationStore = useConfirmationStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<AbacusTest[]> = ref([]);
const search: Ref<string> = ref("");
const resultDialog: Ref<boolean> = ref(false);
const result: Ref<TestRunResult | null> = ref(null);

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Tests.Manage,
    filterable: false,
  },
  {
    title: t("test-name"),
    value: "name",
  },
  {
    title: t("comparison"),
    value: "comparison",
  },
  {
    title: t("expected-result"),
    value: "expectedResult",
  },
]);

const refresh = async () => {
  busy.value = true;

  try {
    const { data } = await abacusApi.post<AbacusTest[]>("v1/tests/search", {});
    items.value = data;
  } finally {
    busy.value = false;
  }
};

const remove = async (item: AbacusTest) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" })).confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.delete(`v1/tests/${item.id}`);

    useSnackbarStore().requestSent();

    refresh();
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "test" });
};

const testArguments = (item: AbacusTest) => {
  router.push({ name: "test-arguments", params: { id: item.id } });
};

const run = async (item: AbacusTest) => {
  busy.value = true;

  try {
    const { data } = await abacusApi.get<TestRunResult>(`v1/tests/${item.id}/run`);

    result.value = data;
    resultDialog.value = true;
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/tests",
  });
});
</script>
