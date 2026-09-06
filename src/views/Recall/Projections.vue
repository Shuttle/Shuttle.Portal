<template>
  <s-filter-drawer @filter="refreshProjections">
    <v-select v-model="eventStoreName" :label="$t('event-store')" :items="recallStore.eventStores" item-title="name"
      item-value="name" :item-props="(item: EventStore) => ({ disabled: !item.hasAccess })" hide-details></v-select>
    <v-text-field :label="$t('name')" v-model="specification.nameMatch" hide-details></v-text-field>
    <v-text-field :label="$t('sequence-number-start')" v-model="specification.sequenceNumberStart"
      hide-details></v-text-field>
    <v-text-field :label="$t('failure-count-start')" v-model="specification.failureCountStart"
      hide-details></v-text-field>
    <v-select v-model="specification.deferred" :label="$t('deferred')" :items="deferredOptions" item-title="title"
      item-value="value" hide-details clearable></v-select>
    <v-text-field :label="$t('maximum-rows')" v-model="specification.maximumRows" hide-details></v-text-field>
  </s-filter-drawer>
  <v-card flat>
    <v-card-title>
      <s-title :title="$t('projections')"></s-title>
      <div class="mb-2">
        <v-text-field v-model="search" :label="$t('search')" :prepend-inner-icon="mdiMagnify" flat hide-details
          density="compact" single-line></v-text-field>
      </div>
    </v-card-title>
    <v-divider></v-divider>
    <v-data-table :items="projections" :headers="headers" :mobile="null" mobile-breakpoint="md" v-model:search="search"
      :loading="busy">
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
import { mdiMagnify } from "@mdi/js";
import { reactive, type Reactive } from "vue";
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
const search = ref("");
const busy = ref(false);
const specification: Ref<ProjectionSpecification> = ref({});
const projections: Ref<Projection[]> = ref([]);

const deferredOptions = [
  { title: t("yes"), value: true },
  { title: t("no"), value: false },
];

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

const refreshProjections = async () => {
  busy.value = true;

  projections.value = [];

  try {
    const { data } = await recallApi.post<EventStoreResponse<Projection>>(
      "/projections/search",
      specification.value,
    );

    projections.value = data.items;
  } finally {
    busy.value = false;
  }
};

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
