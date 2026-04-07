import type { Request } from "express";

export interface AuthPayload {
  userId: string;
  tenantId?: string;
  email?: string;
  scopes: string[];
  isApiKey?: boolean;
  isPlatformKey?: boolean;
  apiKeyToken?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
}

export interface TenantContext {
  tenant: TenantInfo;
  userId: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
  tenantContext?: TenantContext;
}
