import React from "react";
import styles from "./EmptyState.module.css";
import { Button } from "./ui/Button";

// PUBLIC_INTERFACE
export function EmptyState({ title, description, actionLabel, onAction }) {
  /** Friendly empty state for when no notes match / no selection. */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          📝
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.desc}>{description}</div>
        {actionLabel ? (
          <div className={styles.actions}>
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
