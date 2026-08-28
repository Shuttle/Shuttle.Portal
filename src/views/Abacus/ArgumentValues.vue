<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('values')} - ${name}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-form @submit.prevent="add" class="flex items-end gap-2 mb-4">
        <v-text-field
          v-model="newValue"
          :label="$t('new-value')"
          density="compact"
          hide-details
          class="max-w-sm"
        ></v-text-field>
        <v-btn :icon="mdiPlus" @click="add" :disabled="!newValue"></v-btn>
      </v-form>
    </v-card-text>
    <v-divider></v-divider>
    <s-data-table :items="items" :headers="headers" :loading="busy">
      <template v-slot:item.action="{ item }">
        <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
      </template>
    </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiDelete, mdiPlus, mdiRefresh } from "@mdi/js";
import type { Argument, ArgumentValue } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const name: Ref<string> = ref("");
const items: Ref<ArgumentValue[]> = ref([]);
const busy: Ref<boolean> = ref(false);
const newValue: Ref<string> = ref("");

const headers = [
  {
    title: t("value"),
    value: "value",
  },
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    filterable: false,
  },
];

const refresh = async () => {
  busy.value = true;

  try {
    const argumentResponse = await abacusApi.get<Argument>(`v1/arguments/${id}`);

    name.value = argumentResponse.data.name;

    const valuesResponse = await abacusApi.get<string[]>(`v1/arguments/${id}/values`);

    items.value = valuesResponse.data.map((value) => ({ value }));
  } finally {
    busy.value = false;
  }
};

const add = async () => {
  if (!newValue.value) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.post(`v1/arguments/${id}/values`, {
      value: newValue.value,
    });

    newValue.value = "";

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

const remove = async (item: ArgumentValue) => {
  busy.value = true;

  try {
    await abacusApi.delete(`v1/arguments/${id}/values`, {
      data: { value: item.value },
    });

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>
