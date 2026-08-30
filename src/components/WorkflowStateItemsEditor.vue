<template>
  <s-strip v-if="!hideStateItems" class="mb-2 overflow-y-auto md:overflow-y-auto">
    <v-select
      :items="stateItemSelectItems"
      v-model="selectedStateItem"
      density="compact"
      variant="solo-filled"
      hide-details
      clearable
    />
    <v-btn
      :icon="mdiTablePlus"
      size="x-small"
      @click.stop="add(selectedStateItem)"
      v-tooltip="t('add')"
      class="mr-auto"
    ></v-btn>
  </s-strip>
  <v-text-field
    v-model="search"
    density="compact"
    :label="$t('search')"
    :prepend-inner-icon="mdiMagnify"
    variant="solo-filled"
    flat
    hide-details
    single-line
    class="mb-2"
  ></v-text-field>
  <v-divider></v-divider>
  <v-data-table
    v-model:search="search"
    disable-sort
    hide-sort
    :items="items"
    :headers="headers"
    :mobile="true"
    :loading="busy"
    :items-per-page="5"
  >
    <template v-slot:footer.prepend="">
      <v-btn
        :icon="mdiPlus"
        size="x-small"
        @click.stop="add(undefined)"
        v-tooltip="t('add')"
        class="mr-auto"
      ></v-btn>
    </template>
    <template v-slot:item.action="{ item }">
      <v-btn
        :disabled="item.required"
        :icon="mdiTrashCanOutline"
        size="x-small"
        @click.stop="remove(item)"
        v-tooltip="t('remove')"
        class="mr-auto"
      ></v-btn>
    </template>
    <template v-slot:item.name="{ item }">
      <v-text-field
        v-model="item.name"
        density="compact"
        :variant="item.required ? 'outlined' : 'solo-filled'"
        :error-messages="item.message"
        :hide-details="!item.message"
        :readonly="item.required"
      >
      </v-text-field>
    </template>
    <template v-slot:item.type="{ item }">
      <v-select
        v-model="item.type"
        :items="types"
        density="compact"
        :variant="item.required ? 'outlined' : 'solo-filled'"
        :error-messages="item.message"
        :hide-details="!item.message"
        :readonly="item.required"
      />
    </template>
    <template v-slot:item.value="{ item }">
      <div v-if="item.type === 'DateTime'">
        <v-date-input
          v-model="item.dateValue"
          @update:model-value="setDateValue(item)"
          density="compact"
          :error-messages="item.message"
          :hide-details="!item.message"
        ></v-date-input>
        <v-text-field
          :model-value="item.timeValue"
          :prepend-icon="mdiClockTimeFourOutline"
          readonly
          hide-details
          density="compact"
        >
          <v-dialog v-model="showDialog" activator="parent" width="auto">
            <v-time-picker
              v-model="item.timeValue"
              @update:model-value="setTimeValue(item)"
            ></v-time-picker>
          </v-dialog>
        </v-text-field>
      </div>
      <v-checkbox
        v-else-if="item.type === 'Boolean'"
        v-model="item.value"
        density="compact"
        true-value="true"
        false-value="false"
      ></v-checkbox>
      <v-text-field
        v-else
        v-model="item.value"
        density="compact"
        variant="solo-filled"
        :error-messages="item.message"
        :hide-details="!item.message"
      ></v-text-field>
    </template>
    <template v-slot:item.effectiveDate="{ item }">
      <v-date-input
        v-model="item.effectiveDate"
        density="compact"
        clearable
        :error-messages="item.message"
        :hide-details="!item.message"
      ></v-date-input>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import {
  mdiClockTimeFourOutline,
  mdiMagnify,
  mdiPlus,
  mdiTablePlus,
  mdiTrashCanOutline,
} from "@mdi/js";
import { useDateFormatter } from "@/composables/useDateFormatter";
import type { WorkflowStateItem } from "@/portal";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });

type ExtendedStateItem = WorkflowStateItem & {
  dateValue?: string;
  timeValue?: string;
};

interface Props {
  modelValue?: ExtendedStateItem[];
  stateItems?: WorkflowStateItem[];
  hideStateItems?: boolean;
}

const { modelValue = [], stateItems = [] } = defineProps<Props>();

const emit = defineEmits(["update:modelValue"]);

const items = computed({
  get: () => modelValue,
  set: (val) => emit("update:modelValue", val),
});

const stateItemSelectItems = computed(() => {
  return stateItems.map((item) => ({
    title: `${item.name}`,
    value: item,
  }));
});

const busy = ref(false);
const showDialog = ref(false);
const search = ref("");
const selectedStateItem: Ref<WorkflowStateItem | undefined> = ref();
const types: string[] = ["String", "DateTime", "Decimal", "Boolean", "Guid"];
let id = 1;

const headers = [
  {
    key: "action",
  },
  {
    title: t("name"),
    key: "name",
  },
  {
    title: t("type"),
    key: "type",
  },
  {
    title: t("value"),
    key: "value",
  },
  {
    title: t("_workflow.effective-date"),
    key: "effectiveDate",
  },
];

const setDateValue = (item: ExtendedStateItem) => {
  if (item.dateValue) {
    item.dateValue = useDateFormatter(item.dateValue).isoDate() ?? undefined;
    item.value = `${item.dateValue}T${item.timeValue ?? "00:00:00"}`;
  } else {
    item.value = undefined;
  }
};

const setTimeValue = (item: ExtendedStateItem) => {
  if (item.timeValue) {
    item.value = `${item.dateValue ?? "1970-01-01"}T${item.timeValue}`;
  } else {
    item.value = undefined;
  }
};

const add = (selectedStateItem?: WorkflowStateItem) => {
  const item = !selectedStateItem
    ? {
        id: id,
        required: false,
        name: "",
        type: "String",
      }
    : {
        id: id,
        required: false,
        name: selectedStateItem.name,
        type: selectedStateItem.type,
        value: selectedStateItem.value,
        effectiveDate: selectedStateItem.effectiveDate,
      };
  id++;
  emit("update:modelValue", [...items.value, item]);
};

const remove = (stateItem: WorkflowStateItem) => {
  items.value = items.value.filter((item) =>
    item.id !== stateItem.id ? item : undefined,
  );
};
</script>
