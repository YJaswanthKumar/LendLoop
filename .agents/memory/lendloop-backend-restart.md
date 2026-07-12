---
name: LendLoop backend restart requirement
description: The Backend API workflow (node src/server.js) has no file watcher/reload; code edits are silently ignored until it's restarted.
---

`lendloop-backend`'s `npm start` runs `node src/server.js` directly — no nodemon/watch. After editing anything under `lendloop-backend/src/**` (services, controllers, routes), the running process keeps serving the old code.

**Why:** Spent time debugging why a rental-service fix (adding `latitude`/`longitude` to contact payloads) wasn't showing up in curl responses — the edit was correct, the workflow just hadn't picked it up.

**How to apply:** Restart the `Backend API` workflow after any backend source change, before curling/testing endpoints to verify behavior.
