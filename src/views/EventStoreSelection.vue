<template>
  <s-container size="small" class="p-4">
    <s-title :title="$t('event-store-selection')"></s-title>
    <div class="flex flex-col gap-2">
      <v-btn
        v-for="eventStore in recallStore.eventStores"
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
import { useRecallStore } from "@/stores/recall";
import router from "@/router";
import type { EventStore } from "@/portal";

const recallStore = useRecallStore();

const select = (eventStore: EventStore) => {
  if (!eventStore.hasAccess) {
    return;
  }

  recallStore.select(eventStore.name);

  router.push({ name: "dashboard" });
};
</script>
