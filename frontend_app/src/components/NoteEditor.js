import React, { useEffect, useMemo, useState } from "react";
import styles from "./NoteEditor.module.css";
import { Input } from "./ui/Input";
import { TextArea } from "./ui/TextArea";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// PUBLIC_INTERFACE
export function NoteEditor({ note, onChangeDraft, onSave, onCancelNew, savingDisabled, isNew }) {
  /**
   * Editor panel for the selected note or new note draft.
   * Controlled via parent draft state.
   */
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTouched(false);
  }, [note?.id]);

  const titleError = useMemo(() => {
    if (!touched) return "";
    if (!note?.title?.trim()) return "Title is required.";
    return "";
  }, [note?.title, touched]);

  if (!note) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitle}>{isNew ? "New note" : "Edit note"}</div>
          <div className={styles.headerMeta}>
            {note.favorite ? <Badge variant="amber">Favorite</Badge> : null}
            {!isNew ? <span>Updated {new Date(note.updatedAt).toLocaleString()}</span> : <span>Not saved yet</span>}
          </div>
        </div>
        <div className={styles.headerRight}>
          {isNew ? (
            <Button variant="ghost" onClick={onCancelNew}>
              Cancel
            </Button>
          ) : null}
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              onSave();
            }}
            disabled={savingDisabled}
            aria-label="Save note"
          >
            Save
          </Button>
        </div>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>
          <div className={styles.labelText}>Title</div>
          <Input
            value={note.title}
            onChange={(e) => onChangeDraft({ title: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="Untitled note"
            aria-label="Note title"
          />
          {titleError ? <div className={styles.error} role="alert">{titleError}</div> : null}
        </label>

        <label className={styles.label}>
          <div className={styles.labelText}>Body</div>
          <TextArea
            value={note.body}
            onChange={(e) => onChangeDraft({ body: e.target.value })}
            placeholder="Write your note…"
            aria-label="Note body"
          />
        </label>
      </div>
    </div>
  );
}
