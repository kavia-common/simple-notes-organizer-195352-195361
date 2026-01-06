# Ocean Notes (React)

A simple notes application (offline-first) with a modern **Ocean Professional** theme.

## Features

- Create, read, update, delete notes
- Search notes by title or body
- Favorite (star) notes
- Persists to **localStorage** (notes survive refresh)
- Seeded example note on first run
- Clear **loading / empty / error** UI states

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Offline-first + future backend integration

This app **does not require** any backend to function.

It reads these env vars for an optional future API mode:

- `REACT_APP_API_BASE`
- `REACT_APP_BACKEND_URL`

Behavior:

- If **both** are unset/empty, the app runs purely in **Offline mode** (localStorage).
- If **either** is set (non-empty), the app will attempt API requests (endpoints like `/notes`).
- If API requests fail (network/server), the app **gracefully falls back** to localStorage and shows a **non-blocking “Offline fallback” toast**.

## Keyboard accessibility

- Focus the notes list and use **Arrow Up/Down** to move selection.
- Press **Enter** to select.
- When creating/selecting a note, focus moves to the editor title field for fast keyboard editing.
