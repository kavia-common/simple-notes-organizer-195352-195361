import React from "react";
import styles from "./Toasts.module.css";

// PUBLIC_INTERFACE
export function Toasts({ toasts, onDismiss }) {
  /** Renders stacked toasts in the corner. */
  return (
    <div className={styles.container} aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className={[styles.toast, styles[t.kind]].join(" ")}>
          <div className={styles.content}>
            {t.title ? <div className={styles.title}>{t.title}</div> : null}
            {t.message ? <div className={styles.message}>{t.message}</div> : null}
          </div>
          <button className={styles.dismiss} onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
