<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('matrices')" />
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
          <v-btn :icon="mdiFilterVariant" size="x-small" @click.stop="constraints(item)" />
          <v-btn :icon="mdiGrid" size="x-small" @click.stop="elements(item)" />
          <s-btn-edit @click.stop="edit(item)" />
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
import { mdiFilterVariant, mdiGrid, mdiMagnify, mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import { useSecureTableHeaders } from "@/composables/useSecureTableHeaders";
import Permissions from "@/permissions";
import type { Matrix } from "@/portal";
import { useDrawerStore } from "@/stores/drawer";

const drawerStore = useDrawerStore();
const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const busy: Ref<boolean> = ref(false);
const items: Ref<Matrix[]> = ref([]);
const search: Ref<string> = ref("");

const headers = useSecureTableHeaders([
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    permission: Permissions.Matrices.Manage,
    filterable: false,
  },
  {
    title: t("matrix-name"),
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
    const { data } = await abacusApi.post<Matrix[]>("v1/matrices/search", {});
    items.value = data;
  } finally {
    busy.value = false;
  }
};

const add = () => {
  router.push({ name: "matrix" });
};

const edit = (item: Matrix) => {
  router.push({ name: "matrix", params: { id: item.id } });
};

const constraints = (item: Matrix) => {
  router.push({ name: "matrix-constraints", params: { id: item.id } });
};

const elements = (item: Matrix) => {
  router.push({ name: "matrix-elements", params: { id: item.id } });
};

onMounted(() => {
  refresh();

  drawerStore.initialize({
    refresh: refresh,
    parentPath: "/matrices",
  });
});
</script>
