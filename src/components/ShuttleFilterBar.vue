<template>
  <!-- The horizontal padding matches the card title and the table cells so that everything lines up. -->
  <div class="flex items-start gap-3 px-4 py-3">
    <div class="flex flex-col gap-3 grow min-w-0">
      <div v-if="$slots.presets" class="flex items-center flex-wrap gap-3">
        <slot name="presets"></slot>
      </div>
      <div class="flex items-center flex-wrap gap-3">
        <slot name="chips"></slot>
        <v-menu
          v-for="filter in bar.visibleFilters"
          :key="filter.key"
          :model-value="bar.menus[filter.key]"
          @update:model-value="(open: boolean) => bar.setMenu(filter.key, open)"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template v-slot:activator="{ props: menuProps }">
            <v-chip
              v-bind="menuProps"
              closable
              :prepend-icon="filter.icon"
              variant="tonal"
              color="primary"
              @click:close="bar.clearFilter(filter.key)"
            >
              {{ describe(filter) }}
            </v-chip>
          </template>
          <v-card min-width="300" :max-width="filter.wide ? 420 : 360">
            <slot name="editor" :filter="filter"></slot>
          </v-card>
        </v-menu>
        <v-menu v-if="bar.availableFilters.length > 0" location="bottom start">
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              :prepend-icon="mdiFilterPlusOutline"
              size="small"
              variant="outlined"
              rounded
              color="primary"
            >
              {{ t("add-filter") }}
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="filter in bar.availableFilters"
              :key="filter.key"
              :prepend-icon="filter.icon"
              :title="filter.title"
              @click="bar.addFilter(filter.key)"
            />
          </v-list>
        </v-menu>
        <s-clear-filters v-if="bar.hasNonDefaultFilters" :bar="bar" />
      </div>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <v-menu
        v-if="$slots.options"
        :close-on-content-click="false"
        location="bottom end"
      >
        <template v-slot:activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            :icon="mdiTune"
            size="x-small"
            v-tooltip="t('options')"
          />
        </template>
        <v-card min-width="240" class="flex flex-col gap-3 p-3">
          <slot name="options"></slot>
        </v-card>
      </v-menu>
      <v-btn
        :icon="mdiRefresh"
        size="x-small"
        @click="emit('refresh')"
        v-tooltip="t('refresh')"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="K extends string">
import { mdiFilterPlusOutline, mdiRefresh, mdiTune } from "@mdi/js";
import { useI18n } from "vue-i18n";
import type { FilterBar, FilterDefinition } from "@/composables/useFilterBar";

defineProps<{
  bar: FilterBar<K>;
  describe: (filter: FilterDefinition<K>) => string;
}>();

defineSlots<{
  presets?: () => unknown;
  chips?: () => unknown;
  options?: () => unknown;
  editor?: (props: { filter: FilterDefinition<K> }) => unknown;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const { t } = useI18n({ useScope: "global" });
</script>
