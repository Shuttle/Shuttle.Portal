import axios, { type AxiosInstance } from "axios";
import { useAlertStore } from "@/stores/alert";
import { useSessionStore } from "@/stores/session";
import { useRecallStore } from "@/stores/recall";
import configuration from "./configuration";
import router from "./router";

const configure = (
  api: AxiosInstance,
  { attachTenantHeader }: { attachTenantHeader: boolean },
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
        message:
          error.response?.data ||
          error.response?.statusText ||
          "(unknown communication/network error)",
        type: "error",
        name: "api-error",
      });

      return Promise.reject(error);
    },
  );

  return api;
};

const accessApi = configure(
  axios.create({ baseURL: configuration.getAccessUrl() }),
  { attachTenantHeader: true },
);

const recallApi = configure(
  axios.create({ baseURL: configuration.getRecallUrl() }),
  { attachTenantHeader: false },
);

recallApi.interceptors.request.use((config) => {
  const recallStore = useRecallStore();

  if (recallStore.name) {
    config.headers["Shuttle-Recall-Event-Store"] = recallStore.name;
  }

  return config;
});

export { accessApi, recallApi };
