<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="$t('events')"></s-title>
    </v-card-title>
    <v-divider></v-divider>
    <s-filter-bar :bar="filterBar" :describe="describeFilter" @refresh="refreshEvents">
      <template v-slot:presets>
        <div class="w-64">
          <v-select v-model="eventStoreName" :label="t('event-store')" :items="recallStore.eventStores"
            item-title="name" item-value="name" :item-props="(item: EventStore) => ({ disabled: !item.hasAccess })"
            density="compact" variant="solo-filled" flat hide-details></v-select>
        </div>
      </template>
      <template v-slot:options>
        <s-maximum-rows v-model="specification.maximumRows" />
      </template>
      <template v-slot:editor="{ filter }">
        <div v-if="filter.key === 'id'" class="p-3">
          <s-text-field v-model="specification.id" :label="t('id')" density="compact" variant="solo-filled" flat
            hide-details clearable autofocus></s-text-field>
        </div>
        <div v-else-if="filter.key === 'sequenceNumber'" class="p-3">
          <s-number-input v-model="specification.sequenceNumberStart" :label="t('sequence-number-start')" :min="0"
            clearable autofocus filter></s-number-input>
        </div>
        <div v-else-if="filter.key === 'eventTypes'" class="p-3">
          <v-autocomplete v-model="specification.eventTypes" :label="t('event-type')" :items="eventTypes"
            item-title="typeName" item-value="typeName" density="compact" variant="solo-filled" multiple chips
            closable-chips flat hide-details clearable autofocus></v-autocomplete>
        </div>
      </template>
    </s-filter-bar>
    <v-divider></v-divider>
    <s-find-in-results v-model="search" :count="displayedItems.length" :total="events.length"
      :maximum-rows="specification.maximumRows" />
    <v-data-table
      :items="displayedItems"
      :headers="headers"
      :mobile="null"
      mobile-breakpoint="md"
      :loading="busy"
      :row-props="rowProps"
      item-selectable
      v-model="selected"
      return-object
      show-select
    >
      <template v-slot:no-data>
        <div class="p-4 text-center">
          <div>{{ t("table-empty") }}</div>
          <s-clear-filters
            v-if="filterBar.hasNonDefaultFilters"
            class="mt-2"
            :bar="filterBar"
          />
        </div>
      </template>
      <template v-slot:header.sequenceNumber>
        #{{ sequenceNumberStartDisplay }}-{{ sequenceNumberEndDisplay }}
      </template>
      <template v-slot:header.action="">
        <s-strip class="my-2">
          <v-btn
            v-if="selected.length"
            :icon="mdiTrashCanOutline"
            size="x-small"
            @click.stop="remove()"
          ></v-btn>
        </s-strip>
      </template>
      <template v-slot:item.primitiveEvent.id="{ item }">
        <span
          class="cursor-pointer"
          v-tooltip="t('filter-by-value', { value: item.primitiveEvent.id })"
          @click.stop="specification.id = item.primitiveEvent.id"
          >{{ item.primitiveEvent.id }}</span
        >
      </template>
      <template v-slot:item.domainEvent="{ item }">
        <div class="flex flex-col gap-2 py-2">
          <v-chip
            class="w-fit"
            size="small"
            v-tooltip="
              t('filter-by-value', { value: item.primitiveEvent.eventType })
            "
            @click.stop="filterByEventType(item.primitiveEvent.eventType)"
            >{{ item.primitiveEvent.eventType }}</v-chip
          >
          <pre class="font-mono font-thin">{{
            JSON.stringify(JSON.parse(item.domainEvent), null, 2)
          }}</pre>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import {
  mdiCounter,
  mdiIdentifier,
  mdiShapeOutline,
  mdiTrashCanOutline,
} from "@mdi/js";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { recallApi } from "@/api";
import type {
  Event,
  EventStore,
  EventStoreResponse,
  EventType,
  EventSpecification,
} from "@/portal";
import { useFilterBar, type FilterDefinition } from "@/composables/useFilterBar";
import { useFindInResults } from "@/composables/useFindInResults";
import { useConfirmationStore } from "@/stores/confirmation";
import { useRecallStore } from "@/stores/recall";

const confirmationStore = useConfirmationStore();
const recallStore = useRecallStore();

const eventStoreName = computed({
  get: () => recallStore.name ?? undefined,
  set: (value?: string) => {
    if (value) {
      recallStore.select(value);
    }
  },
});

const { t } = useI18n({ useScope: "global" });
const busy = ref(false);
const sequenceNumberStartDisplay = ref(0);
const sequenceNumberEndDisplay = ref(0);
const sequenceNumberStart = ref(0);
const specification = reactive<EventSpecification>({ maximumRows: 100 });
const selected: Ref<Event[]> = ref([]);

type FilterKey = "id" | "sequenceNumber" | "eventTypes";

