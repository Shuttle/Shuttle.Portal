<template>
  <s-form :submit="submit">
    <s-title :title="$t('state')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.key"
      :label="$t('key')"
      :error-messages="validation.message('key')"
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
import type { WorkflowState } from "@/portal";
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

const initialState: WorkflowState = {
  key: "",
};
const state = reactive<WorkflowState>({ ...initialState });

const rules = computed(() => {
  return {
    key: {
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

    if (props.id) {
      await workflowApi.put("v1/states/" + props.id, state);
      confirmationStore.removeConfirmationItem("state");
      drawerStore.close();
    } else {
      await workflowApi.post("v1/states", state);
      await drawerStore.options.refresh();

      Object.assign(state, initialState);
      confirmationStore.addConfirmationState("state", state);
    }

    useSnackbarStore().requestSent();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  drawerStore.sizeToggleVisible = false;
  confirmationStore.addConfirmationState("state", state);

  if (!props.id) {
    return;
  }

  busy.value = true;

  try {
    const response = await workflowApi.get<WorkflowState>(
      "v1/states/" + props.id,
    );

    Object.assign(state, response.data);
    confirmationStore.addConfirmationState("state", state);
  } finally {
    busy.value = false;
  }
});
</script>
