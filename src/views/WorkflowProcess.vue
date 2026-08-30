<template>
  <s-form :submit="submit">
    <s-title :title="$t('process')" close-drawer type="borderless" />
    <div class="flex gap-4" :class="getClasses">
      <div class="w-full">
        <WorkflowProcessDefinition
          v-model="state.name"
          @process-definition-selected="processDefinitionSelected"
          :error-messages="validation.message('name')"
        ></WorkflowProcessDefinition>
        <v-text-field v-model="state.key" :label="$t('key')"> </v-text-field>
        <v-text-field v-model="state.description" :label="$t('description')"> </v-text-field>
        <v-date-input
          prepend-icon=""
          prepend-inner-icon="$calendar"
          v-model="state.deferredTill"
          :label="$t('_workflow.deferred-till')"
          clearable
          hide-details
        ></v-date-input>
      </div>
      <div class="w-full">
        <div>{{ $t("_workflow.state-items") }}</div>
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
import { computed, reactive, ref } from "vue";
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
import { useI18n } from "vue-i18n";
import { useConfirmationStore } from "@/stores/confirmation";

const { t } = useI18n({ useScope: "global" });
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
