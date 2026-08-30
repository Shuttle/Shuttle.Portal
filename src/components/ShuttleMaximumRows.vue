<template>
  <v-select
    v-model="maximumRows"
    :items="maximumRowItems"
    :label="t('maximum-rows')"
    variant="solo-filled"
    flat
    hide-details
  ></v-select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });

const props = withDefaults(
  defineProps<{
    allowAll?: boolean;
    modelValue?: number;
  }>(),
  {
    allowAll: false,
    modelValue: 100,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const maximumRowItems = computed(() => {
  const result: number[] = [];

  if (props.allowAll) {
    result.push(0);
  }

  result.push(100, 250, 500, 1000);

  return result;
});

const maximumRows = computed({
  get: () => props.modelValue,
  set: (value: number) => emit("update:modelValue", value),
});
</script>
