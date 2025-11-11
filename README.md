Student Management System (Demo)

Overview
- Single-page demo built with vanilla HTML, CSS, and JavaScript.
- No backend: data persists in localStorage.
- Lightweight 3D header accent using Three.js via CDN with graceful CSS fallback.

Features
- Dashboard with searchable, sortable list (name, id, class, email, avatar, status).
- Add, edit, delete with modal form and client-side validation.
- Student profile panel with history/activity.
- Reset demo data and export CSV.
- Optional avatar upload (converted to Base64 for persistence).
- Filters by class and status, plus sort options.
- Modern UI (glassmorphism, hover lifts, focus rings, toasts), mobile-first responsive.

How to run
- Simply open index.html in a modern browser. No build step required.
- Note: Some browsers restrict file uploads or canvas behavior when opened from the file system. Use a simple HTTP server if needed, e.g.:
  - Python: `python3 -m http.server 5500` and open http://localhost:5500
  - Node: `npx serve .`

3D background
- The header tries to load Three.js from a CDN and shows floating low-poly shapes.
- Toggle the effect using the 3D switch in the header.
- If WebGL or the CDN is unavailable, a CSS animated fallback is used automatically.
- The 3D module is in three-bg.js and exposes `window.ThreeBG.enable()` and `window.ThreeBG.disable()`.

Data & persistence
- Students are stored under the key `sms.students.v1` in localStorage.
- Click Reset in the header to restore the demo dataset.
- Export CSV uses the current filtered/sorted list.

Keyboard & accessibility
- Cards are focusable; modal and inputs have visible focus outlines.
- Form labels and aria attributes added where relevant.
- Profile panel can be dismissed with the close button.

Files
- index.html — markup and app shells, dialog, profile panel.
- style.css — theme tokens, layout, glass UI, responsive design, animations.
- app.js — logic for CRUD, search/sort/filter, profile panel, CSV, toasts.
- three-bg.js — 3D header background module with graceful fallback.
- assets/ — icons and sample avatars.

License
- For demo purposes only.
