<template>
  <v-btn
    v-if="shouldShow()"
    v-bind="props"
    @click.stop="emit('click', $event)"
    variant="tonal"
  >
    <slot></slot>
  </v-btn>
</template>

<script setup lang="ts">
import { useSessionStore } from "@/stores/session";

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
