<template>
  <s-form :submit="submit">
    <s-title :title="$t('rename')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.name"
      :label="$t('argument-name')"
      class="mb-2"
      :error-messages="validation.message('name')"
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
import { computed, reactive, type Reactive } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { abacusApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";
import { useRoute } from "vue-router";

const props = defineProps<{ id: string }>();
const route = useRoute();
const id = props.id ?? (route.params.id as string);

const drawerStore = useDrawerStore();

const busy: Ref<boolean> = ref(false);

type State = {
  name: string;
};

const state: Reactive<State> = reactive({
  name: "",
});

const rules = computed(() => {
  return {
    name: {
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
    await abacusApi.patch(`v1/arguments/${id}/name`, {
      name: state.name,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};
</script>
