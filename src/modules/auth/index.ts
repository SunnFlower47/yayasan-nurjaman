/**
 * src/modules/auth/index.ts
 * Public API modul Autentikasi, Sesi, RBAC, dan 2FA TOTP.
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
export type { RequirePartialSessionOptions } from "./helpers/require-partial-session";

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
export { requirePartialSession } from "./helpers/require-partial-session";
export {
  requireRecentReauth,
  ReauthRequiredError,
  isReauthValid,
} from "./helpers/require-recent-reauth";
export {
  requirePermission,
  hasPermission,
  getUserPermissions,
  getUserRoles,
} from "./helpers/require-permission";
export { normalizeIp, getClientIp } from "./helpers/ip";
export { hashSessionToken, generateSessionToken } from "./helpers/token";
export { validatePasswordPolicy } from "./helpers/password-validator";
export { verifyActionOrigin, sanitizeRedirectPath } from "./helpers/origin-checker";
export { setSessionCookie, clearSessionCookie } from "./helpers/cookies";
export {
  calculateTotpCode,
  verifyTotpCode,
  encodeBase32,
  decodeBase32,
  generateTotpSecret,
  buildTotpUri,
  generateTotpQrDataUrl,
} from "./helpers/totp";
export {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "./helpers/recovery-codes";

// Layanan Bisnis & Repositori
export { authService, AuthService } from "./services/auth.service";
export { sessionService, SessionService } from "./services/session.service";
export { passwordService, PasswordService } from "./services/password.service";
export { rateLimitService, RateLimitService } from "./services/rate-limit.service";
export { rbacRepository } from "./repositories/rbac.repository";
export { rbacService, RbacService } from "./services/rbac.service";
export {
  twoFactorRepository,
  TwoFactorRepository,
} from "./repositories/two-factor.repository";
export { twoFactorService, TwoFactorService } from "./services/two-factor.service";

// Server Actions
export { loginAction, type LoginActionResult } from "./actions/login.action";
export { logoutAction } from "./actions/logout.action";
export {
  changePasswordAction,
  type ChangePasswordActionResult,
} from "./actions/change-password.action";
export {
  confirm2FaSetupAction,
  type Setup2FaActionResult,
} from "./actions/setup-2fa.action";
export { verify2FaAction, type Verify2FaActionResult } from "./actions/verify-2fa.action";
export {
  regenerateRecoveryAction,
  type RegenerateRecoveryActionResult,
} from "./actions/regenerate-recovery.action";

// Komponen UI Form
export { LoginForm } from "./components/LoginForm";
export { ChangePasswordForm } from "./components/ChangePasswordForm";
export { TwoFactorSetupForm } from "./components/TwoFactorSetupForm";
export { TwoFactorVerifyForm } from "./components/TwoFactorVerifyForm";
export { SecuritySettingsView } from "./components/SecuritySettingsView";

// Konstanta & Katalog Izin
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
