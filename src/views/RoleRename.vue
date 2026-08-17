<template>
  <s-form :submit="submit">
    <s-title :title="$t('role')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.current"
      :label="$t('name')"
      class="mb-2"
      readonly
    >
    </v-text-field>
    <v-text-field
      v-model="state.name"
      :label="$t('new-value')"
      class="mb-2"
      :error-messages="validation.message('name')"
    >
    </v-text-field>
    <s-strip reverse>
      <s-btn-alert
        type="submit"
        :disabled="busy || same"
        :validation="validation"
        >{{ $t("save") }}</s-btn-alert
      >
    </s-strip>
  </s-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, type Reactive } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { accessApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const drawerStore = useDrawerStore();

const props = defineProps<{
  id: string;
}>();

const busy: Ref<boolean> = ref(false);

const same: ComputedRef<boolean> = computed(() => {
  return state.current === state.name;
});

type State = {
  current: string;
  name: string;
};

const state: Reactive<State> = reactive({
  current: "",
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
    await accessApi.patch(`v1/roles/${props.id}/name`, {
      name: state.name,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  accessApi.get(`v1/roles/${props.id}`).then((item) => {
    state.current = item.data.name;
    state.name = item.data.name;
  });
});
</script>
