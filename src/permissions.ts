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
  Workflow: {
    Processes: {
      Manage: "workflow://processes/manage",
      View: "workflow://processes/view",
    },
    ProcessDefinitions: {
      Manage: "workflow://process-definitions/manage",
      View: "workflow://process-definitions/view",
    },
    Semaphores: {
      Manage: "workflow://semaphores/manage",
      View: "workflow://semaphores/view",
    },
    States: {
      Manage: "workflow://states/manage",
      View: "workflow://states/view",
    },
  },
};

export default Permissions;
