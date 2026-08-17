<template>
  <v-btn
    v-if="shouldShow()"
    v-bind="props"
    :icon="mdiOpenInNew"
    v-tooltip="getTooltip()"
    variant="tonal"
    @click.stop="emit('click', $event)"
    :href="props.url"
    target="_blank"
  >
  </v-btn>
</template>

<script setup lang="ts">
import { useSessionStore } from "@/stores/session";
import { mdiOpenInNew } from "@mdi/js";

const sessionStore = useSessionStore();

type Props = {
  permission?: string;
  tooltip?: string;
  tooltipName?: string;
  tooltipNameOnly?: boolean;
  url: string;
};

const props = withDefaults(defineProps<Props>(), {
  tooltipNameOnly: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const getTooltip = () => {
  if (props.tooltip) {
    return props.tooltip;
  }

  if (props.tooltipName) {
    if (props.tooltipNameOnly) {
      return props.tooltipName;
    }

    return `${props.tooltipName} | ${props.url}`;
  }

  return props.url;
};

const shouldShow = () => {
  return !props.permission || sessionStore.hasPermission(props.permission);
};
</script>
