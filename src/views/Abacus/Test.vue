<template>
  <s-form :submit="submit">
    <s-title :title="$t('test')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.name"
      :label="$t('test-name')"
      class="mb-2"
      :error-messages="validation.message('name')"
    >
    </v-text-field>
    <v-autocomplete
      v-model="state.formulaId"
      :label="$t('formula')"
      :items="formulas"
      item-title="name"
      item-value="id"
      class="mb-2"
      :error-messages="validation.message('formulaId')"
    >
    </v-autocomplete>
    <v-select
      v-model="state.expectedResultDataTypeName"
      :label="$t('expected-result-data-type-name')"
      :items="dataTypes"
      class="mb-2"
      :error-messages="validation.message('expectedResultDataTypeName')"
    >
    </v-select>
    <v-select
      v-model="state.comparison"
      :label="$t('comparison')"
      :items="comparisons"
      class="mb-2"
      :error-messages="validation.message('comparison')"
    >
    </v-select>
    <v-text-field
      v-model="state.expectedResult"
      :label="$t('expected-result')"
      class="mb-2"
      :error-messages="validation.message('expectedResult')"
    >
    </v-text-field>
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
import type { Formula } from "@/portal";

const drawerStore = useDrawerStore();

const busy: Ref<boolean> = ref(false);
const formulas: Ref<Formula[]> = ref([]);
const dataTypes = ["Boolean", "DateTime", "Decimal", "Integer", "Text"];
const comparisons = ["==", "!=", ">=", ">", "<=", "<"];

type State = {
  name: string;
  formulaId: string;
  expectedResultDataTypeName: string;
  comparison: string;
  expectedResult: string;
};

const state: Reactive<State> = reactive({
  name: "",
  formulaId: "",
  expectedResultDataTypeName: "Decimal",
  comparison: "==",
  expectedResult: "",
});

const rules = computed(() => {
  return {
    name: {
      required,
    },
    formulaId: {
      required,
    },
    expectedResultDataTypeName: {
      required,
    },
    comparison: {
      required,
    },
    expectedResult: {
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
    await abacusApi.post("v1/tests", {
      name: state.name,
      formulaId: state.formulaId,
      expectedResultDataTypeName: state.expectedResultDataTypeName,
      comparison: state.comparison,
      expectedResult: state.expectedResult,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  const { data } = await abacusApi.post<Formula[]>("v1/formulas/search", {});

  formulas.value = data;
});
</script>
