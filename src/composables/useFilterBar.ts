import { computed, nextTick, reactive, ref, type Ref } from "vue";

export type FilterDefinition<K extends string = string> = {
  key: K;
  title: string;
  icon: string;
  // Date range editors need a wider menu so that the presets and "Clear" fit on one line.
  wide?: boolean;
};

type FilterBarOptions<K extends string> = {
  definitions: FilterDefinition<K>[];
  hasValue: (key: K) => boolean;
  clear: (key: K) => void;
  // Resets the parts of the specification that are not chip filters, such as the presets.
  reset?: () => void;
  // Whether the parts of the specification that are not chip filters have their default values.
  isDefault?: () => boolean;
};

export function useFilterBar<K extends string>(options: FilterBarOptions<K>) {
  // Filters that have been added but do not have a value yet, so that they remain visible while being edited.
  const addedFilters = ref([]) as Ref<K[]>;
  const menus = reactive<Record<string, boolean>>({});

  const visibleFilters = computed(() =>
    options.definitions.filter(
      (filter) =>
        addedFilters.value.includes(filter.key) || options.hasValue(filter.key),
    ),
  );

  const availableFilters = computed(() =>
    options.definitions.filter(
      (filter) => !visibleFilters.value.some((item) => item.key === filter.key),
    ),
  );

  const addFilter = async (key: K) => {
    addedFilters.value.push(key);

    // The chip (and its menu) needs to be rendered before the menu can be opened.
    await nextTick();

    menus[key] = true;
  };

  const setMenu = (key: K, open: boolean) => {
    menus[key] = open;
  };

  const clearFilter = (key: K) => {
    options.clear(key);

    menus[key] = false;
    addedFilters.value = addedFilters.value.filter((item) => item !== key);
  };

  const hasNonDefaultFilters = computed(
    () => visibleFilters.value.length > 0 || !(options.isDefault?.() ?? true),
  );

  const clearFilters = () => {
    options.definitions.forEach((filter) => clearFilter(filter.key));
    options.reset?.();
  };

  // Returned as a reactive object so that the refs are unwrapped when it is passed to the filter bar component.
  return reactive({
    menus,
    visibleFilters,
    availableFilters,
    hasNonDefaultFilters,
    setMenu,
    addFilter,
    clearFilter,
    clearFilters,
  });
}

export type FilterBar<K extends string = string> = ReturnType<
  typeof useFilterBar<K>
>;
