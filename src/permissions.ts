const Permissions = {
  Identities: {
    Activate: "access://identities/activate",
    Manage: "access://identities/manage",
    Register: "access://identities/register",
    Remove: "access://identities/remove",
    View: "access://identities/view",
  },
  Permissions: {
    Manage: "access://permissions/manage",
    Register: "access://permissions/register",
    Remove: "access://permissions/remove",
    View: "access://permissions/view",
  },
  Roles: {
    Manage: "access://roles/manage",
    Register: "access://roles/register",
    Remove: "access://roles/remove",
    View: "access://roles/view",
  },
  Sessions: {
    Manage: "access://sessions/manage",
    Remove: "access://sessions/remove",
    View: "access://sessions/view",
  },
  Tenants: {
    Manage: "access://tenants/manage",
    Register: "access://tenants/register",
    View: "access://tenants/view",
  },
  Events: {
    View: "recall://default/events",
  },
  Arguments: {
    Manage: "abacus://arguments/manage",
  },
  Formulas: {
    Manage: "abacus://formulas/manage",
  },
  Matrices: {
    Manage: "abacus://matrices/manage",
  },
  Tests: {
    Manage: "abacus://tests/manage",
  },
};

export default Permissions;
