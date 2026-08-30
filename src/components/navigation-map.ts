import type { NavigationItem } from "@/portal";
import Permissions from "../permissions";
import {
  mdiAccount,
  mdiAccountGroup,
  mdiBadgeAccount,
  mdiCogOutline,
  mdiDatabaseClockOutline,
  mdiDomain,
  mdiLockOutline,
  mdiShield,
  mdiSitemapOutline,
  mdiViewDashboard,
} from "@mdi/js";

const map: NavigationItem[] = [
  {
    section: "access",
    to: "/dashboard",
    title: "dashboard",
    icon: mdiViewDashboard,
  },
  {
    section: "access",
    to: "/identities",
    title: "identities",
    permission: Permissions.Identities.View,
    icon: mdiAccount,
  },
  {
    section: "access",
    to: "/roles",
    title: "roles",
    permission: Permissions.Roles.View,
    icon: mdiAccountGroup,
  },
  {
    section: "access",
    to: "/permissions",
    title: "permissions",
    permission: Permissions.Permissions.View,
    icon: mdiShield,
  },
  {
    section: "access",
    to: "/sessions",
    title: "sessions",
    permission: Permissions.Sessions.View,
    icon: mdiBadgeAccount,
  },
  {
    section: "access",
    to: "/tenants",
    title: "tenants",
    permission: Permissions.Tenants.View,
    icon: mdiDomain,
  },
  {
    section: "recall",
    to: "/recall/events",
    title: "events",
    permission: Permissions.Events.View,
    icon: mdiDatabaseClockOutline,
  },
  {
    section: "workflow",
    to: "/workflow/processes",
    title: "processes",
    permission: Permissions.Workflow.Processes.View,
    icon: mdiSitemapOutline,
  },
  {
    section: "workflow",
    to: "/workflow/states",
    title: "states",
    permission: Permissions.Workflow.States.View,
    icon: mdiCogOutline,
  },
  {
    section: "workflow",
    to: "/workflow/semaphores",
    title: "semaphores",
    permission: Permissions.Workflow.Semaphores.View,
    icon: mdiLockOutline,
  },
];

export default map;
