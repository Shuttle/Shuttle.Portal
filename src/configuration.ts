import type { AccessServerConfiguration, Configuration, Env } from "./portal";
import { Api } from "./enums";
import axios from "axios";

let errorMessage: string;
let accessServerConfiguration: AccessServerConfiguration;
let values: Env;
let isOk = true;

try {
  const env = async (): Promise<Env> => {
    if (import.meta.env.MODE === "production") {
      return (await axios.get<Env>("/env")).data;
    } else {
      return {
        VITE_ACCESS_API_URL: import.meta.env.VITE_ACCESS_API_URL,
        VITE_RECALL_API_URL: import.meta.env.VITE_RECALL_API_URL,
      };
    }
  };

  values = await env();

  if (values.VITE_ACCESS_API_URL) {
    const accessUrl = `${values.VITE_ACCESS_API_URL}${values.VITE_ACCESS_API_URL.endsWith("/") ? "" : "/"}`;

    accessServerConfiguration = (
      await axios.get<AccessServerConfiguration>(`${accessUrl}v1/server/configuration`)
    ).data;
  }
} catch (error: any) {
  isOk = false;
  errorMessage = error.toString();
}

const getConfiguration = (): Configuration => {
  return {
    isOk() {
      return isOk;
    },
    getErrorMessage() {
      return errorMessage;
    },
    getAccessUrl() {
      return isOk
        ? `${values.VITE_ACCESS_API_URL}${values.VITE_ACCESS_API_URL.endsWith("/") ? "" : "/"}`
        : "";
    },
    getRecallUrl() {
      return isOk && values.VITE_RECALL_API_URL
        ? `${values.VITE_RECALL_API_URL}${values.VITE_RECALL_API_URL.endsWith("/") ? "" : "/"}`
        : "";
    },
    isAccessAvailable() {
      return isOk && !!values.VITE_ACCESS_API_URL;
    },
    isRecallAvailable() {
      return isOk && !!values.VITE_RECALL_API_URL;
    },
    isAccessPasswordAuthenticationAllowed() {
      return this.isAccessAvailable()
        ? accessServerConfiguration.allowPasswordAuthentication
        : false;
    },
    isDebugging() {
      return import.meta.env.DEV;
    },
    getApiUrl(api: Api, path: string) {
      if (path.startsWith("/") && path.length < 2) {
        path = "";
      }

      const buildApiUrl = (baseUrl: string, path: string) => {
        return baseUrl + (path.startsWith("/") ? path.substring(1) : path);
      };

      switch (api) {
        case Api.Access: {
          return buildApiUrl(this.getAccessUrl(), path);
        }
        case Api.Recall: {
          return buildApiUrl(this.getRecallUrl(), path);
        }
        default: {
          throw `Unknown Api name '${api}'.`;
        }
      }
    },
    accessSystemTenantId: accessServerConfiguration?.systemTenantId ?? "",
  };
};

const configuration = getConfiguration();

if (!import.meta.env.VITE_ACCESS_API_URL) {
  throw new Error("Configuration item 'VITE_ACCESS_API_URL' has not been set.");
}

if (Object.freeze) {
  Object.freeze(configuration);
}

export default configuration;
