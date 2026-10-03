<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('projections')"></s-title>
    </v-card-title>
    <v-divider></v-divider>
    <s-filter-bar :bar="filterBar" :describe="describeFilter" @refresh="refreshProjections">
      <template v-slot:presets>
        <div class="w-64">
          <v-select v-model="eventStoreName" :label="t('event-store')" :items="recallStore.eventStores"
            item-title="name" item-value="name" :item-props="(item: EventStore) => ({ disabled: !item.hasAccess })"
            density="compact" variant="solo-filled" flat hide-details></v-select>
        </div>
        <v-chip-group :model-value="preset" mandatory filter color="primary" @update:model-value="applyPreset">
          <v-chip v-for="item in presets" :key="item.value" :value="item.value" variant="outlined" density="compact"
            :prepend-icon="item.icon">
            {{ item.title }}
          </v-chip>
        </v-chip-group>
      </template>
      <template v-slot:options>
        <s-maximum-rows v-model="specification.maximumRows" />
      </template>
      <template v-slot:editor="{ filter }">
        <div v-if="filter.key === 'name'" class="p-3">
          <v-text-field v-model="specification.nameMatch" :label="t('name')" density="compact" variant="solo-filled"
            flat hide-details clearable autofocus></v-text-field>
        </div>
        <div v-else-if="filter.key === 'sequenceNumber'" class="p-3">
          <s-number-input v-model="specification.sequenceNumberStart" :label="t('sequence-number-start')" :min="0"
            clearable autofocus filter></s-number-input>
        </div>
        <div v-else-if="filter.key === 'failureCount'" class="p-3">
          <s-number-input v-model="specification.failureCountStart" :label="t('failure-count-start')" :min="0"
            clearable autofocus filter></s-number-input>
        </div>
      </template>
    </s-filter-bar>
    <v-divider></v-divider>
    <s-find-in-results v-model="search" :count="displayedItems.length" :total="projections.length"
      :maximum-rows="specification.maximumRows" />
    <v-data-table :items="displayedItems" :headers="headers" :mobile="null" mobile-breakpoint="md" :loading="busy">
      <template v-slot:no-data>
        <div class="p-4 text-center">
          <div>{{ t("table-empty") }}</div>
          <s-clear-filters v-if="filterBar.hasNonDefaultFilters" class="mt-2" :bar="filterBar" />
        </div>
      </template>
      <template v-slot:item.name="{ item }">
        <span class="cursor-pointer" v-tooltip="t('filter-by-value', { value: item.name })"
          @click.stop="specification.nameMatch = item.name">{{ item.name }}</span>
      </template>
      <template v-slot:item.action="{ item }">
        <s-btn-edit @click.stop="edit(item)" />
      </template>
    </v-data-table>
  </v-card>
  <v-dialog v-model="editVisible" max-width="480">
    <v-card>
      <s-form :submit="save" class="p-4">
        <s-title :title="$t('projection')" type="borderless" :close-click="() => (editVisible = false)"></s-title>
        <v-text-field :label="$t('name')" v-model="editState.name" readonly hide-details class="mb-2"></v-text-field>
        <v-text-field :label="$t('sequence-number')" v-model="editState.sequenceNumber" type="number" hide-details
          class="mb-2" :error-messages="validation.message('sequenceNumber')"></v-text-field>
        <v-text-field :label="$t('failure-count')" v-model="editState.failureCount" type="number" hide-details
          class="mb-2" :error-messages="validation.message('failureCount')"></v-text-field>
        <v-text-field :label="$t('deferred-until')" v-model="editState.deferredUntil" type="datetime-local" clearable
          hide-details class="mb-2"></v-text-field>
        <s-strip reverse>
          <s-btn-alert type="submit" :disabled="busy" :validation="validation">{{
            $t("save")
            }}</s-btn-alert>
          <v-btn variant="flat" @click="editVisible = false">{{
            $t("cancel")
            }}</v-btn>
        </s-strip>
      </s-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  mdiAlertCircleOutline,
  mdiCounter,
  mdiFormTextbox,
  mdiPlayCircleOutline,
  mdiTimerSand,
} from "@mdi/js";
import { reactive, type Reactive } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { minValue, required } from "@vuelidate/validators";
import { recallApi } from "@/api";
import type {
  EventStore,
  EventStoreResponse,
  Projection,
  ProjectionSpecification,
} from "@/portal";
import { useRecallStore } from "@/stores/recall";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useFilterBar, type FilterDefinition } from "@/composables/useFilterBar";
import { useFindInResults } from "@/composables/useFindInResults";
import { useValidation } from "@/composables/useValidation";
import { useSnackbarStore } from "@/stores/snackbar";

const recallStore = useRecallStore();

const eventStoreName = computed({
  get: () => recallStore.name ?? undefined,
  set: (value?: string) => {
    if (value) {
      recallStore.select(value);
    }
  },
});

const { t } = useI18n({ useScope: "global" });
const busy = ref(false);
const specification = reactive<ProjectionSpecification>({
  nameMatch: "",
  maximumRows: 100,
});
const projections: Ref<Projection[]> = ref([]);

type FilterKey = "name" | "sequenceNumber" | "failureCount";

// A clearable number input sets its model to null.
const hasNumber = (value?: number | null) =>
  value !== null && value !== undefined;

