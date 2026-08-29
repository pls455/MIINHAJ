# مِنهَاج | Minhaj 2.0

إعادة بناء لمنصة مِنهَاج التعليمية مع فصل واجهة المستخدم عن Firebase repositories وعن خدمة الذكاء الاصطناعي.

## Architecture
- `src/services/firebase.js`: Firebase initialization for project `minhaj-1be6f`.
- `src/services/repositories.js`: single repository layer for Firestore CRUD + cursor pagination.
- `src/services/auth.js`: authentication and centralized role levels.
- `src/services/aiService.js`: client-side AI gateway. No Gemini secret is shipped to the browser.
- `src/hooks/`: data loading hooks.
- `src/main.jsx`: application routes and feature views.
- `cloudflare-worker/`: Gemini gateway with validation, timeout and error mapping.

## Data preserved
The application targets the existing Firestore collections: `branches`, `subjects`, `categories`, `resources`, `foundations`, `suggestions`, `admins`, `adminLogs`, `templates`, `solutions`, `problemReports`, `curriculumUnits`, `sourceRegistry`, and `flashcards`.

No destructive Firestore migration is included.

## Roles
- Reviewer: level 1
- Content Admin: level 2
- Super Admin: level 3

Client-side checks are UX only. Firestore rules remain the actual authorization boundary.

## Development
```bash
npm install
npm run dev
npm run build
```

## AI / Cloudflare
Set `GEMINI_API_KEY` as a Cloudflare Worker secret. Optionally set `GEMINI_MODEL` and `ALLOWED_ORIGIN`. Never put the Gemini key in frontend source or GitHub.

Set `VITE_AI_BASE_URL` in the frontend build environment to the deployed Worker URL.

## Firestore
Deploy `firestore.rules` through Firebase tooling. Review required composite indexes when introducing new compound queries.

## Deployment
The Vite build outputs `dist/` and is suitable for GitHub Pages or another static host. Use a Pages workflow that publishes `dist/` from `main`.
