<template>
  <form
    @submit.prevent="props.submit()"
    class="w-full mx-auto ease-in duration-300 p-2"
    :class="getClasses()"
  >
    <slot></slot>
  </form>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    size?: "small" | "medium" | "large" | "full";
    submit?: () => void;
  }>(),
  {
    submit: () => {},
    size: "full",
  },
);

const getClasses = () => {
  const classes: string[] = [];

  switch (props.size) {
    case "small": {
      classes.push("lg:w-1/4 md:w-2/4");
      break;
    }
    case "medium": {
      classes.push("lg:w-2/4 md:w-3/4");
      break;
    }
    case "large": {
      classes.push("lg:w-3/4");
      break;
    }
  }

  return classes;
};
</script>
