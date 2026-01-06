import React from "react";
import styles from "./TopBar.module.css";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// PUBLIC_INTERFACE
export function TopBar({ onNewNote, activeSection, apiEnabled }) {
  /** Top header area for quick actions. */
  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.title}>Notes</div>
        <div className={styles.subtitle}>
          {activeSection === "favorites" ? "Your starred notes" : "All notes"}
        </div>
      </div>

      <div className={styles.right}>
        {apiEnabled ? <Badge className={styles.mode} variant="default">API mode</Badge> : <Badge className={styles.mode} variant="amber">Offline mode</Badge>}
        <Button onClick={onNewNote} variant="primary" aria-label="Create new note">
          + New note
        </Button>
      </div>
    </div>
  );
}
