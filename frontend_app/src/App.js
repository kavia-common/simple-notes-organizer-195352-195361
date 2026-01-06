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
import { Toasts } from "./components/Toasts";
import { useToasts } from "./hooks/useToasts";

const repo = createNotesRepo();

function includesQuery(note, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (note.title || "").toLowerCase().includes(q) || (note.body || "").toLowerCase().includes(q);
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

  const { toasts, pushToast, removeToast } = useToasts();
  const firstLoadRef = useRef(true);

  const apiEnabled = isApiEnabled();

  useEffect(() => {
    applyThemeToDocument(oceanProfessionalTheme);
  }, []);

  async function refresh(selectId) {
    const list = await repo.list();
    setNotes(list);

    const nextSelectedId = selectId || selectedId || (list[0] ? list[0].id : "");
    setSelectedId(nextSelectedId);

    const nextSelected = list.find((n) => n.id === nextSelectedId) || null;
    if (!isNewDraft) setDraft(nextSelected);
  }

  useEffect(() => {
    // initial load
    refresh("").catch((e) => pushToast({ kind: "error", title: "Load failed", message: e.message }));
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

  async function handleSelect(id) {
    setSelectedId(id);
    setIsNewDraft(false);
    const selected = notes.find((n) => n.id === id) || null;
    setDraft(selected);
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
        const created = await repo.create({ title, body: draft.body || "" });
        setIsNewDraft(false);
        setDraft(created);
        await refresh(created.id);
        pushToast({ kind: "success", title: "Note created", message: "Your note was saved." });
      } else {
        await repo.update(draft.id, { title, body: draft.body || "" });
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
      await repo.remove(id);
      const nextId = notes.filter((n) => n.id !== id)[0]?.id || "";
      await refresh(nextId);
      pushToast({ kind: "success", title: "Deleted", message: "Note deleted." });
    } catch (e) {
      pushToast({ kind: "error", title: "Delete failed", message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleFavorite(id) {
    try {
      const updated = await repo.toggleFavorite(id);
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
    // If search results change and nothing is selected, select first result for smoother UX.
    if (!firstLoadRef.current) return;
    if (notes.length > 0 && !selectedId) {
      setSelectedId(notes[0].id);
    }
    firstLoadRef.current = false;
  }, [notes, selectedId]);

  const showEmptyList = visibleNotes.length === 0;

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

        <main className="main">
          <TopBar onNewNote={handleNewNote} activeSection={activeSection} apiEnabled={apiEnabled} />
          <SearchBar value={search} onChange={setSearch} />

          <div className="contentGrid">
            <div className={["panel"].join(" ")}>
              {showEmptyList ? (
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
              ) : (
                <NotesList
                  notes={visibleNotes}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              )}
            </div>

            <div className="editorPanel">
              {selectedNote ? (
                <NoteEditor
                  note={selectedNote}
                  onChangeDraft={handleChangeDraft}
                  onSave={handleSave}
                  onCancelNew={() => {
                    setIsNewDraft(false);
                    const fallbackId = notes[0]?.id || "";
                    setSelectedId(fallbackId);
                    setDraft(notes.find((n) => n.id === fallbackId) || null);
                  }}
                  savingDisabled={savingDisabled}
                  isNew={isNewDraft}
                />
              ) : (
                <EmptyState
                  title="Select a note"
                  description="Choose a note from the list to view or edit it."
                  actionLabel="Create a note"
                  onAction={handleNewNote}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <Toasts toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
