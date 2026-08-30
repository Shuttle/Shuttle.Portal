<template>
  <v-autocomplete
    v-model="selectedName"
    :items="names"
    :label="$t('_workflow.process-definition')"
    :loading="loading"
  ></v-autocomplete>
</template>

<script setup lang="ts">
import { workflowApi } from "@/api";
import type { WorkflowProcessDefinition } from "@/portal";

const emit = defineEmits(["update:modelValue", "processDefinitionSelected"]);

const loading = ref(true);

interface Props {
  modelValue?: string;
}

const props = defineProps<Props>();

const processDefinitions: Ref<WorkflowProcessDefinition[]> = ref([]);

const names = computed(() => {
  const result = ["."];

  result.push(...processDefinitions.value.map((item) => item.name));

  return result;
});

const selectedName = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit("update:modelValue", val);
    emit(
      "processDefinitionSelected",
      val === "."
        ? { name: "." }
        : processDefinitions.value.find((item) => item.name === val),
    );
  },
});

onMounted(async () => {
  try {
    const response = await workflowApi.post<WorkflowProcessDefinition[]>(
      "/v1/process-definitions/search",
      {},
    );

    if (!response || !response.data) {
      return;
    }

    processDefinitions.value = response.data;
  } finally {
    loading.value = false;
  }
});
</script>
