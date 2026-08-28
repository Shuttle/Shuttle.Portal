<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('constraints')} - ${name}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="2">
          <v-select v-model="newItem.axis" :label="$t('row')" :items="axisOptions" density="compact" hide-details></v-select>
        </v-col>
        <v-col cols="12" sm="2">
          <v-text-field v-model.number="newItem.index" type="number" min="1" :label="`${t('row')}/${t('column')} #`" density="compact" hide-details></v-text-field>
        </v-col>
        <v-col cols="12" sm="2">
          <v-select v-model="newItem.comparison" :label="$t('comparison')" :items="comparisons" density="compact" hide-details></v-select>
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field v-model="newItem.value" :label="$t('value')" density="compact" hide-details></v-text-field>
        </v-col>
        <v-col cols="12" sm="2" class="flex items-center">
          <v-btn :icon="mdiPlus" @click="add" :disabled="!canAdd"></v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    <v-divider></v-divider>
    <s-data-table :items="items" :headers="headers" :loading="busy"> </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiPlus, mdiRefresh } from "@mdi/js";
import type { Matrix, MatrixConstraint } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const name: Ref<string> = ref("");
const items: Ref<MatrixConstraint[]> = ref([]);
const busy: Ref<boolean> = ref(false);

const axisOptions = ["Row", "Column"];
const comparisons = ["==", "!=", ">=", ">", "<=", "<"];

const newItem = reactive({
  axis: "Row",
  index: 1,
  comparison: "==",
  value: "",
});

const canAdd = computed(() => !!newItem.axis && newItem.index >= 1 && !!newItem.comparison && !!newItem.value);

const headers = [
  {
    title: t("row") + "/" + t("column"),
    value: "axis",
  },
  {
    title: "#",
    value: "index",
  },
  {
    title: t("comparison"),
    value: "comparison",
  },
  {
    title: t("value"),
    value: "value",
  },
];

const refresh = async () => {
  busy.value = true;

  try {
    const matrixResponse = await abacusApi.get<Matrix>(`v1/matrices/${id}`);

    name.value = matrixResponse.data.name;

    const constraintsResponse = await abacusApi.get<MatrixConstraint[]>(`v1/matrices/${id}/constraints`);

    items.value = constraintsResponse.data;
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
    await abacusApi.post(`v1/matrices/${id}/constraints`, {
      axis: newItem.axis,
      index: newItem.index,
      comparison: newItem.comparison,
      value: newItem.value,
    });

    newItem.value = "";

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
