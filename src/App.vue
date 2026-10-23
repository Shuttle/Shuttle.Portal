<template>
  <v-app>
    <v-layout>
      <ShuttleNavbar />
      <v-main>
        <div class="p-2">
          <RouterView />
        </div>
        <v-snackbar-queue
          v-model="snackbarStore.queue"
          location="bottom end"
          :total-visible="5"
          closable
        >
          <template v-slot:actions="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              :icon="`svg:${mdiCloseCircleOutline}`"
            ></v-btn>
          </template>
        </v-snackbar-queue>
      </v-main>
      <v-dialog
        v-model="confirmationStore.isOpen"
        class="flex flex-row items-start mt-16 lg:w-2/4 md:w-3/4lg:w-1/4 md:w-2/4"
      >
        <v-card
          :title="
            confirmationStore.options?.titleText ||
            $t(confirmationStore.options?.titleKey || '_confirmation.title')
          "
        >
          <v-card-text>
            {{
              confirmationStore.options.messageText ||
              $t(
                confirmationStore.options?.messageKey ||
                  "_exceptions.confirmation-message-missing",
              )
            }}
          </v-card-text>
          <v-spacer></v-spacer>
          <v-card-actions>
            <v-btn
              :text="$t('yes')"
              @click="confirmationStore.confirmed()"
              color="warning"
              variant="outlined"
            ></v-btn>
            <v-btn
              :text="$t('cancel')"
              @click="confirmationStore.close()"
              color="secondary"
              variant="flat"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import ShuttleNavbar from "@/components/ShuttleNavbar.vue";
import { mdiCloseCircleOutline } from "@mdi/js";
import { RouterView } from "vue-router";
import { useConfirmationStore } from "@/stores/confirmation";
import { useSnackbarStore } from "@/stores/snackbar";
import configuration from "@/configuration";
import { useI18n } from "vue-i18n";

const confirmationStore = useConfirmationStore();
const snackbarStore = useSnackbarStore();

const { t } = useI18n({ useScope: "global" });

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  const message = useConfirmationStore().getConfirmationMessage();

  if (!message) {
    return;
  }

  event.preventDefault();

  try {
    event.returnValue = "Are you sure to leave site?";
  } catch {
    // ignore
  }

  return message;
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

if (!configuration.isOk()) {
  t("configuration-error");
  snackbarStore.add({
    message: t("exceptions.configuration-error", {
      error: configuration.getErrorMessage(),
    }),
    type: "error",
    timeout: -1,
  });
}
</script>
