<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-96px)] px-4 py-8">
    <v-card class="w-full max-w-md" rounded="xl" elevation="8">
      <div class="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
      <v-card-text class="flex flex-col items-center text-center px-8 py-10">
        <v-progress-circular indeterminate color="primary" size="80" width="3">
          <v-icon :icon="`svg:${mdiShieldAccountOutline}`" color="primary" size="36"></v-icon>
        </v-progress-circular>
        <div class="text-2xl font-semibold mt-6">{{ $t("signing-in") }}</div>
        <div class="text-sm text-medium-emphasis mt-1">{{ $t("signing-in-subtitle") }}</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { mdiShieldAccountOutline } from "@mdi/js";
import { ref } from "vue";
import { useSnackbarStore } from "@/stores/snackbar";
import { useSessionStore } from "@/stores/session";
import { useI18n } from "vue-i18n";
import router from "@/router";
import { useRoute } from "vue-router";

const { t } = useI18n({ useScope: "global" });

const snackbarStore = useSnackbarStore();

const busy = ref(false);

onMounted(async () => {
  const sessionStore = useSessionStore();
  const route = useRoute();

  if (!!route.query.error) {
    snackbarStore.add({
      message: t("exceptions.oauth-error", {
        error: route.query.error_description,
      }),
      type: "error",
    });

    router.push({ name: "sign-in" });

    return;
  }

  const state = route.query.state?.toString() || "";
  const code = route.query.code?.toString() || "";

  try {
    const sessionResponse = await sessionStore.oauth({
      state: state,
      code: code,
    });

    const params = { identityName: sessionResponse.session?.identityName };

    if (sessionResponse.result === "UnknownIdentity") {
      snackbarStore.add({
        message: sessionResponse.registrationRequested
          ? t("_messages.oauth-unknown-identity-registered", params)
          : t("_messages.oauth-unknown-identity", params),
        type: "error",
      });

      router.push({ name: "sign-in" });
      return;
    }

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
              reason: error.response?.data,
            })
          : error.toString(),
      type: "error",
    });

    router.push({ name: "sign-in" });
  } finally {
    busy.value = false;
  }
});
</script>
