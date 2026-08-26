<template>
  <s-form :submit="submit">
    <s-title :title="$t('tenant')" close-drawer type="borderless" />
    <s-number-input
      v-model="state.current"
      :label="$t('maximum-identities')"
      class="mb-2"
      readonly
    >
    </s-number-input>
    <s-number-input
      v-model="state.maximumIdentities"
      :min="0"
      :label="$t('new-value')"
      :hint="$t('maximum-identities-hint')"
      persistent-hint
      class="mb-2"
      :error-messages="validation.message('maximumIdentities')"
    >
    </s-number-input>
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
import { integer, minValue, required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { accessApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const drawerStore = useDrawerStore();

const props = defineProps({
  id: String,
});

const busy = ref(false);

const same = computed(() => {
  return state.current === state.maximumIdentities;
});

const state = reactive({
  current: 0,
  maximumIdentities: 0,
});

const rules = computed(() => {
  return {
    maximumIdentities: {
      required,
      integer,
      minValue: minValue(0),
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
    await accessApi.patch(`v1/tenants/${props.id}/maximum-identities`, {
      maximumIdentities: state.maximumIdentities,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  accessApi.get(`v1/tenants/${props.id}`).then((item) => {
    state.current = item.data.maximumIdentities;
    state.maximumIdentities = item.data.maximumIdentities;
  });
});
</script>
