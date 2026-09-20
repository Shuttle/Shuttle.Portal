import { useDateFormatter } from "@/composables/useDateFormatter";

export type DateRangePreset = "today" | "last7" | "last30" | "thisMonth";

export type DateRange = {
  from: Date;
  toExclusive: Date;
};

export const dateRangePresets: DateRangePreset[] = [
  "today",
  "last7",
  "last30",
  "thisMonth",
];

const maximumPickerDays = 3660;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const addDays = (value: Date, days: number) => {
  const result = new Date(value);

  result.setDate(result.getDate() + days);

  return result;
};

export const presetToRange = (
  preset: DateRangePreset,
  now: Date = new Date(),
): DateRange => {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  switch (preset) {
    case "last7": {
      return { from: addDays(today, -6), toExclusive: tomorrow };
    }
    case "last30": {
      return { from: addDays(today, -29), toExclusive: tomorrow };
    }
    case "thisMonth": {
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        toExclusive: tomorrow,
      };
    }
    default: {
      return { from: today, toExclusive: tomorrow };
    }
  }
};

// The picker selects whole days with an inclusive end date, whereas the specification
// uses an inclusive start and an exclusive end.
export const pickerDatesToRange = (
  dates: Date[] | null | undefined,
): DateRange | undefined => {
  if (!dates || dates.length === 0) {
    return undefined;
  }

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  return {
    from: startOfDay(sorted[0]!),
    toExclusive: addDays(startOfDay(sorted[sorted.length - 1]!), 1),
  };
};

export const rangeToPickerDates = (
  from: Date | string | null | undefined,
  toExclusive: Date | string | null | undefined,
): Date[] => {
  if (!from && !toExclusive) {
    return [];
  }

  const start = startOfDay(
    from ? new Date(from) : addDays(new Date(toExclusive!), -1),
  );
  const end = toExclusive
    ? addDays(startOfDay(new Date(toExclusive)), -1)
    : start;
  const result: Date[] = [];

  for (
    let day = start;
    day <= end && result.length < maximumPickerDays;
    day = addDays(day, 1)
  ) {
    result.push(day);
  }

  return result.length > 0 ? result : [start];
};

export const describeDateRange = (
  from: Date | string | null | undefined,
  toExclusive: Date | string | null | undefined,
): string => {
  const start = useDateFormatter(from).date();
  const end = toExclusive
    ? useDateFormatter(addDays(new Date(toExclusive), -1)).date()
    : null;

  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }

  if (start) {
    return `${start} –`;
  }

  return end ? `– ${end}` : "";
};
