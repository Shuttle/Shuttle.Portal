<template>
  <div>
    <!-- "Clear" stays beside the preset chips; only the chips wrap when space runs out. -->
    <div class="flex items-start gap-1 p-2">
      <div class="flex flex-wrap gap-1 min-w-0">
        <v-chip
          v-for="preset in dateRangePresets"
          :key="preset"
          size="small"
          variant="outlined"
          @click="applyPreset(preset)"
        >
          {{ t(`date-range-presets.${preset}`) }}
        </v-chip>
      </div>
      <v-btn
        size="small"
        variant="text"
        rounded
        color="secondary"
        class="shrink-0"
        :disabled="!from && !to"
        @click="clear"
        >{{ t("clear") }}</v-btn
      >
    </div>
    <!-- Each end can be set on its own, which leaves the range open-ended on the other side. -->
    <!-- A grid with fixed columns keeps the date and time inputs of both rows aligned, whatever their values. -->
    <div
      class="grid gap-2 px-2 pb-2"
      :class="
        hasTime ? 'grid-cols-[minmax(0,1fr)_140px]' : 'grid-cols-[minmax(0,1fr)]'
      "
    >
      <s-date-input
        v-model="fromDate"
        :label="t('date-range-from')"
        :max="toDate ?? max ?? undefined"
        :single-line="false"
        filter
      ></s-date-input>
      <div v-if="hasTime" class="min-w-0">
        <s-time-picker
          v-model="fromTime"
          :label="t('date-range-time')"
          v-bind="timePickerProps"
          filter
        ></s-time-picker>
      </div>
      <s-date-input
        v-model="toDate"
        :label="t('date-range-to')"
        :min="fromDate ?? undefined"
        :max="max ?? undefined"
        :single-line="false"
        filter
      ></s-date-input>
      <div v-if="hasTime" class="min-w-0">
        <s-time-picker
          v-model="toTime"
          :label="t('date-range-time')"
          v-bind="timePickerProps"
          filter
        ></s-time-picker>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  dateRangePresets,
  presetToRange,
  toInclusiveEnd,
  toPrecision,
  toStoredEnd,
  truncateToPrecision,
  addPrecisionUnits,
  type DateRangePreset,
  type TimePrecision,
} from "@/composables/useDateRange";

type Props = {
  // Defaults to today; null allows dates in the future.
  max?: Date | null;
  // The smallest unit that may be selected; "Day" shows only the dates.
  precision?: TimePrecision;
  // When set, the "to" model holds the exclusive end: one unit of the precision after the selected end.
  toExclusive?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  max: () => new Date(),
  precision: "Day",
  toExclusive: false,
});

const { t } = useI18n({ useScope: "global" });

// The start (always inclusive) and end of the range, as ISO date-time strings.
const from = defineModel<string | undefined>("from");
const to = defineModel<string | undefined>("to");

const hasTime = computed(() => props.precision !== "Day");

const timePickerProps = computed(() => ({
  useSeconds: props.precision === "Second",
  allowedMinutes: props.precision === "Hour" ? [0] : undefined,
}));

type Time = { hours: number; minutes: number; seconds: number };

const startOfDayTime: Time = { hours: 0, minutes: 0, seconds: 0 };

// The last unit of the day, so that selecting only an end date includes the whole day.
const endOfDayTime = computed<Time>(() => ({
  hours: 23,
  minutes: props.precision === "Hour" ? 0 : 59,
  seconds: props.precision === "Second" ? 59 : 0,
}));

const getTime = (value: Date): Time => ({
  hours: value.getHours(),
  minutes: value.getMinutes(),
  seconds: value.getSeconds(),
});

const combine = (date: Date, time: Time) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    time.seconds,
  );

const parseTime = (value: string): Time => {
  const [hours = 0, minutes = 0, seconds = 0] = value.split(":").map(Number);

  return { hours, minutes, seconds };
};

const formatTime = (value: Date) => {
  const pad = (part: number) => String(part).padStart(2, "0");
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}`;

  return props.precision === "Second"
    ? `${time}:${pad(value.getSeconds())}`
    : time;
};

const startOfDay = (value: Date) => truncateToPrecision(value, "Day");

// The selected start and (inclusive) end, truncated to the precision.
const fromValue = computed(() => toPrecision(from.value, props.precision));
const toValue = computed(() =>
  toInclusiveEnd(to.value, props.precision, props.toExclusive),
);

const setFrom = (value: Date | undefined) => {
  from.value = value
    ? truncateToPrecision(value, props.precision).toISOString()
    : undefined;
};

const setTo = (value: Date | undefined) => {
  to.value = value
    ? toStoredEnd(value, props.precision, props.toExclusive).toISOString()
    : undefined;
};

// Keeps the range in order when a time on the same day would invert it.
const updateFrom = (value: Date | undefined) => {
  setFrom(value);

  if (value && toValue.value && value > toValue.value) {
    setTo(value);
  }
};

const updateTo = (value: Date | undefined) => {
  setTo(value);

  if (value && fromValue.value && value < fromValue.value) {
    setFrom(value);
  }
};

// A clearable date input sets its model to null.
const fromDate = computed<Date | null>({
  get: () => (fromValue.value ? startOfDay(fromValue.value) : null),
  set: (date) =>
    updateFrom(
      date
        ? combine(
            date,
            fromValue.value ? getTime(fromValue.value) : startOfDayTime,
          )
        : undefined,
    ),
});

const fromTime = computed<string | null>({
  get: () => (fromValue.value ? formatTime(fromValue.value) : null),
  set: (time) => {
    if (time) {
      updateFrom(
        combine(fromValue.value ?? startOfDay(new Date()), parseTime(time)),
      );
    }
  },
});

const toDate = computed<Date | null>({
  get: () => (toValue.value ? startOfDay(toValue.value) : null),
  set: (date) =>
    updateTo(
      date
        ? combine(
            date,
            toValue.value ? getTime(toValue.value) : endOfDayTime.value,
          )
        : undefined,
    ),
});

const toTime = computed<string | null>({
  get: () => (toValue.value ? formatTime(toValue.value) : null),
  set: (time) => {
    if (time) {
      updateTo(
        combine(toValue.value ?? startOfDay(new Date()), parseTime(time)),
      );
    }
  },
});

// Presets cover whole days, so the end is the last unit of the final day.
const applyPreset = (preset: DateRangePreset) => {
  const range = presetToRange(preset);

  setFrom(range.from);
  setTo(addPrecisionUnits(range.toExclusive, props.precision, -1));
};

const clear = () => {
  setFrom(undefined);
  setTo(undefined);
};
</script>
