<template>
  <s-form :submit="submit">
    <s-title :title="$t('process')" close-drawer type="borderless" />
    <div class="flex gap-4" :class="getClasses">
      <div class="w-full">
        <WorkflowProcessDefinition v-model="state.name" @process-definition-selected="processDefinitionSelected"
          :error-messages="validation.message('name')"></WorkflowProcessDefinition>
        <v-text-field v-model="state.key" :label="$t('key')"> </v-text-field>
        <v-text-field v-model="state.description" :label="$t('description')"> </v-text-field>
        <s-date-input v-model="deferredTillDate" :label="$t('deferred-till')"></s-date-input>
        <s-time-picker v-model="deferredTillTime" :label="$t('deferred-till-time')"></s-time-picker>
      </div>
      <div class="w-full">
        <div>{{ $t("state-items") }}</div>
        <WorkflowStateItemsEditor v-model="state.stateItems" hide-state-items />
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <s-btn-alert type="submit" :disabled="busy" :validation="validation">{{
        $t("save")
      }}</s-btn-alert>
    </div>
  </s-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { workflowApi } from "@/api";
import type {
  WorkflowProcess,
  WorkflowProcessDefinition,
  RegisterWorkflowProcess,
} from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";
import { useDrawerStore } from "@/stores/drawer";
import { useConfirmationStore } from "@/stores/confirmation";

const drawerStore = useDrawerStore();
const confirmationStore = useConfirmationStore();

const props = defineProps<{
  id?: string;
}>();

const busy: Ref<boolean> = ref(false);

const initialState: RegisterWorkflowProcess = {
  name: "",
  key: "",
  stateItems: [],
  wait: true,
};

const state = reactive<RegisterWorkflowProcess>({ ...initialState });

const deferredTillDate = ref<Date | null>(null);
const deferredTillTime = ref<string | null>(null);

const setDeferredTillParts = (value?: Date) => {
  if (!value) {
    deferredTillDate.value = null;
    deferredTillTime.value = null;
    return;
  }

  const date = new Date(value);

  deferredTillDate.value = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  deferredTillTime.value = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

watch([deferredTillDate, deferredTillTime], () => {
  if (!deferredTillDate.value) {
    state.deferredTill = undefined;
    return;
  }

  const combined = new Date(deferredTillDate.value);

  if (deferredTillTime.value) {
    const [hours, minutes] = deferredTillTime.value.split(":").map(Number);
    combined.setHours(hours, minutes, 0, 0);
  } else {
    combined.setHours(0, 0, 0, 0);
  }

  state.deferredTill = combined;
});

const processDefinitionSelected = (
  selectedProcessDefinition: WorkflowProcessDefinition,
) => {
  state.stateItems = state.stateItems?.filter((item) => !item.required) ?? [];

  if (!selectedProcessDefinition.stateItems) {
    return;
  }

  const requiredItems = selectedProcessDefinition.stateItems.map((item) => ({
    ...item,
    required: true,
  }));
  state.stateItems = [...state.stateItems, ...requiredItems];
};

const rules = computed(() => {
  return {
    name: {
      required,
    },
  };
});

const validation = useValidation(rules, state);

const getClasses = computed(() => {
  return drawerStore.size === "compact" ? "flex-col" : "flex-row";
});

const submit = async () => {
  const errors = await validation.errors();

  if (errors.length) {
    return;
  }

  try {
    busy.value = true;

    await workflowApi.post("v1/processes", state);
    await drawerStore.options.refresh();

    Object.assign(state, initialState);
    setDeferredTillParts(undefined);
    confirmationStore.addConfirmationState("process", state);
    useSnackbarStore().requestSent();
    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  drawerStore.sizeToggleVisible = true;
  confirmationStore.addConfirmationState("process", state);

  if (!props.id) {
    return;
  }

  busy.value = true;

  try {
    const response = await workflowApi.get<WorkflowProcess>(
      "v1/processes/" + props.id,
    );

    Object.assign(state, response.data);
    setDeferredTillParts(response.data.deferredTill);

    state.stateItems = response.data.state?.items;

    if (state.stateItems) {
      state.stateItems.forEach((item, index) => {
        item.id = index + 1;
      });
    }
    confirmationStore.addConfirmationState("process", state);
  } finally {
    busy.value = false;
  }
});
</script>
