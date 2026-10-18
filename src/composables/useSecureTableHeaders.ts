import { ref } from "vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();

export function useSecureTableHeaders(fields: any) {
  const securedFields: Ref<any[]> = ref([]);

  fields.forEach((item: any) => {
    const allowed =
      !item.permission ||
      (typeof item.permission === "function"
        ? item.permission()
        : sessionStore.hasPermission(item.permission));

    if (allowed) {
      securedFields.value.push(item);
    }
  });

  return securedFields;
}
