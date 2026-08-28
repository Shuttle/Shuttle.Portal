<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('formulas')" />
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
          <v-btn :icon="mdiPlusMinusVariant" size="x-small" @click.stop="operations(item)" />
          <v-btn :icon="mdiFilterVariant" size="x-small" @click.stop="constraints(item)" />
          <s-btn-edit @click.stop="rename(item)" />
          <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
        </s-strip>
      </template>
    </s-data-table>
  </v-card>
  <s-drawer></s-drawer>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { mdiDelete, mdiFilterVariant, mdiMagnify, mdiPlusMinusVariant, mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { Formula } from "@/portal";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const confirmationStore = useConfirmationStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<Formula[]> = ref([]);
const search: Ref<string> = ref("");

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Formulas.Manage,
    filterable: false,
  },
  {
    title: t("formula-name"),
    value: "name",
  },
]);

const refresh = async () => {
  busy.value = true;

  try {
    const { data } = await abacusApi.post<Formula[]>("v1/formulas/search", {});
    items.value = data;
  } finally {
    busy.value = false;
  }
};

const remove = async (item: Formula) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" })).confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.delete(`v1/formulas/${item.id}`);

    useSnackbarStore().requestSent();

    refresh();
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "formula" });
};

const rename = (item: Formula) => {
  router.push({ name: "formula-rename", params: { id: item.id } });
};

const operations = (item: Formula) => {
  router.push({ name: "formula-operations", params: { id: item.id } });
};

const constraints = (item: Formula) => {
  router.push({ name: "formula-constraints", params: { id: item.id } });
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/formulas",
  });
});
</script>
