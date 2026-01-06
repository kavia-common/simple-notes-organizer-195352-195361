import React from "react";
import styles from "./Button.module.css";

// PUBLIC_INTERFACE
export function Button({ variant = "primary", size = "md", type = "button", className = "", ...props }) {
  /** Theme-aware button primitive. */
  const classes = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...props} />;
}
