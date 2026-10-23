import type { SnackbarMessage } from "@/portal";
import { defineStore } from "pinia";
import { ref } from "vue";
import { i18n } from "@/i18n";

type SnackbarQueueMessage = {
  text: string;
  color?: string;
  timeout: number;
  onDismiss: () => void;
};

export const useSnackbarStore = defineStore("snackbar", () => {
  const queue = ref<SnackbarQueueMessage[]>([]);

  // Messages that are queued or currently displayed; used to suppress duplicates (e.g. repeated API errors).
  const active = new Set<string>();

  function add(snackbarMessage: SnackbarMessage) {
    if (!snackbarMessage || !snackbarMessage.message) {
      return;
    }

    const text = snackbarMessage.message;

    if (active.has(text)) {
      return;
    }

    active.add(text);

    queue.value.push({
      text,
      color: snackbarMessage.type,
      timeout: snackbarMessage.timeout ?? 10000,
      onDismiss: () => active.delete(text),
    });
  }

  function open(message: string, duration: number = 2000) {
    add({ message, timeout: duration });
  }

  function requestSent(duration: number = 3000) {
    open(i18n.global.t("_messages.request-sent"), duration);
  }

  function working(duration: number = 3000) {
    open(i18n.global.t("_messages.working"), duration);
  }

  return {
    queue,
    add,
    open,
    requestSent,
    working,
  };
});
