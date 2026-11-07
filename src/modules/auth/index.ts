/**
 * src/modules/auth/index.ts
 * Public API modul Autentikasi, Sesi, dan Otorisasi (RBAC).
 * Digunakan sebagai satu-satunya titik masuk impor lintas-modul.
 */

// Tipe Data
export type {
  AuthenticatedUser,
  UserSession,
  LoginCredentials,
  LoginResult,
  ChangePasswordInput,
  ChangePasswordResult,
} from "./types";
export type { UserRoleRecord } from "./repositories/rbac.repository";
export type {
  RequirePermissionOptions,
  PermissionContext,
} from "./helpers/require-permission";

// Skema & Validasi
export { loginSchema, type LoginInput } from "./schemas/login.schema";
export {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "./schemas/change-password.schema";

// Helper & Otorisasi Server
export {
  requireUser,
  getCurrentUser,
  getSessionCookieName,
} from "./helpers/require-user";
export {
  requirePermission,
  hasPermission,
  getUserPermissions,
  getUserRoles,
  can,
} from "./helpers/require-permission";
export { normalizeIp, getClientIp } from "./helpers/ip";
export { hashSessionToken, generateSessionToken } from "./helpers/token";
export { validatePasswordPolicy } from "./helpers/password-validator";
export { verifyActionOrigin, sanitizeRedirectPath } from "./helpers/origin-checker";

// Layanan Bisnis (Services)
export { authService, AuthService } from "./services/auth.service";
export { sessionService, SessionService } from "./services/session.service";
export { passwordService, PasswordService } from "./services/password.service";
export { rateLimitService, RateLimitService } from "./services/rate-limit.service";
export { rbacRepository } from "./repositories/rbac.repository";
export { rbacService, RbacService } from "./services/rbac.service";

// Server Actions
export { loginAction, type LoginActionResult } from "./actions/login.action";
export { logoutAction } from "./actions/logout.action";
export {
  changePasswordAction,
  type ChangePasswordActionResult,
} from "./actions/change-password.action";

// Komponen UI Form
export { LoginForm } from "./components/LoginForm";
export { ChangePasswordForm } from "./components/ChangePasswordForm";

// Konstanta & Katalog
export {
  AUTH_COOKIE_NAME_DEV,
  AUTH_COOKIE_NAME_PROD,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  AUTH_INVALID_CREDENTIALS_MSG,
  AUTH_ACCOUNT_LOCKED_MSG,
} from "./constants";
export {
  SYSTEM_PERMISSIONS,
  type SystemPermissionCode,
  type SystemPermissionDef,
} from "./permissions";
