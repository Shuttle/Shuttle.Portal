<template>
  <s-form :submit="submit">
    <s-title :title="$t('argument')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.name"
      :label="$t('argument-name')"
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
    <s-strip reverse>
      <s-btn-alert type="submit" :disabled="busy" :validation="validation">{{
        $t("save")
      }}</s-btn-alert>
    </s-strip>
  </s-form>
</template>

<script setup lang="ts">
import { computed, reactive, type Reactive } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { abacusApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const drawerStore = useDrawerStore();

const busy: Ref<boolean> = ref(false);

const dataTypes = ["Boolean", "DateTime", "Decimal", "Integer", "Text"];

type State = {
  name: string;
  dataTypeName: string;
};

const state: Reactive<State> = reactive({
  name: "",
  dataTypeName: "Text",
});

const rules = computed(() => {
  return {
    name: {
      required,
    },
    dataTypeName: {
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
    await abacusApi.post("v1/arguments", {
      name: state.name,
      dataTypeName: state.dataTypeName,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};
</script>
