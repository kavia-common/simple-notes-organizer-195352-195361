import React from "react";
import styles from "./SearchBar.module.css";
import { Input } from "./ui/Input";

// PUBLIC_INTERFACE
export function SearchBar({ value, onChange }) {
  /** Controlled search input for filtering notes. */
  return (
    <div className={styles.container}>
      <div className={styles.icon} aria-hidden="true">
        ⌕
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes…"
        aria-label="Search notes"
        className={styles.input}
      />
    </div>
  );
}
