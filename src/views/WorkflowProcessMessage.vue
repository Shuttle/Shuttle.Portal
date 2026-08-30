<template>
  <s-form :submit="submit">
    <s-title :title="$t('_workflow.process-message')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.typeName"
      :label="$t('_workflow.type-name')"
      :error-messages="validation.message('typeName')"
    >
    </v-text-field>
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
import type { WorkflowProcessMessage } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";
import { useDrawerStore } from "@/stores/drawer";
import { useI18n } from "vue-i18n";
import { useConfirmationStore } from "@/stores/confirmation";

const { t } = useI18n({ useScope: "global" });
const drawerStore = useDrawerStore();
const confirmationStore = useConfirmationStore();

const props = defineProps<{
  processId: string;
}>();

const busy: Ref<boolean> = ref(false);

const initialState: WorkflowProcessMessage = {
  typeName: "",
};

const state = reactive<WorkflowProcessMessage>({ ...initialState });

const rules = computed(() => {
  return {
    typeName: {
      required,
    },
  };
});

const validation = useValidation(rules, state);

const submit = async () => {
  const errors = await validation.errors();

  if (errors.length) {
    return;
  }

  try {
    busy.value = true;

    await workflowApi.post(`v1/processes/${props.processId}/messages`, state);
    await drawerStore.options.refresh();

    Object.assign(state, initialState);
    confirmationStore.addConfirmationState("state", state);
    useSnackbarStore().requestSent();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  drawerStore.sizeToggleVisible = true;
  confirmationStore.addConfirmationState("state", state);
});
</script>
