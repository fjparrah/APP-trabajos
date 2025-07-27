// src/auth/useAuth.ts
export function useAuth() {
  const access = localStorage.getItem("access");
  return {
    isAuthenticated: !!access,
    accessToken: access,
  };
}
