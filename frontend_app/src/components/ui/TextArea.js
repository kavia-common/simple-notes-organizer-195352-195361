import React from "react";
import styles from "./TextArea.module.css";

// PUBLIC_INTERFACE
export function TextArea({ className = "", ...props }) {
  /** Theme-aware textarea primitive. */
  return <textarea className={[styles.textarea, className].filter(Boolean).join(" ")} {...props} />;
}
