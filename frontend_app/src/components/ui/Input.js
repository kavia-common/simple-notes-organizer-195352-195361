import React from "react";
import styles from "./Input.module.css";

// PUBLIC_INTERFACE
export function Input({ className = "", ...props }) {
  /** Theme-aware input primitive. */
  return <input className={[styles.input, className].filter(Boolean).join(" ")} {...props} />;
}
