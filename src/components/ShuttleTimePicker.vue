<template>
  <div v-if="type === 'Default'">
    <v-label v-if="label" class="mb-1" :text="label"></v-label>
    <v-time-picker v-bind="mergedProps" v-model="model">
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
        <slot :name="name" v-bind="slotData"></slot>
      </template>
    </v-time-picker>
    <v-messages v-if="messages.length" :messages="messages" color="error" active></v-messages>
  </div>

  <v-text-field
    v-else
    :model-value="model"
    :label="label"
    :prepend-inner-icon="mdiClockTimeFourOutline"
    :error-messages="messages"
    readonly
  >
    <v-menu
      v-if="type === 'Menu'"
      v-model="showOverlay"
      :close-on-content-click="false"
      activator="parent"
      min-width="0"
    >
      <v-time-picker v-bind="mergedProps" v-model="model">
        <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
          <slot :name="name" v-bind="slotData"></slot>
        </template>
      </v-time-picker>
    </v-menu>

    <v-dialog v-else v-model="showOverlay" activator="parent" width="auto">
      <v-time-picker v-bind="mergedProps" v-model="model">
        <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
          <slot :name="name" v-bind="slotData"></slot>
        </template>
      </v-time-picker>
    </v-dialog>
  </v-text-field>
</template>

<script lang="ts" setup>
import { computed, ref, useAttrs } from "vue";
import { mdiClockTimeFourOutline } from "@mdi/js";

type PickerType = "Default" | "Menu" | "Dialog";

type Props = {
  label?: string;
  errorMessages?: string | string[];
  type?: PickerType;
};

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<Props>(), {
  type: "Menu",
});

const model = defineModel<string | null>();

const attrs = useAttrs();

const showOverlay = ref(false);

const baseDefaults = computed(() => {
  return props.type === "Default"
    ? ({ format: "24hr", variant: "input", hideHeader: true } as const)
    : ({} as const);
});

const mergedProps = computed(() => {
  return { ...baseDefaults.value, ...attrs };
});

const messages = computed(() => {
  if (!props.errorMessages) {
    return [];
  }

  return Array.isArray(props.errorMessages)
    ? props.errorMessages
    : [props.errorMessages];
});
</script>
