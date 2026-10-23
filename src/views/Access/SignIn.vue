<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-96px)] px-4 py-8">
    <v-card class="w-full max-w-md" rounded="xl" elevation="8">
      <div class="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
      <v-card-item class="pt-8 px-8 text-center">
        <div class="flex justify-center mb-4">
          <v-avatar color="primary" variant="tonal" size="64">
            <v-icon :icon="`svg:${mdiShieldAccountOutline}`" size="36"></v-icon>
          </v-avatar>
        </div>
        <div class="text-2xl font-semibold">{{ $t("sign-in") }}</div>
        <div class="text-sm text-medium-emphasis mt-1">{{ $t("sign-in-subtitle") }}</div>
      </v-card-item>
      <v-card-text class="px-8 pb-8 pt-4">
        <s-form v-if="configuration.isAccessPasswordAuthenticationAllowed()" :submit="signIn" class="p-0!">
          <div class="flex flex-col gap-3">
            <s-text-field :prepend-inner-icon="`svg:${mdiAccountOutline}`" v-model="state.identityName"
              :label="$t('identity-name')" variant="outlined" rounded="lg" autocomplete="username" autofocus
              :error-messages="validation.message('identityName')">
            </s-text-field>
            <s-text-field :prepend-inner-icon="`svg:${mdiLockOutline}`" v-model="state.password" :label="$t('password')"
              variant="outlined" rounded="lg" autocomplete="current-password" :type="passwordVisible ? 'text' : 'password'"
              :error-messages="validation.message('password')">
              <template v-slot:append-inner>
                <v-btn :icon="`svg:${passwordVisible ? mdiEyeOutline : mdiEyeOffOutline}`" variant="text" size="small"
                  density="comfortable" :aria-label="$t(passwordVisible ? 'hide-password' : 'show-password')"
                  @click="passwordVisible = !passwordVisible"></v-btn>
              </template>
            </s-text-field>
          </div>
          <s-btn-alert type="submit" color="primary" size="large" rounded="lg" block class="mt-4"
            :disabled="busy" :loading="signingIn" :validation="validation">{{ $t("sign-in") }}</s-btn-alert>
        </s-form>
        <template v-if="oauthProviders.length > 0">
          <div v-if="configuration.isAccessPasswordAuthenticationAllowed()" class="flex items-center gap-3 my-6">
            <v-divider></v-divider>
            <span class="text-xs uppercase tracking-wider text-medium-emphasis whitespace-nowrap">{{
              $t("sign-in-with") }}</span>
            <v-divider></v-divider>
          </div>
          <div class="flex flex-col gap-3">
            <v-btn v-for="oauthProvider in oauthProviders" v-bind:key="oauthProvider.name" variant="outlined"
              size="large" rounded="lg" block class="normal-case!" :disabled="busy"
              :loading="authenticatingProvider === oauthProvider.name" @click="oauthAuthenticate(oauthProvider.name)">
              <template v-slot:prepend v-if="oauthProvider.svg">
                <div v-html="oauthProvider.svg" class="v-icon__svg w-6 h-6" :aria-label="`${oauthProvider.name} logo`">
                </div>
              </template>
              {{ oauthProvider.name }}
            </v-btn>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import {
  mdiAccountOutline,
  mdiEyeOutline,
  mdiEyeOffOutline,
  mdiLockOutline,
  mdiShieldAccountOutline,
} from "@mdi/js";
import { computed, reactive, ref } from "vue";
import { required } from "@vuelidate/validators";
import { useValidation } from "@/composables/useValidation";
import { useSnackbarStore } from "@/stores/snackbar";
import { useSessionStore } from "@/stores/session";
import { useI18n } from "vue-i18n";
import router from "@/router";
import { accessApi } from "@/api";
import configuration from "@/configuration";
import { useDrawerStore } from "@/stores/drawer";

type OAuthProvider = {
  name: string;
  svg: string;
};

const { t } = useI18n({ useScope: "global" });
const snackbarStore = useSnackbarStore();
const drawerStore = useDrawerStore();
const sessionStore = useSessionStore();

const busy = ref(false);
const signingIn = ref(false);
const authenticatingProvider = ref<string>();
const oauthProviders = ref<OAuthProvider[]>([]);

const state = reactive({
  identityName: "",
  password: "",
});

const rules = computed(() => {
  return {
    identityName: {
      required,
    },
    password: {
      required,
    },
  };
});

const validation = useValidation(rules, state);

const passwordVisible = ref(false);

const signIn = async () => {
  const errors = await validation.errors();

  if (errors.length) {
    return;
  }

  busy.value = true;
  signingIn.value = true;

  try {
    const sessionResponse = await sessionStore.signIn({
      identityName: state.identityName,
      password: state.password,
    });

    if ((sessionResponse.tenants?.length ?? 0) > 1) {
      router.push({ name: "tenant-selection" });
      return;
    }

    router.push({ name: "dashboard" });
  } catch (error: any) {
    snackbarStore.add({
      message:
        error.response?.status == 400
          ? t("exceptions.invalid-credentials", {
            reason: error.response?.data ?? t("exceptions.bad-request"),
          })
          : error.toString(),
      type: "error",
    });
  } finally {
    busy.value = false;
    signingIn.value = false;
  }
};

const oauthAuthenticate = async (provider: string) => {
  busy.value = true;
  authenticatingProvider.value = provider;

  try {
    const redirectUri = encodeURIComponent(`${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/oauth`)
    const response = await accessApi.get(`v1/oauth/authenticate/${provider}/Access?redirectUri=${redirectUri}`);

    window.location.replace(response?.data?.authorizationUrl);
  } catch (error: any) {
    snackbarStore.add({
      message: error.toString(),
      type: "error",
    });
  } finally {
    busy.value = false;
    authenticatingProvider.value = undefined;
  }
};

const refreshOAuthProviders = async () => {
  busy.value = true;

  try {
    const response = await accessApi.get("v1/oauth/providers/Access");

    oauthProviders.value = response?.data;
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  drawerStore.showNavigationDrawer = false;
  drawerStore.showProfileDrawer = false;

  if (!configuration.isOk()) {
    return;
  }

  await sessionStore.signOut();
  await refreshOAuthProviders();
});
</script>
