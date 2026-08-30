<template>
  <s-form :submit="submit">
    <s-title :title="$t('_workflow.state-items')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.key"
      :label="$t('key')"
      readonly
      variant="outlined"
      density="compact"
    >
    </v-text-field>
    <WorkflowStateItemsEditor v-model="stateItems" :state-items="state.items" />
    <div class="flex justify-end mt-4">
      <s-btn-alert :disabled="busy">{{ $t("save") }}</s-btn-alert>
    </div>
  </s-form>
</template>

<script setup lang="ts">
import { workflowApi } from "@/api";
import type { WorkflowState, WorkflowStateItem } from "@/portal";
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
const state: Ref<WorkflowState> = ref({});
const stateItems: Ref<WorkflowStateItem[]> = ref([]);

const submit = async () => {
  try {
    busy.value = true;

    await workflowApi.patch("v1/states/" + props.id, stateItems.value);
    confirmationStore.removeConfirmationItem("state");
    drawerStore.close();

    useSnackbarStore().requestSent();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  drawerStore.sizeToggleVisible = true;
  confirmationStore.addConfirmationState("state", state);

  if (!props.id) {
    return;
  }

  busy.value = true;

  try {
    const response = await workflowApi.get<WorkflowState>(
      "v1/states/" + props.id,
    );

    state.value = response.data;

    confirmationStore.addConfirmationState("state", state);
  } finally {
    busy.value = false;
  }
});
</script>
