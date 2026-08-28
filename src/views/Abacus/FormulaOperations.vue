<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('operations')} - ${name}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="2">
          <v-select v-model="newItem.operation" :label="$t('operation')" :items="operationTypes" density="compact" hide-details></v-select>
        </v-col>
        <v-col cols="12" sm="3">
          <v-select
            v-model="newItem.valueProviderName"
            :label="$t('value-provider-name')"
            :items="valueProviderTypes"
            density="compact"
            hide-details
            @update:model-value="onProviderChanged"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="5">
          <v-autocomplete
            v-if="isReferenceProvider"
            v-model="newItem.inputParameter"
            :label="$t('input-parameter')"
            :items="referenceItems"
            item-title="name"
            item-value="id"
            density="compact"
            hide-details
          ></v-autocomplete>
          <v-text-field
            v-else
            v-model="newItem.inputParameter"
            :label="$t('input-parameter')"
            density="compact"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="2" class="flex items-center">
          <v-btn :icon="mdiPlus" @click="add" :disabled="!canAdd"></v-btn>
        </v-col>
      </v-row>
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
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiDelete, mdiPlus, mdiRefresh } from "@mdi/js";
import type { Formula, FormulaOperation } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const name: Ref<string> = ref("");
const items: Ref<FormulaOperation[]> = ref([]);
const busy: Ref<boolean> = ref(false);
const referenceItems: Ref<{ id: string; name: string }[]> = ref([]);

const operationTypes = ["Addition", "Subtraction", "Multiplication", "Division", "Rounding"];
const valueProviderTypes = ["Argument", "Decimal", "Matrix", "Formula", "Result"];

const newItem = reactive({
  operation: "Addition",
  valueProviderName: "Argument",
  inputParameter: "",
});

const isReferenceProvider = computed(() =>
  ["Argument", "Matrix", "Formula"].includes(newItem.valueProviderName),
);

const canAdd = computed(() => !!newItem.operation && !!newItem.valueProviderName && !!newItem.inputParameter);

const headers = [
  {
    title: t("operation"),
    value: "operation",
  },
  {
    title: t("value-provider-name"),
    value: "valueProviderName",
  },
  {
    title: t("input-parameter"),
    value: "inputParameter",
  },
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    filterable: false,
  },
];

const searchPath = (providerName: string) => {
  switch (providerName) {
    case "Argument":
      return "v1/arguments/search";
    case "Matrix":
      return "v1/matrices/search";
    case "Formula":
      return "v1/formulas/search";
    default:
      return null;
  }
};

const onProviderChanged = async () => {
  newItem.inputParameter = "";

  const path = searchPath(newItem.valueProviderName);

  if (!path) {
    referenceItems.value = [];
    return;
  }

  const { data } = await abacusApi.post(path, {});

  referenceItems.value = data;
};

const refresh = async () => {
  busy.value = true;

  try {
    const formulaResponse = await abacusApi.get<Formula>(`v1/formulas/${id}`);

    name.value = formulaResponse.data.name;

    const operationsResponse = await abacusApi.get<FormulaOperation[]>(`v1/formulas/${id}/operations`);

    items.value = operationsResponse.data;
  } finally {
    busy.value = false;
  }
};

const add = async () => {
  if (!canAdd.value) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.post(`v1/formulas/${id}/operations`, {
      operation: newItem.operation,
      valueProviderName: newItem.valueProviderName,
      inputParameter: newItem.inputParameter,
    });

    newItem.inputParameter = "";

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

const remove = async (item: FormulaOperation) => {
  busy.value = true;

  try {
    await abacusApi.delete(`v1/formulas/${id}/operations/${item.id}`);

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  refresh();
  onProviderChanged();
});
</script>
