<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('arguments')" />
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
          <v-btn :icon="mdiFormatListBulleted" size="x-small" @click.stop="values(item)" />
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
import { mdiDelete, mdiFormatListBulleted, mdiMagnify, mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { Argument } from "@/portal";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const confirmationStore = useConfirmationStore();
const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<Argument[]> = ref([]);
const search: Ref<string> = ref("");

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Arguments.Manage,
    filterable: false,
  },
  {
    title: t("argument-name"),
    value: "name",
  },
  {
    title: t("data-type-name"),
    value: "dataTypeName",
  },
]);

const refresh = async () => {
  busy.value = true;

  try {
    const { data } = await abacusApi.post<Argument[]>("v1/arguments/search", {});
    items.value = data;
  } finally {
    busy.value = false;
  }
};

const remove = async (item: Argument) => {
  if (
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" })).confirmed
  ) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.delete(`v1/arguments/${item.id}`);

    useSnackbarStore().requestSent();

    refresh();
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "argument" });
};

const rename = (item: Argument) => {
  router.push({ name: "argument-rename", params: { id: item.id } });
};

const values = (item: Argument) => {
  router.push({ name: "argument-values", params: { id: item.id } });
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/arguments",
  });
});
</script>
