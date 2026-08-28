import type { NavigationItem } from "@/portal";
import Permissions from "../permissions";
import {
  mdiAccount,
  mdiAccountGroup,
  mdiBadgeAccount,
  mdiDatabaseClockOutline,
  mdiDomain,
  mdiFunctionVariant,
  mdiGrid,
  mdiShield,
  mdiTable,
  mdiTestTube,
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
    section: "abacus",
    to: "/arguments",
    title: "arguments",
    permission: Permissions.Arguments.Manage,
    icon: mdiTable,
  },
  {
    section: "abacus",
    to: "/formulas",
    title: "formulas",
    permission: Permissions.Formulas.Manage,
    icon: mdiFunctionVariant,
  },
  {
    section: "abacus",
    to: "/matrices",
    title: "matrices",
    permission: Permissions.Matrices.Manage,
    icon: mdiGrid,
  },
  {
    section: "abacus",
    to: "/tests",
    title: "tests",
    permission: Permissions.Tests.Manage,
    icon: mdiTestTube,
  },
];

export default map;
