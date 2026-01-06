import React from "react";
import styles from "./LoadingState.module.css";

/**
 * PUBLIC_INTERFACE
 */
export function LoadingState({ title = "Loading…", description = "Please wait a moment." }) {
  /** Themed loading state card, used for initial load and operation-in-progress UI. */
  return (
    <div className={styles.container} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.card}>
        <div className={styles.spinner} aria-hidden="true" />
        <div className={styles.title}>{title}</div>
        <div className={styles.desc}>{description}</div>
      </div>
    </div>
  );
}
