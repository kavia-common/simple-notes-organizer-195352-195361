import React from "react";
import styles from "./Sidebar.module.css";
import { Badge } from "./ui/Badge";

// PUBLIC_INTERFACE
export function Sidebar({ activeSection, onSelectSection, stats }) {
  /** Left navigation sidebar scaffold (future: tags, folders). */
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden="true">
          N
        </div>
        <div>
          <div className={styles.brandTitle}>Ocean Notes</div>
          <div className={styles.brandSub}>Simple. Local-first.</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Notes navigation">
        <button
          className={[styles.navItem, activeSection === "all" ? styles.active : ""].join(" ")}
          onClick={() => onSelectSection("all")}
        >
          <span>All Notes</span>
          <Badge className={styles.count} variant="default">
            {stats.total}
          </Badge>
        </button>

        <button
          className={[styles.navItem, activeSection === "favorites" ? styles.active : ""].join(" ")}
          onClick={() => onSelectSection("favorites")}
        >
          <span>Favorites</span>
          <Badge className={styles.count} variant="amber">
            {stats.favorites}
          </Badge>
        </button>

        <div className={styles.sectionTitle}>Coming soon</div>
        <div className={styles.futureList}>
          <div className={styles.futureItem}>Tags</div>
          <div className={styles.futureItem}>Pinned</div>
          <div className={styles.futureItem}>Shared</div>
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerHint}>Stored locally in your browser.</div>
      </div>
    </aside>
  );
}
