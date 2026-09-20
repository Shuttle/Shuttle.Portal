<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('matrix')} - ${matrix?.name ?? ''}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" :loading="busy" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-table density="compact" class="matrix-grid">
        <colgroup>
          <col class="matrix-grid-row-column" />
          <col v-for="column in Math.max(columnCount, 1)" :key="column" />
        </colgroup>
        <thead>
          <tr>
            <th :rowspan="columnArgument ? 2 : 1" class="text-center border matrix-header matrix-header-row">
              <div class="d-flex align-center justify-center ga-2">
                {{ rowArgument?.name }}
                <v-btn
                  :icon="mdiPlus"
                  size="x-small"
                  variant="text"
                  :title="t('add-row')"
                  :disabled="!rowArgument"
                  @click="editConstraint('Row', rowCount + 1)"
                ></v-btn>
              </div>
            </th>
            <th
              v-if="columnArgument"
              :colspan="Math.max(columnCount, 1)"
              class="text-center border matrix-header matrix-header-column"
            >
              <div class="d-flex align-center justify-center ga-2">
                {{ columnArgument.name }}
                <v-btn
                  :icon="mdiPlus"
                  size="x-small"
                  variant="text"
                  :title="t('add-column')"
                  @click="editConstraint('Column', columnCount + 1)"
                ></v-btn>
              </div>
            </th>
          </tr>
          <tr v-if="columnArgument">
            <th
              v-for="column in columnCount"
              :key="column"
              class="text-center border cursor-pointer matrix-constraint-column"
              @click="editConstraint('Column', column)"
            >
              {{ constraintLabel("Column", column) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rowCount" :key="row">
            <th class="text-center border cursor-pointer matrix-constraint-row" @click="editConstraint('Row', row)">
              {{ constraintLabel("Row", row) }}
            </th>
            <td
              v-for="column in columnCount"
              :key="column"
              class="text-center border cursor-pointer"
              :class="{ 'pa-0 matrix-cell-editing': isEditing(row, column) }"
              @click="startEdit(row, column)"
            >
              <div
                v-if="isEditing(row, column)"
                class="matrix-cell-editor"
                @click.stop
                @keydown.enter.capture.prevent.stop="saveEdit"
                @keydown.esc.stop="cancelEdit"
              >
                <abacus-value-input
                  v-model="cellValue"
                  :data-type-name="matrix?.dataTypeName ?? 'Text'"
                  variant="outlined"
                  density="compact"
                  autofocus
                >
                  <template v-slot:append-inner>
                    <v-btn
                      :icon="mdiCheck"
                      size="x-small"
                      variant="text"
                      color="success"
                      :title="t('save')"
                      :disabled="busy"
                      @click="saveEdit"
                    ></v-btn>
                    <v-btn
                      :icon="mdiClose"
                      size="x-small"
                      variant="text"
                      color="error"
                      :title="t('cancel')"
                      @click="cancelEdit"
                    ></v-btn>
                  </template>
                </abacus-value-input>
              </div>
              <template v-else>
                <span v-if="elementValue(row, column)">{{ elementValue(row, column) }}</span>
                <span v-else class="text-disabled">–</span>
              </template>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
  <v-dialog v-model="open" max-width="420">
    <v-card v-if="editor">
      <v-card-title>{{ editorTitle }}</v-card-title>
      <v-card-text>
        <v-select
          v-model="draft.comparison"
          :label="t('comparison')"
          :items="comparisonsFor(editorDataTypeName)"
          class="mb-2"
          hide-details
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="`${comparisonSymbol(item)}  (${item})`"></v-list-item>
          </template>
        </v-select>
        <abacus-value-input
          v-model="draft.value"
          :data-type-name="editorDataTypeName"
          :label="t('value')"
          autofocus
          @keydown.enter="saveOnEnter"
        ></abacus-value-input>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="close">{{ t("cancel") }}</v-btn>
        <v-btn color="primary" :disabled="!canSave || busy" @click="save">{{ t("save") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiCheck, mdiClose, mdiPlus, mdiRefresh } from "@mdi/js";
import AbacusValueInput from "@/components/AbacusValueInput.vue";
import { comparisonSymbol, comparisonsFor } from "@/composables/useAbacusDataTypes";
import type { Argument, Matrix, MatrixConstraint, MatrixElement } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

type Axis = "Row" | "Column";

type Editor = { axis: Axis; index: number };

type Cell = { row: number; column: number };

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const busy: Ref<boolean> = ref(false);
const matrix: Ref<Matrix | null> = ref(null);
const arguments_: Ref<Argument[]> = ref([]);
const constraints: Ref<MatrixConstraint[]> = ref([]);
const elements: Ref<MatrixElement[]> = ref([]);

const editor: Ref<Editor | null> = ref(null);
const draft = reactive({ comparison: "==", value: "" });

const cell: Ref<Cell | null> = ref(null);
const cellValue: Ref<string> = ref("");

const open = computed({
  get: () => editor.value !== null,
  set: (value: boolean) => {
    if (!value) {
      editor.value = null;
    }
  },
});

const rowArgument = computed(() => arguments_.value.find((item) => item.id === matrix.value?.rowArgumentId));
const columnArgument = computed(() =>
  matrix.value?.columnArgumentId
    ? arguments_.value.find((item) => item.id === matrix.value?.columnArgumentId)
    : undefined,
);

const maximumIndex = (axis: Axis) =>
  constraints.value.filter((item) => item.axis === axis).reduce((maximum, item) => Math.max(maximum, item.index), 0);

const rowCount = computed(() => maximumIndex("Row"));
// A matrix without a column argument has a single implicit column.
const columnCount = computed(() => (matrix.value?.columnArgumentId ? maximumIndex("Column") : 1));

const findConstraint = (axis: Axis, index: number) =>
  constraints.value.find((item) => item.axis === axis && item.index === index);

const constraintLabel = (axis: Axis, index: number) => {
  const constraint = findConstraint(axis, index);

  return constraint ? `${comparisonSymbol(constraint.comparison)} ${constraint.value}` : "–";
};

const elementValue = (row: number, column: number) =>
  elements.value.find((item) => item.row === row && item.column === column)?.value ?? "";

// Constraints are compared against the data type of the argument for the axis.
const editorDataTypeName = computed(() => {
  const current = editor.value;

  if (!current) {
    return "Text";
  }

  return (current.axis === "Row" ? rowArgument.value : columnArgument.value)?.dataTypeName ?? "Text";
});

const editorTitle = computed(() => {
  const current = editor.value;

  if (!current) {
    return "";
  }

  const argument = current.axis === "Row" ? rowArgument.value : columnArgument.value;

  return `${argument?.name ?? t(current.axis.toLowerCase())} (${t(current.axis.toLowerCase())} ${current.index})`;
});

const canSave = computed(() => !!draft.value && !!draft.comparison);

const editConstraint = (axis: Axis, index: number) => {
  const existing = findConstraint(axis, index);
  const dataTypeName = (axis === "Row" ? rowArgument.value : columnArgument.value)?.dataTypeName ?? "Text";

  draft.comparison = existing?.comparison ?? comparisonsFor(dataTypeName)[0] ?? "==";
  draft.value = existing?.value ?? "";
  editor.value = { axis, index };
};

const close = () => {
  editor.value = null;
};

const save = async () => {
  const current = editor.value;

  if (!current || !canSave.value || busy.value) {
    return;
  }

  busy.value = true;

  try {
    const constraint: MatrixConstraint = {
      axis: current.axis,
      index: current.index,
      comparison: draft.comparison,
      value: draft.value,
    };

    await abacusApi.post(`v1/matrices/${id}/constraints`, constraint);

    constraints.value = [
      ...constraints.value.filter((item) => !(item.axis === constraint.axis && item.index === constraint.index)),
      constraint,
    ];

    useSnackbarStore().requestSent();

    editor.value = null;
  } finally {
    busy.value = false;
  }
};

const isEditing = (row: number, column: number) => cell.value?.row === row && cell.value?.column === column;

const startEdit = (row: number, column: number) => {
  if (isEditing(row, column)) {
    return;
  }

  cell.value = { row, column };
  cellValue.value = elementValue(row, column);
};

const cancelEdit = () => {
  cell.value = null;
};

// Down the rows first, then on to the first row of the next column.
const nextCell = (current: Cell): Cell | null => {
  if (current.row < rowCount.value) {
    return { row: current.row + 1, column: current.column };
  }

  if (current.column < columnCount.value) {
    return { row: 1, column: current.column + 1 };
  }

  return null;
};

const saveEdit = async () => {
  const current = cell.value;

  if (!current || busy.value) {
    return;
  }

  const value = cellValue.value;

  // An empty or unchanged value is not sent but still moves on so that Enter can be used to step through the cells.
  if (value && value !== elementValue(current.row, current.column)) {
    busy.value = true;

    try {
      const element: MatrixElement = { row: current.row, column: current.column, value };

      await abacusApi.post(`v1/matrices/${id}/elements`, element);

      elements.value = [
        ...elements.value.filter((item) => !(item.row === element.row && item.column === element.column)),
        element,
      ];

      useSnackbarStore().requestSent();
    } finally {
      busy.value = false;
    }
  }

  const next = nextCell(current);

  cell.value = null;

  if (next) {
    startEdit(next.row, next.column);
  }
};

// Enter opens the menu of a select and the picker of a date input, so it only saves for free-entry inputs.
const saveOnEnter = () => {
  if (["Text", "Integer", "Decimal"].includes(editorDataTypeName.value)) {
    save();
  }
};

const refresh = async () => {
  busy.value = true;

  try {
    const [matrixResponse, argumentsResponse, constraintsResponse, elementsResponse] = await Promise.all([
      abacusApi.get<Matrix>(`v1/matrices/${id}`),
      abacusApi.post<Argument[]>("v1/arguments/search", {}),
      abacusApi.get<MatrixConstraint[]>(`v1/matrices/${id}/constraints`),
      abacusApi.get<MatrixElement[]>(`v1/matrices/${id}/elements`),
    ]);

    matrix.value = matrixResponse.data;
    arguments_.value = argumentsResponse.data;
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

<style scoped>
/* Fixed layout so that column widths do not change when a cell switches to its editor. */
.matrix-grid :deep(table) {
  table-layout: fixed;
}

/* Let the field shrink to the cell (inputs have an intrinsic minimum width) and clip whatever still does not fit. */
.matrix-grid td.matrix-cell-editing {
  overflow: hidden;
}

.matrix-cell-editor,
.matrix-cell-editor :deep(.v-input),
.matrix-cell-editor :deep(.v-field),
.matrix-cell-editor :deep(.v-field__field),
.matrix-cell-editor :deep(input) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.matrix-grid col.matrix-grid-row-column {
  width: 10rem;
}

/* The matrix-row / matrix-column colors are defined in the Tailwind theme (src/styles/tailwind.scss). */
.matrix-grid th.matrix-header {
  color: #fff;
}

.matrix-grid th.matrix-header-row {
  background-color: var(--color-matrix-row);
}

.matrix-grid th.matrix-header-column {
  background-color: var(--color-matrix-column);
}

.matrix-grid th.matrix-constraint-row {
  background-color: var(--color-matrix-row-muted);
}

.matrix-grid th.matrix-constraint-column {
  background-color: var(--color-matrix-column-muted);
}
</style>
