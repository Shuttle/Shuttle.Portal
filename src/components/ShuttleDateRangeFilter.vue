<template>
  <div>
    <div class="flex flex-wrap gap-1 p-2">
      <v-chip
        v-for="preset in dateRangePresets"
        :key="preset"
        size="small"
        variant="outlined"
        @click="applyPreset(preset)"
      >
        {{ t(`date-range-presets.${preset}`) }}
      </v-chip>
      <v-spacer></v-spacer>
      <v-btn
        size="small"
        variant="text"
        :disabled="!from && !to"
        @click="clear"
        >{{ t("clear") }}</v-btn
      >
    </div>
    <v-divider></v-divider>
    <v-date-picker
      v-model="pickerDates"
      multiple="range"
      :max="max"
      hide-header
      show-adjacent-months
      elevation="0"
    ></v-date-picker>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  dateRangePresets,
  pickerDatesToRange,
  presetToRange,
  rangeToPickerDates,
  type DateRange,
  type DateRangePreset,
} from "@/composables/useDateRange";

type Props = {
  max?: Date;
};

withDefaults(defineProps<Props>(), {
  max: () => new Date(),
});

const { t } = useI18n({ useScope: "global" });

// The inclusive start and exclusive end of the range, as ISO date-time strings.
const from = defineModel<string | undefined>("from");
const to = defineModel<string | undefined>("to");

const setRange = (range: DateRange | undefined) => {
  from.value = range?.from.toISOString();
  to.value = range?.toExclusive.toISOString();
};

const pickerDates = computed<Date[]>({
  get: () => rangeToPickerDates(from.value, to.value),
  set: (dates) => setRange(pickerDatesToRange(dates)),
});

const applyPreset = (preset: DateRangePreset) => {
  setRange(presetToRange(preset));
};

const clear = () => {
  setRange(undefined);
};
</script>
