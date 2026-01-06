import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { oceanProfessionalTheme, applyThemeToDocument } from "./theme";
import { createNotesRepo } from "./data/notesRepo";
import { isApiEnabled } from "./config/env";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { SearchBar } from "./components/SearchBar";
import { NotesList } from "./components/NotesList";
import { NoteEditor } from "./components/NoteEditor";
import { EmptyState } from "./components/EmptyState";
import { LoadingState } from "./components/LoadingState";
import { Toasts } from "./components/Toasts";
import { useToasts } from "./hooks/useToasts";

const repo = createNotesRepo();

function includesQuery(note, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (note.title || "").toLowerCase().includes(q) || (note.body || "").toLowerCase().includes(q);
}

function shouldShowFallbackToast(meta) {
  return Boolean(meta && meta.usedFallback);
}

// PUBLIC_INTERFACE
function App() {
  /** Single-page notes application: sidebar + list + editor, offline-first. */
  const [activeSection, setActiveSection] = useState("all"); // all | favorites
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null); // {id,title,body,...} for editor
  const [isNewDraft, setIsNewDraft] = useState(false);

  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  const { toasts, pushToast, removeToast } = useToasts();
  const firstLoadRef = useRef(true);

  // Focus management
  const editorTitleFocusRef = useRef(null);

  const apiEnabled = isApiEnabled();

  useEffect(() => {
    applyThemeToDocument(oceanProfessionalTheme);
  }, []);

  function maybeToastFallback(meta) {
    if (!shouldShowFallbackToast(meta)) return;
    pushToast({
      kind: "info",
      title: "Offline fallback",
      message: "API unavailable; continuing with local storage.",
      timeoutMs: 2600,
    });
  }

  async function refresh(selectId) {
    // Use meta-enabled list to provide graceful messaging when API falls back.
    const { data, meta } = await repo.listWithMeta();
    maybeToastFallback(meta);

    setNotes(data);

    const nextSelectedId = selectId || selectedId || (data[0] ? data[0].id : "");
    setSelectedId(nextSelectedId);

    const nextSelected = data.find((n) => n.id === nextSelectedId) || null;
    if (!isNewDraft) setDraft(nextSelected);
  }

  useEffect(() => {
    // initial load
    (async () => {
      setInitialLoading(true);
      setInitialError("");
      try {
        await refresh("");
      } catch (e) {
        const msg = e?.message || "Unknown error";
        setInitialError(msg);
        pushToast({ kind: "error", title: "Load failed", message: msg });
      } finally {
        setInitialLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // keep draft synced when selection changes, unless editing a new note draft
    if (isNewDraft) return;
    const selected = notes.find((n) => n.id === selectedId) || null;
    setDraft(selected);
  }, [notes, selectedId, isNewDraft]);

  const stats = useMemo(() => {
    const favorites = notes.filter((n) => n.favorite).length;
    return { total: notes.length, favorites };
  }, [notes]);

  const visibleNotes = useMemo(() => {
    let base = notes;
    if (activeSection === "favorites") base = base.filter((n) => n.favorite);
    base = base.filter((n) => includesQuery(n, search));
    return base;
  }, [notes, activeSection, search]);

  const selectedNote = useMemo(() => {
    if (isNewDraft) return draft;
    return notes.find((n) => n.id === selectedId) || null;
  }, [notes, selectedId, draft, isNewDraft]);

  const savingDisabled = useMemo(() => {
    if (!draft) return true;
    if (busy) return true;
    return !draft.title || !draft.title.trim();
  }, [draft, busy]);

  async function handleSelect(id, { focusEditor = true } = {}) {
    setSelectedId(id);
    setIsNewDraft(false);
    const selected = notes.find((n) => n.id === id) || null;
    setDraft(selected);

    // Focus the editor's Title field so keyboard users land where editing happens.
    if (focusEditor) {
      window.setTimeout(() => editorTitleFocusRef.current?.focus?.(), 0);
    }
  }

  async function handleNewNote() {
    const t = new Date().toISOString();
    setIsNewDraft(true);
    setSelectedId("");
    setDraft({
      id: "new",
      title: "",
      body: "",
      favorite: false,
      createdAt: t,
      updatedAt: t,
      snippet: "",
    });

    // Focus the title field when creating a note.
    window.setTimeout(() => editorTitleFocusRef.current?.focus?.(), 0);
  }

  async function handleSave() {
    if (!draft) return;
    const title = (draft.title || "").trim();
    if (!title) {
      pushToast({ kind: "error", title: "Missing title", message: "Please add a title before saving." });
      return;
    }

    setBusy(true);
    try {
      if (isNewDraft) {
        const { data: created, meta } = await repo.createWithMeta({ title, body: draft.body || "" });
        maybeToastFallback(meta);

        setIsNewDraft(false);
        setDraft(created);
        await refresh(created.id);
        pushToast({ kind: "success", title: "Note created", message: "Your note was saved." });
      } else {
        const { meta } = await repo.updateWithMeta(draft.id, { title, body: draft.body || "" });
        maybeToastFallback(meta);

        await refresh(draft.id);
        pushToast({ kind: "success", title: "Saved", message: "Changes saved." });
      }
    } catch (e) {
      pushToast({ kind: "error", title: "Save failed", message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    const note = notes.find((n) => n.id === id);
    const ok = window.confirm(`Delete “${note?.title || "this note"}”? This cannot be undone.`);
    if (!ok) return;

    setBusy(true);
    try {
      const { meta } = await repo.removeWithMeta(id);
      maybeToastFallback(meta);

      const nextId = notes.filter((n) => n.id !== id)[0]?.id || "";
      await refresh(nextId);
      pushToast({ kind: "success", title: "Deleted", message: "Note deleted." });

      // Keep keyboard flow: if something is still selected, focus editor; otherwise focus list.
      window.setTimeout(() => {
        if (nextId) editorTitleFocusRef.current?.focus?.();
      }, 0);
    } catch (e) {
      pushToast({ kind: "error", title: "Delete failed", message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleFavorite(id) {
    try {
      const { data: updated, meta } = await repo.toggleFavoriteWithMeta(id);
      maybeToastFallback(meta);

      await refresh(updated.id);
      pushToast({
        kind: "success",
        title: updated.favorite ? "Favorited" : "Unfavorited",
        message: updated.favorite ? "Added to Favorites." : "Removed from Favorites.",
        timeoutMs: 1800,
      });
    } catch (e) {
      pushToast({ kind: "error", title: "Action failed", message: e.message });
    }
  }

  function handleChangeDraft(patch) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  useEffect(() => {
    // If notes load and nothing is selected, select the first note for smoother UX.
    if (!firstLoadRef.current) return;
    if (notes.length > 0 && !selectedId) {
      setSelectedId(notes[0].id);
    }
    firstLoadRef.current = false;
  }, [notes, selectedId]);

  // Empty states
  const showEmptyList = visibleNotes.length === 0;

  const listPanel = (() => {
    if (initialLoading) {
      return <LoadingState title="Loading notes…" description="Fetching your notes." />;
    }

    if (initialError) {
      return (
        <EmptyState
          title="Couldn’t load notes"
          description="Please refresh the page. Your local notes should still be available offline."
          actionLabel="Try again"
          onAction={() => {
            // non-blocking retry
            (async () => {
              setInitialLoading(true);
              setInitialError("");
              try {
                await refresh("");
              } catch (e) {
                const msg = e?.message || "Unknown error";
                setInitialError(msg);
                pushToast({ kind: "error", title: "Load failed", message: msg });
              } finally {
                setInitialLoading(false);
              }
            })();
          }}
        />
      );
    }

    if (busy) {
      // Operation-level loading state: keep it subtle but clear.
      return <LoadingState title="Working…" description="Saving changes." />;
    }

    if (showEmptyList) {
      return (
        <EmptyState
          title={search.trim() ? "No matches" : "No notes yet"}
          description={
            search.trim()
              ? "Try a different search term."
              : "Create your first note to get started. A sample note is included on first run."
          }
          actionLabel="Create a note"
          onAction={handleNewNote}
        />
      );
    }

    return (
      <NotesList
        notes={visibleNotes}
        selectedId={selectedId}
        onSelect={(id) => handleSelect(id, { focusEditor: true })}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />
    );
  })();

  const editorPanel = (() => {
    if (initialLoading) {
      return <LoadingState title="Loading editor…" description="Preparing your workspace." />;
    }

    if (busy && selectedNote) {
      // Keep editor visible but still indicate busy by disabling Save in editor; list shows spinner already.
      // We'll just render the editor normally; NoteEditor already disables Save via savingDisabled.
    }

    if (selectedNote) {
      return (
        <NoteEditor
          note={selectedNote}
          onChangeDraft={handleChangeDraft}
          onSave={handleSave}
          onCancelNew={() => {
            setIsNewDraft(false);
            const fallbackId = notes[0]?.id || "";
            setSelectedId(fallbackId);
            setDraft(notes.find((n) => n.id === fallbackId) || null);

            // Put focus back into the editor for the selected note.
            window.setTimeout(() => editorTitleFocusRef.current?.focus?.(), 0);
          }}
          savingDisabled={savingDisabled}
          isNew={isNewDraft}
          titleInputRef={editorTitleFocusRef}
          isBusy={busy}
        />
      );
    }

    return (
      <EmptyState
        title="Select a note"
        description="Choose a note from the list to view or edit it."
        actionLabel="Create a note"
        onAction={handleNewNote}
      />
    );
  })();

  return (
    <div className="App">
      <div className="shell">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={(s) => {
            setActiveSection(s);
            // keep selection stable; if switching to favorites and current isn't favorite, select first favorite
            if (s === "favorites" && selectedId) {
              const current = notes.find((n) => n.id === selectedId);
              if (current && !current.favorite) {
                const firstFav = notes.find((n) => n.favorite);
                setSelectedId(firstFav ? firstFav.id : "");
              }
            }
          }}
          stats={stats}
        />

        <main className="main" aria-label="Notes workspace">
          <TopBar onNewNote={handleNewNote} activeSection={activeSection} apiEnabled={apiEnabled} />
          <SearchBar value={search} onChange={setSearch} disabled={initialLoading || Boolean(initialError)} />

          <div className="contentGrid">
            <div className={["panel"].join(" ")} aria-label="Notes list panel">
              {listPanel}
            </div>

            <div className="editorPanel" aria-label="Editor panel">
              {editorPanel}
            </div>
          </div>
        </main>
      </div>

      <Toasts toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
