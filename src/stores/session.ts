import { accessApi } from "@/api";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import configuration from "@/configuration";
import { i18n } from "@/i18n";
import type {
  Credentials,
  OAuthData,
  SessionPermission,
  SessionResponse,
  Tenant,
} from "@/portal";

export const useSessionStore = defineStore("session", () => {
  const isInitialized = ref(false);
  const identityName = ref<string | null>();
  const token = ref<string | null>();
  const tenantId = ref<string | null>();
  const sessionPermissions = ref<SessionPermission[]>([]);
  const tenants = ref<Tenant[]>([]);

  const isAuthenticated = computed(() => {
    return !!token.value && !!tenantId.value;
  });

  const status = computed(() => {
    return isAuthenticated.value ? "signed-in" : "not-signed-in";
  });

  const initialize = async () => {
    if (isInitialized.value) {
      return;
    }

    identityName.value = localStorage.getItem("shuttle-access.identity-name");
    tenantId.value = localStorage.getItem("shuttle-access.tenant-id");
    token.value = localStorage.getItem("shuttle-access.token");

    try {
      if (identityName.value && token.value) {
        return await signIn({
          identityName: identityName.value,
          token: token.value,
        });
      }
    } finally {
      isInitialized.value = true;
    }
  };

  const register = (sessionResponse: SessionResponse) => {
    if (
      !sessionResponse ||
      !sessionResponse.session ||
      (!sessionResponse.token && sessionResponse.result !== "Renewed")
    ) {
      throw Error(i18n.global.t("_messages.invalid-session"));
    }

    localStorage.setItem(
      "shuttle-access.identity-name",
      sessionResponse.session.identityName,
    );

    if (sessionResponse.token) {
      localStorage.setItem("shuttle-access.token", sessionResponse.token);
      token.value = sessionResponse.token;
    }

    identityName.value = sessionResponse.session.identityName;
    tenants.value = sessionResponse.tenants;

    if (tenants.value.length == 1) {
      selectTenantId(tenants.value[0].id);
    }

    sessionPermissions.value = sessionResponse.session.permissions;
  };

  const signIn = async (credentials: Credentials): Promise<SessionResponse> => {
    if (
      !credentials ||
      !credentials.identityName ||
      !(credentials.password || credentials.token)
    ) {
      throw new Error(i18n.global.t("_messages.missing-credentials"));
    }

    const { data: sessionResponse } = await accessApi.post<SessionResponse>(
      "v1/sessions",
      {
        identityName: credentials.identityName,
        password: credentials.password,
        token: credentials.token,
      },
    );

    if (!sessionResponse) {
      throw new Error("Invalid response data.");
    }

    if (sessionResponse.session) {
      register(sessionResponse);
    }

    return sessionResponse;
  };

  const selectTenantId = (id: string) => {
    tenantId.value = id;
    localStorage.setItem("shuttle-access.tenant-id", id);
  };

  const oauth = async (oauthData: OAuthData): Promise<SessionResponse> => {
    if (!oauthData || !oauthData.state || !oauthData.code) {
      throw new Error(i18n.global.t("_messages.oauth-missing-data"));
    }

    const { data: sessionResponse } = await accessApi.get<SessionResponse>(
      `v1/oauth/session/${oauthData.state}/${oauthData.code}`,
    );

    if (!sessionResponse) {
      throw new Error("Invalid response data.");
    }

    register(sessionResponse);

    isInitialized.value = true;

    return sessionResponse;
  };

  const signOut = () => {
    identityName.value = undefined;
    token.value = undefined;
    tenantId.value = undefined;

    localStorage.removeItem("shuttle-access.identity-name");
    localStorage.removeItem("shuttle-access.token");

    sessionPermissions.value = [];
  };

  const hasSession = () => {
    return !!token.value;
  };

  const activePermissions = computed(() => {
    return sessionPermissions.value.filter(
      (item) => item.tenantId === tenantId.value,
    );
  });

  // Identities, tenants, sessions and permissions are not owned by any one tenant, so managing them (unlike, say,
  // managing an identity's roles) is restricted to callers currently working in the system tenant.  Viewing
  // identities/sessions/permissions remains available from any tenant (permissions in particular must stay
  // viewable everywhere, since assigning them to a role happens from within that role's own tenant); tenants are
  // only ever visible from the system tenant.  This is checked against the permission being *asked for*, not
  // against how it happens to be granted (a wildcard such as "access://*" would otherwise slip straight past a
  // check keyed on the granted permission's own name).
  const systemTenantOnlyPrefixes = [
    "access://tenants/",
    "access://identities/",
    "access://sessions/",
    "access://permissions/",
  ];
  const systemTenantViewablePermissions = [
    "access://identities/view",
    "access://sessions/view",
    "access://permissions/view",
  ];

  const requiresSystemTenant = (permission: string) => {
    const name = permission.toLowerCase();

    return (
      systemTenantOnlyPrefixes.some((prefix) => name.startsWith(prefix)) &&
      !systemTenantViewablePermissions.includes(name)
    );
  };

  const hasPermission = (permission: string) => {
    if (!tenantId.value) {
      return false;
    }

    if (
      requiresSystemTenant(permission) &&
      tenantId.value !== configuration.accessSystemTenantId
    ) {
      return false;
    }

    const required = permission.toLowerCase();

    let result = false;

    activePermissions.value.forEach((item) => {
      if (result) {
        return;
      }

      if (item.name.toLowerCase() === required) {
        result = true;
        return;
      }

      if (item.name.includes("*")) {
        const escaped = item.name
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\\\*/g, ".*");

        const regex = new RegExp(`^${escaped}$`, "i");

        if (regex.test(required)) {
          result = true;
        }
      }
    });

    return result;
  };

  const systemTenantActive = computed(() => {
    return tenantId.value === configuration.accessSystemTenantId;
  });

  const getTenantName = (id: string) => {
    return tenants.value.find((t) => t.id === id)?.name ?? null;
  };

  const tenant = computed(() => {
    return tenants.value.find((t) => t.id === tenantId.value) ?? null;
  });

  return {
    isAuthenticated,
    isInitialized,
    identityName,
    token,
    tenant,
    tenantId,
    activePermissions,
    sessionPermissions,
    status,
    tenants,
    systemTenantActive,
    initialize,
    register,
    signIn,
    signOut,
    oauth,
    hasSession,
    hasPermission,
    selectTenantId,
    getTenantName,
  };
});
