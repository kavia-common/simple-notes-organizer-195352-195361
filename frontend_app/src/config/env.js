// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns env vars used for future backend integration (must not be required). */
  return {
    apiBase: (process.env.REACT_APP_API_BASE || "").trim(),
    backendUrl: (process.env.REACT_APP_BACKEND_URL || "").trim(),
  };
}

// PUBLIC_INTERFACE
export function isApiEnabled() {
  /** True when a backend base URL is provided; app still works offline if false. */
  const { apiBase, backendUrl } = getEnv();
  return Boolean(apiBase || backendUrl);
}
