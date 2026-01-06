import React, { useEffect, useMemo, useState } from "react";
import styles from "./NoteEditor.module.css";
import { Input } from "./ui/Input";
import { TextArea } from "./ui/TextArea";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// PUBLIC_INTERFACE
export function NoteEditor({
  note,
  onChangeDraft,
  onSave,
  onCancelNew,
  savingDisabled,
  isNew,
  titleInputRef = null,
  isBusy = false,
}) {
  /**
   * Editor panel for the selected note or new note draft.
   * Controlled via parent draft state.
   *
   * Accessibility:
   * - The title input can receive focus via `titleInputRef` for better keyboard UX.
   * - Uses aria-busy on the editor container when operations are running.
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

  const saveHelpId = "save-help-text";
  const titleErrorId = "title-error-text";

  return (
    <div className={styles.container} aria-busy={isBusy ? "true" : "false"}>
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
            <Button variant="ghost" onClick={onCancelNew} aria-label="Cancel new note">
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
            aria-label={savingDisabled ? "Save note (disabled)" : "Save note"}
            aria-describedby={saveHelpId}
          >
            Save
          </Button>
        </div>
      </div>

      <div className={styles.form} role="form" aria-label="Note editor form">
        <div id={saveHelpId} className={styles.srOnly}>
          Saving requires a title.
        </div>

        <label className={styles.label}>
          <div className={styles.labelText}>Title</div>
          <Input
            ref={titleInputRef}
            value={note.title}
            onChange={(e) => onChangeDraft({ title: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="Untitled note"
            aria-label="Note title"
            aria-invalid={titleError ? "true" : "false"}
            aria-describedby={titleError ? titleErrorId : undefined}
          />
          {titleError ? (
            <div className={styles.error} role="alert" id={titleErrorId}>
              {titleError}
            </div>
          ) : null}
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
