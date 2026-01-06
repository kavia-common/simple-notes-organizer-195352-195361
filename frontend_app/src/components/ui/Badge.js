import React from "react";
import styles from "./Badge.module.css";

// PUBLIC_INTERFACE
export function Badge({ children, variant = "default", className = "" }) {
  /** Small badge/tag primitive. */
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
