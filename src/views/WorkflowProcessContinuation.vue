<template>
  <s-container
    v-if="busy"
    class="text-lg flex flex-col justify-center items-center p-4 rounded"
    size="medium"
  >
    <v-progress-circular indeterminate></v-progress-circular>
    <span>{{ $t("_workflow.working") }}</span>
  </s-container>
  <s-container v-if="!!responseMessage" size="medium">
    <v-alert :title="responseTitle" :type="responseType" :text="responseMessage" class="mb-2">
    </v-alert>
  </s-container>
</template>

<script setup lang="ts">
import axios from "axios";
import configuration from "@/configuration";
import { Api } from "@/enums";
import type { VAlert } from "vuetify/components";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });
type AlertType = Extract<VAlert["$props"]["type"], string>;

const props = defineProps<{
  id: string;
  token: string;
}>();

const busy: Ref<boolean> = ref(false);
const responseMessage: Ref<string> = ref("");
const responseTitle: Ref<string> = ref("");
const responseType: Ref<AlertType> = ref("success");

onMounted(async () => {
  busy.value = true;

  try {
    await axios.patch(
      configuration.getApiUrl(
        Api.Workflow,
        `v1/processes/${props.id}/continue/${props.token}`,
      ),
    );

    responseTitle.value = t("success");
    responseMessage.value = t("_workflow.process-continuation-success");
  } catch (error: any) {
    responseType.value = "error";
    responseTitle.value = t("error");
    responseMessage.value = t("_workflow.process-continuation-error", {
      error: error.response?.data ?? error.toString(),
    });
  } finally {
    busy.value = false;
  }
});
</script>