type PresetValue = "all" | "deferred" | "not-deferred";

const presets: { value: PresetValue; title: string; icon?: string }[] = [
  { value: "all", title: t("all") },
  { value: "deferred", title: t("deferred"), icon: mdiTimerSand },
  {
    value: "not-deferred",
    title: t("not-deferred"),
    icon: mdiPlayCircleOutline,
  },
];

// The selected preset is derived from the specification so that it is never out of step with it.
const preset = computed<PresetValue>(() => {
  switch (specification.deferred) {
    case true: {
      return "deferred";
    }
    case false: {
      return "not-deferred";
    }
    default: {
      return "all";
    }
  }
});

const applyPreset = (value: PresetValue | undefined) => {
  if (!value) {
    return;
  }

  specification.deferred = value === "all" ? undefined : value === "deferred";
};

const filterBar = useFilterBar<FilterKey>({
  definitions: [
    { key: "name", title: t("name"), icon: mdiFormTextbox },
    {
      key: "sequenceNumber",
      title: t("sequence-number-start"),
      icon: mdiCounter,
    },
    {
      key: "failureCount",
      title: t("failure-count-start"),
      icon: mdiAlertCircleOutline,
    },
  ],
  hasValue: (key) => {
    switch (key) {
      case "name": {
        return !!specification.nameMatch;
      }
      case "sequenceNumber": {
        return hasNumber(specification.sequenceNumberStart);
      }
      case "failureCount": {
        return hasNumber(specification.failureCountStart);
      }
    }
  },
  clear: (key) => {
    switch (key) {
      case "name": {
        specification.nameMatch = "";
        break;
      }
      case "sequenceNumber": {
        specification.sequenceNumberStart = undefined;
        break;
      }
      case "failureCount": {
        specification.failureCountStart = undefined;
        break;
      }
    }
  },
  reset: () => applyPreset("all"),
  isDefault: () => preset.value === "all",
});

const describeFilter = (filter: FilterDefinition<FilterKey>) => {
  let value = "";

  switch (filter.key) {
    case "name": {
      value = specification.nameMatch ?? "";
      break;
    }
    case "sequenceNumber": {
      value = hasNumber(specification.sequenceNumberStart)
        ? `${specification.sequenceNumberStart}`
        : "";
      break;
    }
    case "failureCount": {
      value = hasNumber(specification.failureCountStart)
        ? `${specification.failureCountStart}`
        : "";
      break;
    }
  }

  return value ? `${filter.title}: ${value}` : filter.title;
};

const headers: any = [
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
  },
  {
    title: t("name"),
    value: "name",
  },
  {
    title: t("sequence-number"),
    value: "sequenceNumber",
  },
  {
    title: t("failure-count"),
    value: "failureCount",
  },
  {
    title: t("deferred-until"),
    key: "deferredUntil",
    value: (item: Projection) => {
      return useDateFormatter(item.deferredUntil).dateTimeMilliseconds();
    },
  },
];

const { search, displayedItems } = useFindInResults(projections, headers);

let latestRequest = 0;

const refreshProjections = async () => {
  const request = ++latestRequest;

  busy.value = true;

  try {
    const { data } = await recallApi.post<EventStoreResponse<Projection>>(
      "/projections/search",
      specification,
    );

    // Filters are applied as they change, so a slower, earlier response should not replace a later one.
    if (request !== latestRequest) {
      return;
    }

    projections.value = data.items;
  } finally {
    if (request === latestRequest) {
      busy.value = false;
    }
  }
};

const refreshDebounced = useDebounceFn(refreshProjections, 400);

watch(specification, refreshDebounced, { deep: true });

watch(
  () => recallStore.name,
  () => {
    refreshProjections();
  },
);

onMounted(() => {
  refreshProjections();
});

const editVisible = ref(false);

type EditState = {
  name: string;
  sequenceNumber: number;
  failureCount: number;
  deferredUntil: string;
};

const editState: Reactive<EditState> = reactive({
  name: "",
  sequenceNumber: 0,
  failureCount: 0,
  deferredUntil: "",
});

const rules = computed(() => {
  return {
    sequenceNumber: {
      required,
      minValue: minValue(0),
    },
    failureCount: {
      required,
      minValue: minValue(0),
    },
  };
});

const validation = useValidation(rules, editState);

const toDateTimeLocal = (value?: Date | string | null): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMilliseconds = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offsetMilliseconds)
    .toISOString()
    .slice(0, 19);
};

const fromDateTimeLocal = (value: string): string | null => {
  return value ? new Date(value).toISOString() : null;
};

const edit = (item: Projection) => {
  editState.name = item.name;
  editState.sequenceNumber = item.sequenceNumber;
  editState.failureCount = item.failureCount;
  editState.deferredUntil = toDateTimeLocal(item.deferredUntil);

  editVisible.value = true;
};

const save = async () => {
  const errors = await validation.errors();

  if (errors.length) {
    return;
  }

  busy.value = true;

  try {
    await recallApi.post("/projections", {
      name: editState.name,
      sequenceNumber: editState.sequenceNumber,
      failureCount: editState.failureCount,
      deferredUntil: fromDateTimeLocal(editState.deferredUntil),
    });

    useSnackbarStore().requestSent();

    editVisible.value = false;

    await refreshProjections();
  } finally {
    busy.value = false;
  }
};
</script>
