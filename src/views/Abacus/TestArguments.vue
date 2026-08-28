<template>
  <v-card flat>
    <v-card-title class="sv-card-title">
      <s-title :title="`${t('arguments')} - ${testName}`" close-drawer type="borderless" />
      <s-strip>
        <v-btn :icon="mdiRefresh" size="small" @click="refresh"></v-btn>
      </s-strip>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="5">
          <v-autocomplete
            v-model="newItem.argumentId"
            :label="$t('argument')"
            :items="arguments_"
            item-title="name"
            item-value="id"
            density="compact"
            hide-details
          ></v-autocomplete>
        </v-col>
        <v-col cols="12" sm="5">
          <v-text-field v-model="newItem.value" :label="$t('value')" density="compact" hide-details></v-text-field>
        </v-col>
        <v-col cols="12" sm="2" class="flex items-center">
          <v-btn :icon="mdiPlus" @click="add" :disabled="!canAdd"></v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    <v-divider></v-divider>
    <s-data-table :items="items" :headers="headers" :loading="busy">
      <template v-slot:item.argumentId="{ item }">
        {{ argumentName(item.argumentId) }}
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn :icon="mdiDelete" size="x-small" @click.stop="remove(item)" />
      </template>
    </s-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { abacusApi } from "@/api";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiDelete, mdiPlus, mdiRefresh } from "@mdi/js";
import type { AbacusTest, Argument, TestArgument } from "@/portal";
import { useSnackbarStore } from "@/stores/snackbar";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const { t } = useI18n({ useScope: "global" });

const testName: Ref<string> = ref("");
const items: Ref<TestArgument[]> = ref([]);
const arguments_: Ref<Argument[]> = ref([]);
const busy: Ref<boolean> = ref(false);

const newItem = reactive({
  argumentId: "",
  value: "",
});

const canAdd = computed(() => !!newItem.argumentId && !!newItem.value);

const headers = [
  {
    title: t("argument"),
    value: "argumentId",
  },
  {
    title: t("value"),
    value: "value",
  },
  {
    value: "action",
    headerProps: {
      class: "w-1",
    },
    filterable: false,
  },
];

const argumentName = (argumentId: string) => {
  return arguments_.value.find((item) => item.id === argumentId)?.name ?? argumentId;
};

const refresh = async () => {
  busy.value = true;

  try {
    const testResponse = await abacusApi.get<AbacusTest>(`v1/tests/${id}`);

    testName.value = testResponse.data.name;

    const [testArgumentsResponse, argumentsResponse] = await Promise.all([
      abacusApi.get<TestArgument[]>(`v1/tests/${id}/arguments`),
      abacusApi.post<Argument[]>("v1/arguments/search", {}),
    ]);

    items.value = testArgumentsResponse.data;
    arguments_.value = argumentsResponse.data;
  } finally {
    busy.value = false;
  }
};

const add = async () => {
  if (!canAdd.value) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.post(`v1/tests/${id}/arguments`, {
      argumentId: newItem.argumentId,
      value: newItem.value,
    });

    newItem.value = "";

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

const remove = async (item: TestArgument) => {
  busy.value = true;

  try {
    await abacusApi.delete(`v1/tests/${id}/arguments/${item.argumentId}`);

    useSnackbarStore().requestSent();

    await refresh();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>
