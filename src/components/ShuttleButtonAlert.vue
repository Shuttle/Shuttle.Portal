<template>
  <v-btn
    v-bind="attrs"
    :type="props.type"
    :prepend-icon="getIcon"
    :disabled="props.disabled"
    variant="tonal"
  >
    <slot></slot>
    <v-tooltip activator="parent" location="start" v-if="getTooltip">{{
      getTooltip
    }}</v-tooltip>
  </v-btn>
</template>

<script setup lang="ts">
import { mdiAlert } from "@mdi/js";
import { useI18n } from "vue-i18n";
import { computed, ref, watch, useAttrs } from "vue";
import type { ValidationComposable } from "@/composables/useValidation";

defineOptions({ inheritAttrs: false });

const { t } = useI18n({ useScope: "global" });
const attrs = useAttrs();

const props = defineProps<{
  type?: string;
  showAlert?: boolean;
  disabled?: boolean;
  alertTooltip?: string;
  validation?: ValidationComposable;
}>();

const hasValidationErrors = ref(false);

watch(
  () => props.validation?.v$.value.$errors,
  (errors) => {
    hasValidationErrors.value = !!errors?.length;
  },
  { deep: true, immediate: true },
);

const hasAlert = computed(() => props.showAlert || hasValidationErrors.value);

const getTooltip = computed(() => {
  return hasAlert.value
    ? (props.alertTooltip ?? t("_system-messages.alert-button-tooltip"))
    : undefined;
});

const getIcon = computed(() => {
  return hasAlert.value ? mdiAlert : undefined;
});
</script>
