<template>
  <v-btn
    :prepend-icon="mdiFilterRemoveOutline"
    size="small"
    variant="outlined"
    rounded
    color="secondary"
    @click="bar.clearFilters()"
  >
    {{ t("clear-filters") }}
  </v-btn>
</template>

<script setup lang="ts" generic="K extends string">
import { mdiFilterRemoveOutline } from "@mdi/js";
import { useI18n } from "vue-i18n";
import type { FilterBar } from "@/composables/useFilterBar";

defineProps<{
  bar: FilterBar<K>;
}>();

const { t } = useI18n({ useScope: "global" });
</script>
