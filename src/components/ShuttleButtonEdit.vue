<template>
  <v-btn
    v-if="shouldShow()"
    v-bind="props"
    :icon="mdiPencil"
    v-tooltip="t('edit')"
    size="x-small"
    @click.stop="emit('click', $event)"
  >
  </v-btn>
</template>

<script setup lang="ts">
import { useSessionStore } from "@/stores/session";
import { mdiPencil } from "@mdi/js";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });
const sessionStore = useSessionStore();

const props = defineProps<{
  permission?: string;
}>();

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const shouldShow = () => {
  return !props.permission || sessionStore.hasPermission(props.permission);
};
</script>
