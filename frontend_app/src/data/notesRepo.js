import { isApiEnabled } from "../config/env";
import { createApiClient } from "./apiClient";

const STORAGE_KEY = "ocean_notes_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  // Good-enough local ID; deterministic not required here.
  return `note_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function snippetFromBody(body) {
  const normalized = (body || "").replace(/\s+/g, " ").trim();
  return normalized.length > 110 ? `${normalized.slice(0, 110)}…` : normalized;
}

function seedNotes() {
  const t = nowIso();
  const seeded = [
    {
      id: makeId(),
      title: "Welcome to Ocean Notes",
      body:
        "This is a local-first notes app.\n\n• Create, edit, delete notes\n• Search by title or body\n• Star favorites\n\nYour notes persist in localStorage.",
      favorite: true,
      updatedAt: t,
      createdAt: t,
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function loadAllLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedNotes();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedNotes();
    return parsed;
  } catch {
    return seedNotes();
  }
}

function saveAllLocal(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    const at = new Date(a.updatedAt).getTime();
    const bt = new Date(b.updatedAt).getTime();
    return bt - at;
  });
}

function normalizeNote(note) {
  return {
    id: note.id,
    title: note.title || "",
    body: note.body || "",
    snippet: snippetFromBody(note.body || ""),
    favorite: Boolean(note.favorite),
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
  };
}

// PUBLIC_INTERFACE
export function createNotesRepo() {
  /**
   * Repository abstraction. Defaults to localStorage for offline-first.
   * If REACT_APP_API_BASE or REACT_APP_BACKEND_URL is set, API mode can be enabled.
   */
  const apiEnabled = isApiEnabled();
  const api = createApiClient();

  async function list() {
    if (apiEnabled) {
      // Placeholder for future integration; fallback to local if API fails.
      try {
        const data = await api.get("/notes");
        return sortNotes((data || []).map(normalizeNote));
      } catch {
        return sortNotes(loadAllLocal().map(normalizeNote));
      }
    }
    return sortNotes(loadAllLocal().map(normalizeNote));
  }

  async function create({ title, body }) {
    if (apiEnabled) {
      try {
        const created = await api.post("/notes", { title, body });
        return normalizeNote(created);
      } catch {
        // fallback local
      }
    }
    const notes = loadAllLocal();
    const t = nowIso();
    const note = {
      id: makeId(),
      title: title.trim(),
      body: body || "",
      favorite: false,
      updatedAt: t,
      createdAt: t,
    };
    const next = [note, ...notes];
    saveAllLocal(next);
    return normalizeNote(note);
  }

  async function update(id, patch) {
    if (apiEnabled) {
      try {
        const updated = await api.put(`/notes/${encodeURIComponent(id)}`, patch);
        return normalizeNote(updated);
      } catch {
        // fallback local
      }
    }
    const notes = loadAllLocal();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx < 0) throw new Error("Note not found.");
    const prev = notes[idx];
    const nextNote = {
      ...prev,
      ...patch,
      updatedAt: nowIso(),
    };
    notes[idx] = nextNote;
    saveAllLocal(notes);
    return normalizeNote(nextNote);
  }

  async function remove(id) {
    if (apiEnabled) {
      try {
        await api.del(`/notes/${encodeURIComponent(id)}`);
        return true;
      } catch {
        // fallback local
      }
    }
    const notes = loadAllLocal();
    const next = notes.filter((n) => n.id !== id);
    saveAllLocal(next);
    return true;
  }

  async function toggleFavorite(id) {
    const notes = await list();
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error("Note not found.");
    return update(id, { favorite: !note.favorite });
  }

  return { list, create, update, remove, toggleFavorite };
}
