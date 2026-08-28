# Architecture

```text
React Router
  -> pages/components
  -> hooks/services
  -> typed repositories
  -> Firebase Auth / Firestore

AI / Drive
  -> Cloudflare Worker
  -> provider APIs
```

No runtime-fix layer is part of the architecture. Bugs are fixed at their source. Public content is read-only; admin mutations are role-checked in both UI and Firestore Rules.
