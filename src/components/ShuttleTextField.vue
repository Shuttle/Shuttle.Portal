<template>
  <v-text-field autocomplete="off" v-bind="mergedProps">
    <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
      <slot :name="name" v-bind="slotData"></slot>
    </template>
  </v-text-field>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from "vue";

type Props = {
  filter?: boolean;
};

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<Props>(), {
  filter: false,
});

const attrs = useAttrs();

const filterDefaults = {
  density: "compact",
  variant: "solo-filled",
  flat: true,
  hideDetails: true,
  singleLine: true,
} as const;

const mergedProps = computed(() => {
  return props.filter ? { ...filterDefaults, ...attrs } : attrs;
});
</script>
