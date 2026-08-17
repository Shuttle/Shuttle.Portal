<template>
  <s-form :submit="submit">
    <s-title :title="$t('tenant')" close-drawer type="borderless" />
    <v-text-field v-model="state.id" :label="$t('id')" class="mb-2" clearable>
    </v-text-field>
    <v-text-field
      v-model="state.name"
      :label="$t('name')"
      class="mb-2"
      :error-messages="validation.message('name')"
    >
    </v-text-field>
    <v-text-field
      v-model="state.logoSvg"
      :label="$t('logo-svg')"
      class="mb-2"
      :error-messages="validation.message('logoSvg')"
    >
    </v-text-field>
    <v-text-field
      v-model="state.logoUrl"
      :label="$t('logo-url')"
      class="mb-2"
      :error-messages="validation.message('logoUrl')"
    >
    </v-text-field>
    <v-text-field
      v-model="state.administratorIdentityName"
      :label="$t('administrator-identity-name')"
      class="mb-2"
      :error-messages="validation.message('administratorIdentityName')"
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
import { computed, reactive, type Reactive, ref, type Ref } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { accessApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";
import type { RegisterTenant } from "@/portal";

const drawerStore = useDrawerStore();

const busy: Ref<boolean> = ref(false);

const state: Reactive<RegisterTenant> = reactive({
  name: "",
  logoSvg: "",
  logoUrl: "",
  status: 1,
  administratorIdentityName: "",
});

const rules = computed(() => {
  return {
    name: {
      required,
    },
    administratorIdentityName: {
      required,
    },
    logoSvg: {},
    logoUrl: {},
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
    await accessApi.post("v1/tenants", state);

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};
</script>
