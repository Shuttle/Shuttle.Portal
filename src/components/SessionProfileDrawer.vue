<template>
  <v-navigation-drawer
    v-model="drawerStore.showSessionProfileDrawer"
    location="right"
    temporary
    width="600"
  >
    <v-card flat>
      <v-card-title class="flex items-center">
        <v-icon :icon="mdiAccountCircleOutline" class="mr-2"></v-icon>
        <span class="truncate">{{
          sessionStore.identityName ?? t("(unknown)")
        }}</span>
        <v-spacer></v-spacer>
        <v-btn
          :icon="mdiClose"
          variant="text"
          size="small"
          @click="close"
        ></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-tabs v-model="section">
        <v-tab value="password">{{ t("password") }}</v-tab>
        <v-tab value="permissions">{{ t("permissions") }}</v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-card-text>
        <v-tabs-window v-model="section">
          <v-tabs-window-item value="password">
            <s-text-field
              v-model="passwordState.identityName"
              :label="t('identity-name')"
              readonly
              class="mb-2"
              hide-details
            ></s-text-field>
            <s-text-field
              v-model="passwordState.password"
              :label="t('password')"
              :type="passwordVisible ? 'text' : 'password'"
              :append-icon="`svg:${passwordVisible ? mdiEyeOutline : mdiEyeOffOutline}`"
              :error-messages="passwordValidation.message('password')"
              autocomplete="new-password"
              class="mb-2"
              @click:append="passwordVisible = !passwordVisible"
              @keyup.enter="changePassword"
            ></s-text-field>
            <div class="flex justify-end">
              <v-btn
                color="primary"
                :disabled="passwordBusy"
                :loading="passwordBusy"
                @click="changePassword"
                >{{ t("change") }}</v-btn
              >
            </div>
          </v-tabs-window-item>
          <v-tabs-window-item value="permissions">
            <div class="text-body-2 text-medium-emphasis mb-4">
              {{
                t("permissions-description", {
                  identityName: sessionStore.identityName,
                })
              }}
            </div>
            <div
              v-for="group in permissionGroups"
              :key="group.tenantId"
              class="mb-4"
            >
              <div class="flex items-center mb-2">
                <span class="text-subtitle-2">{{ group.tenantName }}</span>
                <v-chip
                  v-if="group.tenantId === sessionStore.tenantId"
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="ml-2"
                  >{{ t("active-tenant") }}</v-chip
                >
              </div>
              <s-container show-border>
                <div
                  v-if="group.permissions.length"
                  class="flex flex-wrap gap-2"
                >
                  <v-chip
                    v-for="permission in group.permissions"
                    :key="permission"
                    size="small"
                    variant="outlined"
                    class="font-mono"
                    >{{ permission }}</v-chip
                  >
                </div>
                <div v-else class="text-body-2 text-medium-emphasis">
                  {{ t("none") }}
                </div>
              </s-container>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { required } from "@vuelidate/validators";
import {
  mdiAccountCircleOutline,
  mdiClose,
  mdiEyeOffOutline,
  mdiEyeOutline,
} from "@mdi/js";
import { accessApi } from "@/api";
import { useAlertStore } from "@/stores/alert";
import { useDrawerStore } from "@/stores/drawer";
import { useSessionStore } from "@/stores/session";
import { useValidation } from "@/composables/useValidation";
import type { ChangePassword } from "@/portal";

const { t } = useI18n({ useScope: "global" });

const drawerStore = useDrawerStore();
const sessionStore = useSessionStore();

const section: Ref<string> = ref("password");

const passwordVisible: Ref<boolean> = ref(false);
const passwordBusy: Ref<boolean> = ref(false);
const passwordState = reactive({
  identityName: sessionStore.identityName ?? "",
  password: "",
});

const passwordRules = computed(() => ({
  password: { required },
}));

const passwordValidation = useValidation(passwordRules, passwordState);

// the session permissions per tenant, with the active tenant first
const permissionGroups = computed(() => {
  const tenantIds = new Set([
    ...sessionStore.tenants.map((tenant) => tenant.id),
    ...sessionStore.sessionPermissions.map(
      (permission) => permission.tenantId,
    ),
  ]);

  return [...tenantIds]
    .map((tenantId) => ({
      tenantId,
      tenantName:
        sessionStore.tenants.find((tenant) => tenant.id === tenantId)
          ?.name ?? tenantId,
      permissions: sessionStore.sessionPermissions
        .filter((permission) => permission.tenantId === tenantId)
        .map((permission) => permission.name)
        .sort((a, b) => a.localeCompare(b)),
    }))
    .sort(
      (a, b) =>
        Number(b.tenantId === sessionStore.tenantId) -
          Number(a.tenantId === sessionStore.tenantId) ||
        a.tenantName.localeCompare(b.tenantName),
    );
});

const changePassword = async () => {
  if (passwordBusy.value) {
    return;
  }

  const errors = await passwordValidation.errors();

  if (errors.length) {
    return;
  }

  passwordBusy.value = true;

  try {
    await accessApi.patch<ChangePassword>("v1/identities/password", {
      token: sessionStore.token,
      newPassword: passwordState.password,
    });

    passwordState.password = "";

    useAlertStore().add({
      message: t("_messages.password-changed"),
      variant: "success",
      name: "password-changed",
    });
  } finally {
    passwordBusy.value = false;
  }
};

const close = () => {
  drawerStore.showSessionProfileDrawer = false;
};

watch(
  () => drawerStore.showSessionProfileDrawer,
  (visible) => {
    if (visible) {
      section.value = "password";
      passwordState.identityName = sessionStore.identityName ?? "";
      passwordState.password = "";
      passwordVisible.value = false;
    }
  },
);
</script>
