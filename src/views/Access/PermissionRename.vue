<template>
  <s-form :submit="submit">
    <s-title
      :title="$t('permission')"
      close-path="/permissions"
      type="borderless"
    />
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
import { computed, onMounted, reactive, ref } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { accessApi } from "@/api";
import { useSnackbarStore } from "@/stores/snackbar";

const router = useRouter();

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

const state: State = reactive({
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
    await accessApi.patch(`v1/permissions/${props.id}/name`, {
      name: state.name,
    });

    useSnackbarStore().requestSent();

    router.push("/permissions");
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  busy.value = true;

  try {
    const item = await accessApi.get(`v1/permissions/${props.id}`);

    state.current = item.data.name;
    state.name = item.data.name;
  } finally {
    busy.value = false;
  }
});
</script>
