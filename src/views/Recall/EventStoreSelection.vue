<template>
  <s-container size="small" class="p-4">
    <s-title :title="$t('event-store-selection')"></s-title>
    <div class="flex flex-col gap-2">
      <v-btn
        v-for="eventStore in eventStoreStore.eventStores"
        v-bind:key="eventStore.name"
        :disabled="!eventStore.hasAccess"
        class="py-8 px-4 flex flex-row justify-center items-center gap-2 w-full border cursor-pointer"
        @click="select(eventStore)"
      >
        <span>{{ eventStore.name }}</span>
      </v-btn>
    </div>
  </s-container>
</template>

<script setup lang="ts">
import { useEventStoreStore } from "@/stores/eventStore";
import router from "@/router";
import type { EventStore } from "@/portal";

const eventStoreStore = useEventStoreStore();

const select = (eventStore: EventStore) => {
  if (!eventStore.hasAccess) {
    return;
  }

  eventStoreStore.select(eventStore.name);

  router.push({ name: "dashboard" });
};
</script>
