<template>
  <v-select
    v-if="dataTypeName === 'Boolean'"
    v-model="model"
    :label="label"
    :items="booleanItems"
    :autofocus="autofocus"
    hide-details
  >
    <template v-if="$slots['append-inner']" v-slot:append-inner><slot name="append-inner"></slot></template>
  </v-select>
  <s-date-input
    v-else-if="dataTypeName === 'DateTime'"
    v-model="dateModel"
    :label="label"
    :autofocus="autofocus"
  >
    <template v-if="$slots['append-inner']" v-slot:append-inner><slot name="append-inner"></slot></template>
  </s-date-input>
  <v-text-field
    v-else-if="dataTypeName === 'Integer' || dataTypeName === 'Decimal'"
    v-model="model"
    type="number"
    :step="dataTypeName === 'Integer' ? 1 : 'any'"
    :label="label"
    :autofocus="autofocus"
    hide-details
  >
    <template v-if="$slots['append-inner']" v-slot:append-inner><slot name="append-inner"></slot></template>
  </v-text-field>
  <v-text-field v-else v-model="model" :label="label" :autofocus="autofocus" hide-details>
    <template v-if="$slots['append-inner']" v-slot:append-inner><slot name="append-inner"></slot></template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  dataTypeName: string;
  label?: string;
  autofocus?: boolean;
}>();

const model = defineModel<string>({ default: "" });

const { t } = useI18n({ useScope: "global" });

const booleanItems = computed(() => [
  { title: t("yes"), value: "true" },
  { title: t("no"), value: "false" },
]);

const pad = (value: number) => String(value).padStart(2, "0");

// DateTime values are exchanged as ISO dates (yyyy-MM-dd), which the server parses using the invariant culture.
const dateModel = computed<Date | null>({
  get: () => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(model.value);

    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  },
  set: (value) => {
    model.value = value ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` : "";
  },
});
</script>
