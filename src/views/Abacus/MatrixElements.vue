<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('elements')} - ${matrixName}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <p class="mb-4 text-sm opacity-70">{{ t("elements") }}: {{ t("row") }} 1-{{ rowCount }}, {{ t("column") }} 1-{{ columnCount }}. {{ $t("edit") }}: click a cell, type a value, Enter to save, Escape to cancel.</p>
      <table class="border-collapse">
        <thead>
          <tr>
            <th class="border p-2"></th>
            <th v-for="column in columnCount" :key="column" class="border p-2 text-sm">
              {{ t("column") }} {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rowCount" :key="row">
            <th class="border p-2 text-sm">{{ t("row") }} {{ row }}</th>
            <td
              v-for="column in columnCount"
              :key="column"
              class="border p-2 cursor-pointer min-w-24 text-center"
              @click="startEdit(row, column)"
            >
              <v-text-field
                v-if="isEditing(row, column)"
                v-model="editingValue"
                density="compact"
                hide-details
                autofocus
                @keydown.enter="commitEdit(row, column)"
                @keydown.esc="cancelEdit"
                @blur="commitEdit(row, column)"
              ></v-text-field>
              <span v-else>{{ elementValue(row, column) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiRefresh } from "@mdi/js";
import type { Matrix, MatrixConstraint, MatrixElement } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const matrixName: Ref<string> = ref("");
const constraints: Ref<MatrixConstraint[]> = ref([]);
const elements: Ref<MatrixElement[]> = ref([]);
const busy: Ref<boolean> = ref(false);

const editingCell: Ref<{ row: number; column: number } | null> = ref(null);
const editingValue: Ref<string> = ref("");

const rowCount = computed(() => {
  const rows = constraints.value.filter((c) => c.axis === "Row").length;
  return Math.max(rows, 1);
});

const columnCount = computed(() => {
  const columns = constraints.value.filter((c) => c.axis === "Column").length;
  return Math.max(columns, 1);
});

const elementValue = (row: number, column: number) => {
  return elements.value.find((e) => e.row === row && e.column === column)?.value ?? "";
};

const isEditing = (row: number, column: number) => {
  return editingCell.value?.row === row && editingCell.value?.column === column;
};

const startEdit = (row: number, column: number) => {
  editingCell.value = { row, column };
  editingValue.value = elementValue(row, column);
};

const cancelEdit = () => {
  editingCell.value = null;
};

const commitEdit = async (row: number, column: number) => {
  if (!isEditing(row, column)) {
    return;
  }

  const value = editingValue.value;

  editingCell.value = null;

  if (!value) {
    return;
  }

  await abacusApi.post(`v1/matrices/${id}/elements`, {
    row,
    column,
    value,
  });

  useSnackbarStore().requestSent();

  await refresh();
};

const refresh = async () => {
  busy.value = true;

  try {
    const [matrixResponse, constraintsResponse, elementsResponse] = await Promise.all([
      abacusApi.get<Matrix>(`v1/matrices/${id}`),
      abacusApi.get<MatrixConstraint[]>(`v1/matrices/${id}/constraints`),
      abacusApi.get<MatrixElement[]>(`v1/matrices/${id}/elements`),
    ]);

    matrixName.value = matrixResponse.data.name;
    constraints.value = constraintsResponse.data;
    elements.value = elementsResponse.data;
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>
