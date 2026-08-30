import { recallApi } from "@/api";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { EventStore, EventStoreResponse } from "@/portal";

const STORAGE_KEY = "shuttle-recall.event-store-name";

export const useRecallStore = defineStore("recall", () => {
  const eventStores = ref<EventStore[]>([]);
  const name = ref<string | null>(localStorage.getItem(STORAGE_KEY));

  const selected = computed(() => {
    return eventStores.value.find((item) => item.name === name.value) ?? null;
  });

  const select = (eventStoreName: string) => {
    name.value = eventStoreName;
    localStorage.setItem(STORAGE_KEY, eventStoreName);
  };

  const initialize = async () => {
    const { data } = await recallApi.get<EventStoreResponse<EventStore>>(
      "v1/server/event-stores",
    );

    eventStores.value = data.items;

    if (!eventStores.value.some((item) => item.name === name.value)) {
      const preferred =
        eventStores.value.find((item) => item.hasAccess) ??
        eventStores.value[0];

      if (preferred) {
        select(preferred.name);
      }
    }
  };

  return {
    eventStores,
    name,
    selected,
    initialize,
    select,
  };
});
