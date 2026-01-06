# Ocean Notes (React)

A simple notes application (offline-first) with a modern **Ocean Professional** theme.

## Features

- Create, read, update, delete notes
- Search notes by title or body
- Favorite (star) notes
- Persists to **localStorage** (notes survive refresh)
- Seeded example note on first run

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Offline-first + future backend integration

This app **does not require** any backend to function.  
It reads these env vars for a future API mode:

- `REACT_APP_API_BASE`
- `REACT_APP_BACKEND_URL`

If either is set, the app will attempt API requests (currently placeholder endpoints like `/notes`) and **falls back to localStorage** if the API is unavailable.

## Keyboard accessibility

- Focus the notes list and use **Arrow Up/Down** to move selection.
- Press **Enter** to select.

"
