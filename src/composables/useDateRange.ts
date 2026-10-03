import { useDateFormatter } from "@/composables/useDateFormatter";

export type DateRangePreset = "today" | "last7" | "last30" | "thisMonth";

export type TimePrecision = "Day" | "Hour" | "Minute" | "Second";

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

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const addDays = (value: Date, days: number) => {
  const result = new Date(value);

  result.setDate(result.getDate() + days);

  return result;
};

// Removes everything smaller than the precision, e.g. "Minute" removes the seconds and milliseconds.
export const truncateToPrecision = (
  value: Date,
  precision: TimePrecision,
): Date => {
  const result = new Date(value);

  switch (precision) {
    case "Hour": {
      result.setMinutes(0, 0, 0);
      break;
    }
    case "Minute": {
      result.setSeconds(0, 0);
      break;
    }
    case "Second": {
      result.setMilliseconds(0);
      break;
    }
    default: {
      result.setHours(0, 0, 0, 0);
    }
  }

  return result;
};

export const addPrecisionUnits = (
  value: Date,
  precision: TimePrecision,
  units: number,
): Date => {
  const result = new Date(value);

  switch (precision) {
    case "Hour": {
      result.setHours(result.getHours() + units);
      break;
    }
    case "Minute": {
      result.setMinutes(result.getMinutes() + units);
      break;
    }
    case "Second": {
      result.setSeconds(result.getSeconds() + units);
      break;
    }
    default: {
      result.setDate(result.getDate() + units);
    }
  }

  return result;
};

export const toPrecision = (
  value: Date | string | null | undefined,
  precision: TimePrecision,
): Date | undefined =>
  value ? truncateToPrecision(new Date(value), precision) : undefined;

// Converts the stored end into the inclusive end shown to the user; an exclusive end is one unit after it.
export const toInclusiveEnd = (
  value: Date | string | null | undefined,
  precision: TimePrecision,
  exclusive: boolean,
): Date | undefined => {
  const end = toPrecision(value, precision);

  return end && exclusive ? addPrecisionUnits(end, precision, -1) : end;
};

// Converts the inclusive end selected by the user into the value to store.
export const toStoredEnd = (
  value: Date,
  precision: TimePrecision,
  exclusive: boolean,
): Date => {
  const end = truncateToPrecision(value, precision);

  return exclusive ? addPrecisionUnits(end, precision, 1) : end;
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

export const formatToPrecision = (
  value: Date | string | null | undefined,
  precision: TimePrecision,
): string | null => {
  const formatter = useDateFormatter(value);

  switch (precision) {
    case "Hour": {
      const dateTime = formatter.dateTime();

      return dateTime ? `${dateTime.slice(0, 13)}:00` : null;
    }
    case "Minute": {
      return formatter.dateTime()?.slice(0, 16) ?? null;
    }
    case "Second": {
      return formatter.dateTime();
    }
    default: {
      return formatter.date();
    }
  }
};

export type DescribeDateRangeOptions = {
  precision?: TimePrecision;
  toExclusive?: boolean;
};

export const describeDateRange = (
  from: Date | string | null | undefined,
  to: Date | string | null | undefined,
  options: DescribeDateRangeOptions = {},
): string => {
  const precision = options.precision ?? "Day";
  const start = formatToPrecision(from, precision);
  const end = formatToPrecision(
    toInclusiveEnd(to, precision, options.toExclusive ?? false),
    precision,
  );

  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }

  if (start) {
    return `${start} –`;
  }

  return end ? `– ${end}` : "";
};
