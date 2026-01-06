import React, { useEffect, useMemo, useRef } from "react";
import styles from "./NotesList.module.css";

function optionId(noteId) {
  return `note-option-${noteId}`;
}

// PUBLIC_INTERFACE
export function NotesList({ notes, selectedId, onSelect, onToggleFavorite, onDelete }) {
  /** Scrollable notes list with keyboard navigation. */
  const listRef = useRef(null);

  const selectedIndex = useMemo(() => notes.findIndex((n) => n.id === selectedId), [notes, selectedId]);

  useEffect(() => {
    // Keep selected item in view.
    const el = listRef.current?.querySelector(`[data-note-id="${selectedId}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedId]);

  function onKeyDown(e) {
    if (notes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min((selectedIndex < 0 ? 0 : selectedIndex) + 1, notes.length - 1);
      onSelect(notes[next].id);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max((selectedIndex < 0 ? 0 : selectedIndex) - 1, 0);
      onSelect(notes[prev].id);
    }
    if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(notes[selectedIndex].id);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.list}
        ref={listRef}
        role="listbox"
        aria-label="Notes list"
        aria-activedescendant={selectedId ? optionId(selectedId) : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {notes.map((n) => (
          <div
            key={n.id}
            id={optionId(n.id)}
            data-note-id={n.id}
            className={[styles.item, n.id === selectedId ? styles.active : ""].join(" ")}
            role="option"
            aria-selected={n.id === selectedId}
            tabIndex={-1}
            onClick={() => onSelect(n.id)}
          >
            <div className={styles.itemHeader}>
              <div className={styles.itemTitle}>{n.title}</div>
              <div className={styles.itemActions} role="group" aria-label="Note actions">
                <button
                  className={[styles.iconBtn, n.favorite ? styles.starActive : ""].join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(n.id);
                  }}
                  aria-label={n.favorite ? "Unfavorite note" : "Favorite note"}
                  title={n.favorite ? "Unfavorite" : "Favorite"}
                  type="button"
                >
                  ★
                </button>
                <button
                  className={[styles.iconBtn, styles.deleteBtn].join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(n.id);
                  }}
                  aria-label="Delete note"
                  title="Delete"
                  type="button"
                >
                  🗑
                </button>
              </div>
            </div>
            <div className={styles.snippet}>{n.snippet || "No content yet…"}</div>
            <div className={styles.meta}>Updated {new Date(n.updatedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
