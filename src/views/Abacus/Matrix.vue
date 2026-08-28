<template>
  <s-form :submit="submit">
    <s-title :title="$t('matrix')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.name"
      :label="$t('matrix-name')"
      class="mb-2"
      :error-messages="validation.message('name')"
    >
    </v-text-field>
    <v-select
      v-model="state.dataTypeName"
      :label="$t('data-type-name')"
      :items="dataTypes"
      class="mb-2"
      :error-messages="validation.message('dataTypeName')"
    >
    </v-select>
    <v-autocomplete
      v-model="state.rowArgumentId"
      :label="$t('row-argument')"
      :items="arguments_"
      item-title="name"
      item-value="id"
      class="mb-2"
      :error-messages="validation.message('rowArgumentId')"
    >
    </v-autocomplete>
    <v-autocomplete
      v-model="state.columnArgumentId"
      :label="$t('column-argument')"
      :items="arguments_"
      item-title="name"
      item-value="id"
      clearable
      class="mb-2"
    >
    </v-autocomplete>
    <s-strip reverse>
      <s-btn-alert type="submit" :disabled="busy" :validation="validation">{{
        $t("save")
      }}</s-btn-alert>
    </s-strip>
  </s-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, type Reactive } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { abacusApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";
import { useRoute } from "vue-router";
import type { Argument, Matrix } from "@/portal";

const props = defineProps<{ id?: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string | undefined);

const drawerStore = useDrawerStore();

const busy: Ref<boolean> = ref(false);
const arguments_: Ref<Argument[]> = ref([]);
const dataTypes = ["Boolean", "DateTime", "Decimal", "Integer", "Text"];

type State = {
  name: string;
  dataTypeName: string;
  rowArgumentId: string;
  columnArgumentId: string | null;
};

const state: Reactive<State> = reactive({
  name: "",
  dataTypeName: "Text",
  rowArgumentId: "",
  columnArgumentId: null,
});

const rules = computed(() => {
  return {
    name: {
      required,
    },
    dataTypeName: {
      required,
    },
    rowArgumentId: {
      required,
    },
  };
});

const validation = useValidation(rules, state);

const submit = async () => {
  const errors = await validation.errors();

  if (errors.length) {
    return;
  }

  busy.value = true;

  try {
    await abacusApi.post("v1/matrices", {
      id: id ?? null,
      name: state.name,
      dataTypeName: state.dataTypeName,
      rowArgumentId: state.rowArgumentId,
      columnArgumentId: state.columnArgumentId || null,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  const { data } = await abacusApi.post<Argument[]>("v1/arguments/search", {});

  arguments_.value = data;

  if (id) {
    const response = await abacusApi.get<Matrix>(`v1/matrices/${id}`);

    state.name = response.data.name;
    state.dataTypeName = response.data.dataTypeName;
    state.rowArgumentId = response.data.rowArgumentId;
    state.columnArgumentId = response.data.columnArgumentId ?? null;
  }
});
</script>
