import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { useAlertStore } from "@/stores/alert";
import Permissions from "../permissions";
import { i18n } from "@/i18n";
import Dashboard from "../views/Dashboard.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "",
    component: Dashboard,
  },
  {
    path: "/",
    component: Dashboard,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
  },
  {
    path: "/identities",
    name: "identities",
    component: () => import("../views/Access/Identities.vue"),
    meta: {
      permission: Permissions.Identities.View,
    },
    children: [
      {
        path: "identity",
        name: "identity",
        component: () => import("../views/Access/Identity.vue"),
        meta: {
          permission: Permissions.Identities.Manage,
        },
      },
      {
        path: "password/:id",
        name: "identity-password",
        props: true,
        component: () => import("../views/Access/Password.vue"),
      },
      {
        path: "identity/:id/description",
        name: "identity-description",
        component: () => import("../views/Access/IdentityDescription.vue"),
        props: true,
        meta: {
          permission: Permissions.Identities.Manage,
        },
      },
      {
        path: "identity/:id/rename",
        name: "identity-rename",
        component: () => import("../views/Access/IdentityRename.vue"),
        props: true,
        meta: {
          permission: Permissions.Identities.Manage,
        },
      },
      {
        path: "/identities/:id/roles",
        name: "identity-roles",
        component: () => import("../views/Access/IdentityRoles.vue"),
        meta: {
          permission: Permissions.Identities.View,
        },
      },
      {
        path: "/identities/:id/tenants",
        name: "identity-tenants",
        component: () => import("../views/Access/IdentityTenants.vue"),
        meta: {
          permission: Permissions.Identities.View,
        },
      },
    ],
  },
  {
    path: "/oauth",
    name: "oauth",
    component: () => import("../views/Access/OAuth.vue"),
  },
  {
    path: "/password/:id",
    name: "password",
    props: true,
    component: () => import("../views/Access/Password.vue"),
  },
  {
    path: "/permissions",
    name: "permissions",
    component: () => import("../views/Access/Permissions.vue"),
    meta: {
      permission: Permissions.Permissions.View,
    },
    children: [
      {
        path: "permission",
        name: "permission",
        component: () => import("../views/Access/Permission.vue"),
        meta: {
          permission: Permissions.Permissions.Manage,
        },
      },
      {
        path: ":id/rename",
        name: "permission-rename",
        component: () => import("../views/Access/PermissionRename.vue"),
        props: true,
        meta: {
          permission: Permissions.Permissions.Manage,
        },
      },
      {
        path: "permission/:id/permission",
        name: "permission-description",
        component: () => import("../views/Access/PermissionDescription.vue"),
        props: true,
        meta: {
          permission: Permissions.Identities.Manage,
        },
      },
      {
        path: "permission/upload",
        name: "permission-upload",
        component: () => import("../views/Access/PermissionUpload.vue"),
        meta: {
          permission: Permissions.Permissions.Manage,
        },
      },
    ],
  },
  {
    path: "/roles",
    name: "roles",
    component: () => import("../views/Access/Roles.vue"),
    meta: {
      permission: Permissions.Roles.View,
    },
    children: [
      {
        path: "role",
        name: "role",
        component: () => import("../views/Access/Role.vue"),
        meta: {
          permission: Permissions.Roles.Manage,
        },
      },
      {
        path: "role/:id/rename",
        name: "role-rename",
        component: () => import("../views/Access/RoleRename.vue"),
        props: true,
        meta: {
          permission: Permissions.Roles.Manage,
        },
      },
      {
        path: "roles/:id/identities",
        name: "role-identities",
        props: true,
        component: () => import("../views/Access/RoleIdentities.vue"),
        meta: {
          permission: Permissions.Roles.Manage,
        },
      },
      {
        path: "roles/:id/permissions",
        name: "role-permissions",
        props: true,
        component: () => import("../views/Access/RolePermissions.vue"),
        meta: {
          permission: Permissions.Roles.View,
        },
      },
      {
        path: "role/upload",
        name: "role-upload",
        component: () => import("../views/Access/RoleUpload.vue"),
        meta: {
          permission: Permissions.Roles.Manage,
        },
      },
    ],
  },
  {
    path: "/sessions",
    name: "sessions",
    component: () => import("../views/Access/Sessions.vue"),
    meta: {
      permission: Permissions.Sessions.View,
    },
  },
  {
    path: "/tenants",
    name: "tenants",
    component: () => import("../views/Access/Tenants.vue"),
    meta: {
      permission: Permissions.Tenants.View,
    },
    children: [
      {
        path: "tenant",
        name: "tenant",
        component: () => import("../views/Access/Tenant.vue"),
        meta: {
          permission: Permissions.Tenants.Manage,
        },
      },
    ],
  },
  {
    path: "/tenant-selection",
    name: "tenant-selection",
    component: () => import("../views/Access/TenantSelection.vue"),
  },
  {
    path: "/event-store-selection",
    name: "event-store-selection",
    component: () => import("../views/Recall/EventStoreSelection.vue"),
  },
  {
    path: "/sign-in",
    name: "sign-in",
    props: true,
    component: () => import("../views/Access/SignIn.vue"),
  },
  {
    path: "/recall/events",
    name: "events",
    meta: { authenticated: true, permission: Permissions.Events.View },
    component: () => import("../views/Recall/Events.vue"),
  },
  {
    path: "/recall/projections",
    name: "projections",
    meta: { authenticated: true, permission: Permissions.Projections.View },
    component: () => import("../views/Recall/Projections.vue"),
  },
  {
    path: "/workflow/processes/:id/continue/:token",
    name: "workflow-process-continuation",
    component: () => import("../views/Workflow/ProcessContinuation.vue"),
    props: true,
  },
  {
    path: "/workflow/processes",
    name: "workflow-processes",
    component: () => import("../views/Workflow/Processes.vue"),
    meta: {
      permission: Permissions.Workflow.Processes.View,
    },
    children: [
      {
        path: "process/:id?",
        name: "workflow-process",
        component: () => import("../views/Workflow/Process.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.Processes.Manage,
        },
      },
      {
        path: "abandon/:id?",
        name: "workflow-process-abandon",
        component: () => import("../views/Workflow/ProcessAbandon.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.Processes.Manage,
        },
      },
      {
        path: "process/:processId/message",
        name: "workflow-process-message",
        component: () => import("../views/Workflow/ProcessMessage.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.Processes.Manage,
        },
      },
      {
        path: "items/:id?",
        name: "workflow-process-state-items",
        component: () => import("../views/Workflow/StateItems.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.States.Manage,
        },
      },
    ],
  },
  {
    path: "/arguments",
    name: "arguments",
    component: () => import("../views/Abacus/Arguments.vue"),
    meta: {
      permission: Permissions.Arguments.Manage,
    },
    children: [
      {
        path: "argument",
        name: "argument",
        component: () => import("../views/Abacus/Argument.vue"),
        meta: {
          permission: Permissions.Arguments.Manage,
        },
      },
      {
        path: "argument/:id/rename",
        name: "argument-rename",
        component: () => import("../views/Abacus/ArgumentRename.vue"),
        props: true,
        meta: {
          permission: Permissions.Arguments.Manage,
        },
      },
    ],
  },
  {
    path: "/arguments/:id/values",
    name: "argument-values",
    props: true,
    component: () => import("../views/Abacus/ArgumentValues.vue"),
    meta: {
      permission: Permissions.Arguments.Manage,
    },
  },
  {
    path: "/algorithms",
    name: "algorithms",
    component: () => import("../views/Abacus/Algorithms.vue"),
    meta: {
      permission: Permissions.Algorithms.Manage,
    },
    children: [
      {
        path: "algorithm",
        name: "algorithm",
        component: () => import("../views/Abacus/Algorithm.vue"),
        meta: {
          permission: Permissions.Algorithms.Manage,
        },
      },
      {
        path: "algorithm/:id/rename",
        name: "algorithm-rename",
        component: () => import("../views/Abacus/AlgorithmRename.vue"),
        props: true,
        meta: {
          permission: Permissions.Algorithms.Manage,
        },
      },
    ],
  },
  {
    path: "/workflow/states",
    name: "workflow-states",
    component: () => import("../views/Workflow/States.vue"),
    meta: {
      permission: Permissions.Workflow.States.View,
    },
    children: [
      {
        path: "state/:id?",
        name: "workflow-state",
        component: () => import("../views/Workflow/State.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.States.Manage,
        },
      },
      {
        path: "items/:id?",
        name: "workflow-state-items",
        component: () => import("../views/Workflow/StateItems.vue"),
        props: true,
        meta: {
          permission: Permissions.Workflow.States.Manage,
        },
      },
    ],
  },
  {
    path: "/workflow/semaphores",
    name: "workflow-semaphores",
    component: () => import("../views/Workflow/Semaphores.vue"),
    meta: {
      permission: Permissions.Workflow.Semaphores.View,
    },
  },
  {
    path: "/algorithms/:id/operations",
    name: "algorithm-operations",
    props: true,
    component: () => import("../views/Abacus/AlgorithmOperations.vue"),
    meta: {
      permission: Permissions.Algorithms.Manage,
    },
  },
  {
    path: "/algorithms/:id/constraints",
    name: "algorithm-constraints",
    props: true,
    component: () => import("../views/Abacus/AlgorithmConstraints.vue"),
    meta: {
      permission: Permissions.Algorithms.Manage,
    },
  },
  {
    path: "/matrices",
    name: "matrices",
    component: () => import("../views/Abacus/Matrices.vue"),
    meta: {
      permission: Permissions.Matrices.Manage,
    },
    children: [
      {
        path: "matrix/:id?",
        name: "matrix",
        component: () => import("../views/Abacus/Matrix.vue"),
        props: true,
        meta: {
          permission: Permissions.Matrices.Manage,
        },
      },
    ],
  },
  {
    path: "/matrices/:id/grid",
    name: "matrix-grid",
    props: true,
    component: () => import("../views/Abacus/MatrixGrid.vue"),
    meta: {
      permission: Permissions.Matrices.Manage,
    },
  },
  {
    path: "/tests",
    name: "tests",
    component: () => import("../views/Abacus/Tests.vue"),
    meta: {
      permission: Permissions.Tests.Manage,
    },
    children: [
      {
        path: "test",
        name: "test",
        component: () => import("../views/Abacus/Test.vue"),
        meta: {
          permission: Permissions.Tests.Manage,
        },
      },
    ],
  },
  {
    path: "/tests/:id/arguments",
    name: "test-arguments",
    props: true,
    component: () => import("../views/Abacus/TestArguments.vue"),
    meta: {
      permission: Permissions.Tests.Manage,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const sessionStore = useSessionStore();

  if (!sessionStore.isInitialized) {
    try {
      await sessionStore.initialize();
    } catch (error: any) {
      useAlertStore().add({
        message: error.toString(),
        type: "error",
        name: "session-initialize",
      });
      if (!window.location.pathname.startsWith("/sign-in")) {
        router.push({ path: "/sign-in" });
      }
    }
  }

  if (
    !!to.meta.permission &&
    !sessionStore.hasPermission(to.meta.permission as string)
  ) {
    useAlertStore().add({
      message: i18n.global.t("exceptions.insufficient-permission"),
      type: "info",
      name: "insufficient-permission",
    });

    return false;
  }

  if (
    !!to.meta.authenticated &&
    !sessionStore.isAuthenticated &&
    to.name !== "sign-in"
  ) {
    return { name: "sign-in" };
  }
});

export default router;
