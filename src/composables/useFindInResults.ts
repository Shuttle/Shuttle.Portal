import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";

type Header = {
  key?: string;
  value?: string | ((item: any) => unknown);
  filterable?: boolean;
};

const resolvePath = (item: unknown, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (value, part) =>
        value === null || value === undefined
          ? undefined
          : (value as Record<string, unknown>)[part],
      item,
    );

// Narrows the rows that have already been loaded; it does not query the server.
// Matches against the displayed (formatted) column values, the same as the data table would.
export function useFindInResults<T>(
  items: Ref<T[]>,
  headers: MaybeRefOrGetter<Header[]>,
) {
  const search = ref<string | null>("");
  const searchText = computed(() => (search.value ?? "").trim().toLowerCase());

  const matchesSearch = (item: T) =>
    toValue(headers).some((header) => {
      const field = header.value ?? header.key;

      if (header.filterable === false || !field) {
        return false;
      }

      const value =
        typeof field === "function" ? field(item) : resolvePath(item, field);

      return (
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(searchText.value)
      );
    });

  const displayedItems = computed(() =>
    searchText.value ? items.value.filter(matchesSearch) : items.value,
  );

  return { search, searchText, displayedItems };
}
