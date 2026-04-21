export const APP_ROLES = [
  "owner",
  "admin",
  "manager",
  "frontdesk",
  "professional",
  "client",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STAFF_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "manager",
  "frontdesk",
  "professional",
] as const;

export type AppPermission =
  | "dashboard:view"
  | "appointments:read"
  | "appointments:write"
  | "clients:read"
  | "clients:write"
  | "services:read"
  | "services:write"
  | "reports:read"
  | "settings:read"
  | "settings:write"
  | "payments:create"
  | "notifications:send";

export const PERMISSION_MATRIX: Record<AppRole, readonly AppPermission[]> = {
  owner: [
    "dashboard:view",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "clients:write",
    "services:read",
    "services:write",
    "reports:read",
    "settings:read",
    "settings:write",
    "payments:create",
    "notifications:send",
  ],
  admin: [
    "dashboard:view",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "clients:write",
    "services:read",
    "services:write",
    "reports:read",
    "settings:read",
    "settings:write",
    "payments:create",
    "notifications:send",
  ],
  manager: [
    "dashboard:view",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "clients:write",
    "services:read",
    "services:write",
    "reports:read",
    "settings:read",
    "payments:create",
  ],
  frontdesk: [
    "dashboard:view",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "clients:write",
    "services:read",
    "payments:create",
  ],
  professional: [
    "dashboard:view",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "services:read",
    "payments:create",
  ],
  client: ["appointments:read", "appointments:write", "services:read", "payments:create"],
};

export function normalizeRole(input: string | null | undefined): AppRole {
  if (!input) return "client";
  const lower = input.toLowerCase();
  return (APP_ROLES as readonly string[]).includes(lower) ? (lower as AppRole) : "client";
}

export function isStaffRole(role: AppRole | null | undefined): boolean {
  if (!role) return false;
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function hasPermission(role: AppRole, permission: AppPermission): boolean {
  return PERMISSION_MATRIX[role].includes(permission);
}
