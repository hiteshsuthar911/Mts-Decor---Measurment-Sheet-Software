import { api } from './api';

const AUTH_KEY = 'MS_PRO_AUTH_V1';

// Step 1: Validate credentials and initialize 2FA challenge
export async function loginInit(username, password) {
  const result = await api.post('/auth/login-init', { username, password });
  return result; // { require2FA: true, challengeId, verificationCode, username, name }
}

// Step 2: Verify 6-digit OTP code and complete login
export async function loginVerify2FA(challengeId, code) {
  const result = await api.post('/auth/verify-2fa', { challengeId, code });
  const session = {
    token: result.token,
    id: result.user.id,
    username: result.user.username,
    name: result.user.name,
    role: result.user.role,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

// Direct Login (fallback)
export async function login(username, password) {
  try {
    const result = await api.post('/auth/login', { username, password });
    const session = {
      token: result.token,
      id: result.user.id,
      username: result.user.username,
      name: result.user.name,
      role: result.user.role,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    return null;
  }
}

// Verify current user's own password (for edit guard)
export async function verifyPassword(password) {
  try {
    const result = await api.post('/auth/verify-password', { password });
    return result.valid === true;
  } catch {
    return false;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() { return !!getSession(); }
export function isAdmin()    { return getSession()?.role === 'ADMIN'; }
export function isUser()     { return getSession()?.role === 'USER';  }

export const ADMIN_USERS = [
  { username: 'admin',    name: 'ADMINISTRATOR', role: 'ADMIN', defaultPassword: 'admin@123' },
  { username: 'jagdish',  name: 'JAGDISH',       role: 'USER',  defaultPassword: 'jagdish@123' },
  { username: 'madanlal', name: 'MADANLAL',      role: 'USER',  defaultPassword: 'madanlal@123' },
];
