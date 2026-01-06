import { getEnv } from "../config/env";

// PUBLIC_INTERFACE
export function createApiClient() {
  /**
   * Minimal fetch wrapper. Not relied upon for offline functionality.
   * @returns {{ baseUrl: string, get: Function, post: Function, put: Function, del: Function }}
   */
  const { apiBase, backendUrl } = getEnv();
  const baseUrl = (apiBase || backendUrl || "").replace(/\/+$/, "");

  async function request(path, options) {
    const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    return res.text();
  }

  return {
    baseUrl,
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    del: (path) => request(path, { method: "DELETE" }),
  };
}
