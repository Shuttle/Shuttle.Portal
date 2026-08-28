import type { Api } from "./enums";

export type Alert = {
  message: string;
  name: string;
  type?: "error" | "success" | "warning" | "info" | undefined;
  expire?: boolean;
  expirySeconds?: number;
  expiryDate?: Date;
  dismissable?: boolean;
  key?: string;
  variant?: string;
  visiblePercentage?: number;
};

export type Configuration = {
  isOk: () => boolean;
  getErrorMessage: () => string;
  getAccessUrl: () => string;
  getRecallUrl: () => string;
  getAbacusUrl: () => string;
  isAccessAvailable: () => boolean;
  isRecallAvailable: () => boolean;
  isAbacusAvailable: () => boolean;
  isAccessPasswordAuthenticationAllowed: () => boolean;
  isDebugging: () => boolean;
  getApiUrl: (api: Api, path: string) => string;
  accessSystemTenantId: string;
};

export type ChangePassword = {
  id: string;
  token: string;
  newPassword: string;
};

export type ConfirmationItem = {
  name: string;
  getConfirmationMessage: () => string;
  touched?: boolean;
  unwatch?: WatchHandle;
};

export type ConfirmationOptions = {
  item?: any;
  messageKey?: string;
  messageText?: string;
  titleKey?: string;
  titleText?: string;
};

export type ConfirmationResult = {
  confirmed: boolean;
  item?: any;
};

export type Credentials = {
  identityName: string;
  token?: string;
  password?: string;
  tenantId?: string;
};

export type DashboardItem = {
  route: string;
  title: string;
  value: number;
  svg: string;
  permission: string;
};

export type DrawerOptions = {
  parentPath: string;
  refresh: () => Promise<void>;
};

export type DrawerSize = "compact" | "expanded" | "full" | undefined;

export type EnvelopeHeader = {
  key: string;
  value: string;
};

export type Env = {
  VITE_ACCESS_API_URL: string;
  VITE_RECALL_API_URL?: string;
  VITE_ABACUS_API_URL?: string;
};

export type Event = {
  primitiveEvent: PrimitiveEvent;
  eventEnvelope: EventEnvelope;
  domainEvent: string;
};

export type EventEnvelope = {
  assemblyQualifiedName: string;
  compressionAlgorithm: string;
  encryptionAlgorithm: string;
  event: Uint8Array;
  eventDate: Date;
  eventId: string;
  eventType: string;
  headers: EnvelopeHeader[];
  version: number;
};

export type EventStore = {
  name: string;
  hasAccess: boolean;
};

export type EventStoreResponse<T> = {
  items: T[];
};

export type EventSpecification = {
  id?: string;
  eventTypes?: string[];
  maximumRows?: number;
  sequenceNumberStart?: number;
};

export type EventType = {
  id: string;
  typeName: string;
};

export type PrimitiveEvent = {
  recordedAt: Date;
  eventEnvelope: Uint8Array;
  eventId: string;
  eventType: string;
  id: string;
  correlationId?: string | null;
  sequenceNumber: number;
  version: number;
};

export type FormDrawer = {
  closePath: string;
};

export type FormTitle = {
  title: string;
  closeDrawer?: boolean;
  closePath?: string;
  closeClick?: () => void;
  type?: "borderless" | "normal";
};

export type IdentifierAvailability = {
  id: string;
  active: boolean;
};

export type Identity = {
  dateActivated?: Date | null;
  dateRegistered: Date;
  description?: string;
  generatedPassword: string;
  id: string;
  name: string;
  registeredBy: string;
  roles: IdentityRole[] | undefined;
  tenants: IdentityTenant[] | undefined;
  tab?: string;
};

export type IdentityRole = {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
};

export type IdentitySpecification = {
  ids: string[];
  nameMatch: string;
  shouldIncludePermissions: boolean;
  shouldIncludeRoles: boolean;
  shouldIncludeTenants: boolean;
};

export type IdentityTenant = {
  id: string;
  name: string;
};

export type NavigationItem = {
  section?: string;
  permission?: string;
  title: string;
  to: string;
  icon?: string;
};

export type OAuthData = {
  code: string;
  state: string;
};

export type Permission = {
  id: string;
  name: string;
  description: string;
  status: number;
};

export type SelectItem = {
  value: string;
  title: string;
};

export type Status = {
  text: string;
  value: number;
};

export type Role = {
  tab?: string;
  id: string;
  name: string;
  permissions?: Permission[];
  identities?: RoleIdentity[];
};

export type RoleIdentity = {
  id: string;
  name: string;
  description?: string;
};

export type RegisterIdentity = {
  name: string;
  description: string;
  password: string;
};

export type RegisterPermission = {
  name: string;
  description: string;
  status: number;
};

export type RegisterTenant = {
  id?: string;
  name: string;
  logoSvg?: string;
  logoUrl?: string;
  status: number;
  maximumIdentities: number;
  administratorIdentityName?: string;
};

export type AccessServerConfiguration = {
  allowPasswordAuthentication: boolean;
  systemTenantId: string;
};

export type Session = {
  id: string;
  identityId: string;
  identityName: string;
  identityDescription: string;
  permissions: SessionPermission[];
  tokens: SessionToken[];
  expiryDate?: Date;
  dateRegistered?: Date;
  tab?: string;
};

export type SessionPermission = {
  id: string;
  name: string;
  tenantId: string;
};

export type SessionToken = {
  id: string;
  tokenHash: number[];
  application: string;
  expiryDate: Date;
  dateRegistered: Date;
};

export type SessionResponse = {
  session?: Session;
  registrationRequested: boolean;
  result: string;
  token: string | null;
  tenants: Tenant[];
};

export type Argument = {
  id: string;
  name: string;
  dataTypeName: string;
};

export type ArgumentValue = {
  value: string;
};

export type Formula = {
  id: string;
  name: string;
};

export type FormulaOperation = {
  id?: string;
  operation: string;
  valueProviderName: string;
  inputParameter: string;
};

export type FormulaConstraint = {
  id?: string;
  argumentId: string;
  comparison: string;
  value: string;
};

export type Matrix = {
  id?: string;
  name: string;
  rowArgumentId: string;
  columnArgumentId?: string | null;
  dataTypeName: string;
};

export type MatrixConstraint = {
  axis: string;
  index: number;
  comparison: string;
  value: string;
};

export type MatrixElement = {
  row: number;
  column: number;
  value: string;
};

export type AbacusTest = {
  id: string;
  name: string;
  formulaId: string;
  expectedResult: string;
  expectedResultDataTypeName: string;
  comparison: string;
};

export type TestArgument = {
  argumentId: string;
  value: string;
};

export type TestRunResult = {
  passed: boolean;
  exception?: string | null;
  result: number;
  logLines: { indent: number; text: string }[];
  results: { formulaName: string; value: number; depth: number }[];
};

export type Tenant = {
  id: string;
  name: string;
  logoSvg?: string;
  logoUrl?: string;
  status?: number;
  maximumIdentities?: number;
  administratorIdentityName?: string;
};
