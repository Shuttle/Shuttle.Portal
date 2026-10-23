<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-96px)] px-4 py-8">
    <v-card class="w-full max-w-md" rounded="xl" elevation="8">
      <div class="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
      <v-card-item class="pt-8 px-8 text-center">
        <div class="flex justify-center mb-4">
          <v-avatar color="primary" variant="tonal" size="64">
            <v-icon :icon="`svg:${mdiDomain}`" size="36"></v-icon>
          </v-avatar>
        </div>
        <div class="text-2xl font-semibold">{{ $t("tenant-selection") }}</div>
        <div class="text-sm text-medium-emphasis mt-1">
          {{ $t("tenant-selection-subtitle", { identityName: sessionStore.identityName ?? "" }) }}
        </div>
      </v-card-item>
      <v-card-text class="px-8 pb-8 pt-4">
        <s-text-field v-if="sessionStore.tenants.length > searchThreshold" v-model="search"
          :prepend-inner-icon="`svg:${mdiMagnify}`" :label="$t('search')" variant="outlined" rounded="lg"
          density="comfortable" hide-details clearable autofocus class="mb-4">
        </s-text-field>
        <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          <v-card v-for="tenant in filteredTenants" v-bind:key="tenant.id" variant="outlined" rounded="lg"
            :color="tenant.id === sessionStore.tenantId ? 'primary' : undefined" @click="select(tenant)">
            <div class="flex items-center gap-4 px-4 py-3">
              <v-avatar color="primary" variant="tonal" size="40" class="font-semibold">
                {{ getInitials(tenant.name) }}
              </v-avatar>
              <div class="grow min-w-0 truncate font-medium text-high-emphasis">{{ tenant.name }}</div>
              <v-icon v-if="tenant.id === sessionStore.tenantId" :icon="`svg:${mdiCheckCircle}`" color="primary"></v-icon>
              <v-icon v-else :icon="`svg:${mdiChevronRight}`" class="text-medium-emphasis"></v-icon>
            </div>
          </v-card>
          <div v-if="filteredTenants.length === 0" class="text-center text-sm text-medium-emphasis py-4">
            {{ $t("result-count", 0) }}
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { mdiCheckCircle, mdiChevronRight, mdiDomain, mdiMagnify } from "@mdi/js";
import { computed, ref } from "vue";
import { useSessionStore } from "@/stores/session";
import router from "@/router";
import type { Tenant } from "@/portal";

const sessionStore = useSessionStore();

const searchThreshold = 6;
const search = ref("");

const filteredTenants = computed(() => {
  const value = (search.value ?? "").trim().toLowerCase();

  return value
    ? sessionStore.tenants.filter((tenant) => tenant.name.toLowerCase().includes(value))
    : sessionStore.tenants;
});

const getInitials = (name: string) => {
  return name
    .split(/[\s._-]+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
};

const select = async (tenant: Tenant) => {
  sessionStore.selectTenantId(tenant.id);

  router.push({ name: "dashboard" });
};
</script>
