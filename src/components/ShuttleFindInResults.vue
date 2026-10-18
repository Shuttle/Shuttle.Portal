<template>
  <div class="flex items-center flex-wrap gap-3 px-4 py-3">
    <s-text-field
      v-model="search"
      density="compact"
      :label="t('find-in-results')"
      :prepend-inner-icon="mdiTextSearch"
      variant="solo-filled"
      flat
      hide-details
      single-line
      clearable
      style="max-width: 420px"
    ></s-text-field>
    <span class="text-caption text-medium-emphasis">
      {{
        (search ?? "").trim()
          ? t("result-count-of", { count: count, total: total })
          : t("result-count", total)
      }}
    </span>
  </div>
  <v-alert
    v-if="limitReached"
    type="info"
    variant="tonal"
    density="compact"
    class="mx-4 mb-3"
  >
    {{ t("maximum-rows-reached", { count: maximumRows }) }}
  </v-alert>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mdiTextSearch } from "@mdi/js";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  // The number of loaded rows that match the find text.
  count: number;
  // The number of loaded rows.
  total: number;
  maximumRows?: number;
}>();

// A clearable input sets its model to null.
const search = defineModel<string | null>({ default: "" });

const { t } = useI18n({ useScope: "global" });

const limitReached = computed(
  () => (props.maximumRows ?? 0) > 0 && props.total >= (props.maximumRows ?? 0),
);
</script>
