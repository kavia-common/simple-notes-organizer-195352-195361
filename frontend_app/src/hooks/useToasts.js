import { useCallback, useMemo, useState } from "react";

function makeToastId() {
  return `toast_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// PUBLIC_INTERFACE
export function useToasts() {
  /**
   * Lightweight toast manager (no external libs).
   * @returns {{ toasts: Array, pushToast: Function, removeToast: Function }}
   */
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = makeToastId();
      const next = {
        id,
        kind: toast.kind || "info", // info | success | error
        title: toast.title || "",
        message: toast.message || "",
        timeoutMs: Number.isFinite(toast.timeoutMs) ? toast.timeoutMs : 2800,
      };
      setToasts((prev) => [next, ...prev]);

      if (next.timeoutMs > 0) {
        window.setTimeout(() => removeToast(id), next.timeoutMs);
      }
      return id;
    },
    [removeToast]
  );

  return useMemo(() => ({ toasts, pushToast, removeToast }), [toasts, pushToast, removeToast]);
}
