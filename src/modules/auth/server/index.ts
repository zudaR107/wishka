export { isValidEmail, normalizeEmail } from "@/modules/auth/server/email";
export {
  type LoginUserResult,
  validateLoginUserInput,
} from "@/modules/auth/server/login-input";
export { loginUser } from "@/modules/auth/server/login";
export { logoutUser } from "@/modules/auth/server/logout";
export { hashPassword, verifyPassword } from "@/modules/auth/server/password";
export {
  type CurrentUser,
  getCurrentSession,
  getCurrentSessionToken,
  getCurrentUser,
  requireCurrentUser,
} from "@/modules/auth/server/current-user";
export {
  MIN_PASSWORD_LENGTH,
  validateRegisterUserInput,
} from "@/modules/auth/server/register-input";
export {
  AUTH_SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
} from "@/modules/auth/server/session";
export {
  registerUser,
} from "@/modules/auth/server/register";
