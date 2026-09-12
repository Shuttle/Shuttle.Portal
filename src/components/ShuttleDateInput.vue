<template>
  <v-date-input v-bind="mergedProps" autocomplete="off">
    <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
      <slot :name="name" v-bind="slotData"></slot>
    </template>
  </v-date-input>
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

const baseDefaults = {
  prependIcon: "",
  prependInnerIcon: "$calendar",
  clearable: true,
  hideDetails: true,
} as const;

const filterDefaults = {
  density: "compact",
  variant: "solo-filled",
  flat: true,
  singleLine: true,
} as const;

const mergedProps = computed(() => {
  return props.filter
    ? { ...baseDefaults, ...filterDefaults, ...attrs }
    : { ...baseDefaults, ...attrs };
});
</script>
