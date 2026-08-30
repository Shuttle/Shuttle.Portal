<template>
  <s-form :submit="submit">
    <s-title :title="$t('_workflow.process-abandon')" close-drawer type="borderless" />
    <div class="flex flex-col gap-4">
      <v-text-field
        v-model:model-value="state.name"
        :label="t('name')"
        variant="solo-filled"
        hide-details
        readonly
      />
      <v-text-field
        v-model:model-value="state.key"
        :label="t('key')"
        variant="solo-filled"
        hide-details
        readonly
      />
      <v-divider></v-divider>
      <v-text-field v-model="state.message" :label="$t('_workflow.message')"> </v-text-field>
    </div>
    <div class="flex justify-end mt-4">
      <v-btn type="submit" :disabled="busy">{{ $t("_workflow.abandon") }}</v-btn>
    </div>
  </s-form>
</template>

<script setup lang="ts">
import { workflowApi } from "@/api";
import type { WorkflowProcess, WorkflowProcessStatus } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";
import { useDrawerStore } from "@/stores/drawer";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });
const drawerStore = useDrawerStore();

const props = defineProps<{
  id: string;
}>();

const busy: Ref<boolean> = ref(false);

type State = {
  message: string;
  name: string;
  key?: string;
};

const initialState: State = {
  message: "",
  name: "",
  key: "",
};

const state = reactive<State>({ ...initialState });

const submit = async () => {
  try {
    busy.value = true;

    const body: WorkflowProcessStatus = {
      message: state.message,
    };

    await workflowApi.patch(`v1/processes/${props.id}/abandon`, body);
    drawerStore.close();

    useSnackbarStore().open(t("_workflow.process-abandoned"));
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  busy.value = true;

  try {
    const response = await workflowApi.get<WorkflowProcess>(
      "v1/processes/" + props.id,
    );

    state.name = response.data.name ?? "";
    state.key = response.data.key;
  } finally {
    busy.value = false;
  }
});
</script>
