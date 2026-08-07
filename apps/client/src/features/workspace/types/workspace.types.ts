export enum SSO_PROVIDER {
  OIDC = 'oidc',
  SAML = 'saml',
  GOOGLE = 'google',
  LDAP = 'ldap',
}

export interface IAuthProvider {
  id: string;
  name: string;
  type: SSO_PROVIDER;
  samlUrl: string;
  samlCertificate: string;
  oidcIssuer: string;
  oidcClientId: string;
  oidcClientSecret: string;
  ldapUrl: string;
  ldapBindDn: string;
  ldapBindPassword: string;
  ldapBaseDn: string;
  ldapUserSearchFilter: string;
  ldapUserAttributes: any;
  ldapTlsEnabled: boolean;
  ldapTlsCaCert: string;
  allowSignup: boolean;
  isEnabled: boolean;
  groupSync: boolean;
  creatorId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  providerId: string;
}

export interface IWorkspace {
  id: string;
  name: string;
  description: string;
  logo: string;
  hostname: string;
  defaultSpaceId: string;
  customDomain: string;
  enableInvite: boolean;
  settings: IWorkspaceSettings;
  status: string;
  enforceSso: boolean;
  stripeCustomerId: string;
  billingEmail: string;
  trialEndAt: Date;
  createdAt: Date;
  updatedAt: Date;
  emailDomains: string[];
  memberCount?: number;
  plan?: string;
  enforceMfa?: boolean;
  aiSearch?: boolean;
  generativeAi?: boolean;
  disablePublicSharing?: boolean;
  mcpEnabled?: boolean;
  trashRetentionDays?: number;
  restrictApiToAdmins?: boolean;
  allowMemberTemplates?: boolean;
  allowPersonalSpaces?: boolean;
  defaultPageEditMode?: string;
  isScimEnabled?: boolean;
}

export interface IWorkspaceSettings {
  ai?: IWorkspaceAiSettings;
  sharing?: IWorkspaceSharingSettings;
  api?: IWorkspaceApiSettings;
  templates?: IWorkspaceTemplateSettings;
  spaces?: IWorkspaceSpaceSettings;
  defaultPageEditMode?: string;
  branding?: IWorkspaceBrandingSettings;
}

export interface IWorkspaceBrandingSettings {
  favicon?: string | null;
}

export interface IWorkspaceApiSettings {
  restrictToAdmins?: boolean;
}

export interface IWorkspaceAiSettings {
  search?: boolean;
  generative?: boolean;
  mcp?: boolean;
  chat?: boolean;
}

export interface IWorkspaceSharingSettings {
  disabled?: boolean;
}

export interface IWorkspaceTemplateSettings {
  allowMemberTemplates?: boolean;
}

export interface IWorkspaceSpaceSettings {
  allowPersonal?: boolean;
}

export interface ICreateInvite {
  role: string;
  emails: string[];
  groupIds: string[];
}

export interface IInvitation {
  id: string;
  role: string;
  email: string;
  workspaceId: string;
  invitedById: string;
  createdAt: Date;
  enforceSso: boolean;
}

export interface IInvitationLink {
  inviteLink: string;
}

export interface IAcceptInvite {
  invitationId: string;
  name: string;
  password: string;
  token: string;
}

export interface IPublicWorkspace {
  id: string;
  name: string;
  logo: string;
  hostname: string;
  enforceSso: boolean;
  authProviders: IAuthProvider[];
}

export interface IVersion {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}
