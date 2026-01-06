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

/**
 * For offline-first UX: UI can optionally show a non-blocking toast when we
 * fall back from API mode to localStorage due to a network/API failure.
 */
function makeFallbackMeta(reason) {
  return {
    usedFallback: true,
    fallbackReason: reason || "API unavailable; using local storage.",
  };
}

/**
 * PUBLIC_INTERFACE
 */
export function createNotesRepo() {
  /**
   * Repository abstraction. Defaults to localStorage for offline-first.
   *
   * API mode:
   * - Enabled only when REACT_APP_API_BASE or REACT_APP_BACKEND_URL is a non-empty string.
   * - Even in API mode, all operations gracefully fall back to localStorage on fetch/network failures.
   *
   * Return shape:
   * - Standard calls return the expected data types (array/note/boolean)
   * - Additionally, the repo exposes `listWithMeta()` which returns { data, meta } for UI messaging.
   */
  const apiEnabled = isApiEnabled();
  const api = createApiClient();

  // If someone sets env vars but `fetch` is not available for some reason, treat as offline.
  const canAttemptApi = Boolean(apiEnabled && api.baseUrl && typeof fetch === "function");

  async function list() {
    // Keep list() backward-compatible: just return data (no metadata).
    const { data } = await listWithMeta();
    return data;
  }

  async function listWithMeta() {
    if (canAttemptApi) {
      try {
        const data = await api.get("/notes");
        return { data: sortNotes((data || []).map(normalizeNote)), meta: { usedFallback: false } };
      } catch (e) {
        return {
          data: sortNotes(loadAllLocal().map(normalizeNote)),
          meta: makeFallbackMeta(e?.message),
        };
      }
    }
    return { data: sortNotes(loadAllLocal().map(normalizeNote)), meta: { usedFallback: false } };
  }

  async function create({ title, body }) {
    if (canAttemptApi) {
      try {
        const created = await api.post("/notes", { title, body });
        return { data: normalizeNote(created), meta: { usedFallback: false } };
      } catch (e) {
        // fall back local
        const local = await createLocal({ title, body });
        return { data: local, meta: makeFallbackMeta(e?.message) };
      }
    }
    return { data: await createLocal({ title, body }), meta: { usedFallback: false } };
  }

  async function createLocal({ title, body }) {
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
    if (canAttemptApi) {
      try {
        const updated = await api.put(`/notes/${encodeURIComponent(id)}`, patch);
        return { data: normalizeNote(updated), meta: { usedFallback: false } };
      } catch (e) {
        const local = await updateLocal(id, patch);
        return { data: local, meta: makeFallbackMeta(e?.message) };
      }
    }
    return { data: await updateLocal(id, patch), meta: { usedFallback: false } };
  }

  async function updateLocal(id, patch) {
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
    if (canAttemptApi) {
      try {
        await api.del(`/notes/${encodeURIComponent(id)}`);
        return { data: true, meta: { usedFallback: false } };
      } catch (e) {
        await removeLocal(id);
        return { data: true, meta: makeFallbackMeta(e?.message) };
      }
    }
    await removeLocal(id);
    return { data: true, meta: { usedFallback: false } };
  }

  async function removeLocal(id) {
    const notes = loadAllLocal();
    const next = notes.filter((n) => n.id !== id);
    saveAllLocal(next);
    return true;
  }

  async function toggleFavorite(id) {
    // Use listWithMeta so UI can show a fallback toast if API is down.
    const listed = await listWithMeta();
    const note = listed.data.find((n) => n.id === id);
    if (!note) throw new Error("Note not found.");

    const updated = await update(id, { favorite: !note.favorite });
    // If either step used fallback, propagate that to UI.
    const usedFallback = Boolean(listed.meta?.usedFallback || updated.meta?.usedFallback);
    return {
      data: updated.data,
      meta: usedFallback ? makeFallbackMeta(updated.meta?.fallbackReason || listed.meta?.fallbackReason) : { usedFallback: false },
    };
  }

  /**
   * Backward-compatible API (existing callers):
   * - list() returns Note[]
   * - create/update/remove/toggleFavorite return Note/boolean
   *
   * New optional API for better UX:
   * - listWithMeta(), createWithMeta(), updateWithMeta(), removeWithMeta(), toggleFavoriteWithMeta()
   */
  return {
    list,
    listWithMeta,

    // Existing names: return only data.
    create: async (payload) => (await create(payload)).data,
    update: async (id, patch) => (await update(id, patch)).data,
    remove: async (id) => (await remove(id)).data,
    toggleFavorite: async (id) => (await toggleFavorite(id)).data,

    // Meta-enabled names for UI messaging.
    createWithMeta: create,
    updateWithMeta: update,
    removeWithMeta: remove,
    toggleFavoriteWithMeta: toggleFavorite,
  };
}