const filterBar = useFilterBar<FilterKey>({
  definitions: [
    { key: "id", title: t("id"), icon: mdiIdentifier },
    {
      key: "sequenceNumber",
      title: t("sequence-number-start"),
      icon: mdiCounter,
    },
    { key: "eventTypes", title: t("event-type"), icon: mdiShapeOutline },
  ],
  hasValue: (key) => {
    switch (key) {
      case "id": {
        return !!specification.id;
      }
      case "sequenceNumber": {
        // A clearable number input sets its model to null.
        return (
          specification.sequenceNumberStart !== null &&
          specification.sequenceNumberStart !== undefined
        );
      }
      case "eventTypes": {
        return (specification.eventTypes?.length ?? 0) > 0;
      }
    }
  },
  clear: (key) => {
    switch (key) {
      case "id": {
        specification.id = undefined;
        break;
      }
      case "sequenceNumber": {
        specification.sequenceNumberStart = undefined;
        break;
      }
      case "eventTypes": {
        specification.eventTypes = undefined;
        break;
      }
    }
  },
});

const describeFilter = (filter: FilterDefinition<FilterKey>) => {
  let value = "";

  switch (filter.key) {
    case "id": {
      value = specification.id ?? "";
      break;
    }
    case "sequenceNumber": {
      value = `${specification.sequenceNumberStart ?? ""}`;
      break;
    }
    case "eventTypes": {
      const types = specification.eventTypes ?? [];

      value =
        types.length > 2
          ? `${types.slice(0, 2).join(", ")} (+${types.length - 2})`
          : types.join(", ");
      break;
    }
  }

  return value ? `${filter.title}: ${value}` : filter.title;
};

const filterByEventType = (eventType: string) => {
  const types = specification.eventTypes ?? [];

  if (!types.includes(eventType)) {
    specification.eventTypes = [...types, eventType];
  }
};

const headers: any = [
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
  },
  {
    title: "#",
    key: "sequenceNumber",
    value: "primitiveEvent.sequenceNumber",
    headerProps: {
      class: "w-2 whitespace-nowrap",
    },
    cellProps: {
      class: "py-2",
    },
  },
  {
    title: t("id"),
    value: "primitiveEvent.id",
    headerProps: {
      class: "w-80",
    },
    cellProps: {
      class: "py-2",
    },
  },
  {
    title: t("version"),
    value: "primitiveEvent.version",
    headerProps: {
      class: "w-2",
    },
    cellProps: {
      class: "py-2",
    },
  },
  {
    title: t("recorded-at"),
    value: "primitiveEvent.recordedAt",
    headerProps: {
      class: "w-16 whitespace-nowrap",
    },
    cellProps: {
      class: "py-2 whitespace-nowrap",
    },
  },
  {
    title: t("domain-event"),
    key: "domainEvent",
    // Only used to sort and find, since the cell is rendered by the slot.
    value: (item: Event) =>
      `${item.primitiveEvent.eventType} ${item.domainEvent}`,
  },
];

const rowProps = () => {
  return {
    class: {
      "align-top": true,
    },
  };
};

const events: Ref<Event[]> = ref([]);
const eventTypes: Ref<EventType[]> = ref([]);

const { search, displayedItems } = useFindInResults(events, headers);

let latestRequest = 0;

const refreshEvents = async () => {
  const request = ++latestRequest;

  busy.value = true;

  try {
    const { data } = await recallApi.post<EventStoreResponse<Event>>(
      "/events/search",
      { ...specification, id: specification.id || undefined },
    );

    // Filters are applied as they change, so a slower, earlier response should not replace a later one.
    if (request !== latestRequest) {
      return;
    }

    events.value = data.items;

    if (events.value.length > 0) {
      sequenceNumberStartDisplay.value =
        events.value[0].primitiveEvent.sequenceNumber;
      sequenceNumberEndDisplay.value =
        events.value[events.value.length - 1].primitiveEvent.sequenceNumber;
      sequenceNumberStart.value = sequenceNumberEndDisplay.value + 1;
    }
  } finally {
    if (request === latestRequest) {
      busy.value = false;
    }
  }
};

const refreshDebounced = useDebounceFn(refreshEvents, 400);

watch(specification, refreshDebounced, { deep: true });

const refreshEventTypes = async () => {
  busy.value = true;

  eventTypes.value = [];

  try {
    const { data } = await recallApi.post<EventStoreResponse<EventType>>(
      "/event-types/search",
      {},
    );

    eventTypes.value = data.items;
  } finally {
    busy.value = false;
  }
};

const remove = async () => {
  if (
    !selected.value.length ||
    !(await confirmationStore.show({ messageKey: "_confirmation.remove" }))
      .confirmed
  ) {
    return;
  }

  busy.value = true;

  eventTypes.value = [];

  try {
    const { data } = await recallApi.post("/events/delete", {
      sequenceNumbers:
        selected.value?.map(
          (item: Event) => item.primitiveEvent?.sequenceNumber,
        ) ?? [],
    });

    eventTypes.value = data.items;
  } finally {
    busy.value = false;
  }

  await refreshEvents();
};

watch(
  () => recallStore.name,
  () => {
    refreshEvents();
    refreshEventTypes();
  },
);

onMounted(() => {
  refreshEvents();
  refreshEventTypes();
});
</script>
