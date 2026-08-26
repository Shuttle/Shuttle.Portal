import axios, { type AxiosInstance } from "axios";
import { useAlertStore } from "@/stores/alert";
import { useSessionStore } from "@/stores/session";
import { useEventStoreStore } from "@/stores/eventStore";
import configuration from "./configuration";
import router from "./router";
import { Api } from "./enums";

const configure = (
  api: AxiosInstance,
  { name, attachTenantHeader }: { name: Api; attachTenantHeader: boolean },
): AxiosInstance => {
  api.interceptors.request.use(function (config) {
    const sessionStore = useSessionStore();

    if (sessionStore.isAuthenticated) {
      config.headers["Authorization"] =
        `Shuttle.Access token=${sessionStore.token}`;

      if (attachTenantHeader) {
        config.headers["Shuttle-Access-Tenant-Id"] = `${sessionStore.tenantId}`;
      }
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        router.push({ name: "sign-in" });

        return error;
      }

      const alertStore = useAlertStore();

      alertStore.add({
        message: `[${name}] ${
          error.response?.data ||
          error.response?.statusText ||
          "(unknown communication/network error)"
        }`,
        type: "error",
        name: `api-error-${name.toLowerCase()}`,
      });

      return Promise.reject(error);
    },
  );

  return api;
};

const accessApi = configure(
  axios.create({ baseURL: configuration.getAccessUrl() }),
  { name: Api.Access, attachTenantHeader: true },
);

const recallApi = configure(
  axios.create({ baseURL: configuration.getRecallUrl() }),
  { name: Api.Recall, attachTenantHeader: false },
);

recallApi.interceptors.request.use((config) => {
  const eventStoreStore = useEventStoreStore();

  if (eventStoreStore.name) {
    config.headers["Shuttle-Recall-Event-Store"] = eventStoreStore.name;
  }

  return config;
});

export { accessApi, recallApi };
