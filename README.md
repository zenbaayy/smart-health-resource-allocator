# Smart Health Resource Allocator

Decision-support system for prioritising maternal and child-health outreach in the supplied Muzaffargarh and Rajanpur dataset.

## Run

1. Install Node.js 18+.
2. Run `npm install` to install `better-sqlite3`.
3. Optionally copy `.env.example` to `.env` and set `GROK_API_KEY` to enable LLM fallback answers.
4. Run `npm start`, then open `http://localhost:3000`.
5. Create an account via the signup link on the login page.

The dashboard, deterministic assistant, and external-source retrieval all work without any API key; only unmatched fallback questions need the key, and without it the assistant says so honestly instead of inventing an answer.

## Authentication

Production-grade authentication is implemented:

- **Password hashing:** `crypto.scrypt` with random 16-byte salt
- **Session tokens:** 32-byte cryptographically random tokens stored in SQLite
- **Cookies:** HttpOnly, SameSite=Strict, 24-hour expiry
- **Timing-safe comparison:** `crypto.timingSafeEqual` for password verification
- **Session cleanup:** Automatic hourly purge of expired sessions
- **Auth gate:** `/api/data` and `/api/chat` return 401 without a valid session

## Data integrity

`src/data/villages.json` is the supplied dataset, preserved without invented replacements. Source duplicate ID `RJ-07` is retained and distinguished internally by `rowKey`. Fazilpur Outskirts' 98,627 population is a tehsil-level aggregate and is never displayed as verified village population or included in scoring. Both facts are flagged on the dashboard, the Data quality page, and each affected location's detail view.

## Scoring framework

Flood risk 40%, facility distance 25%, BHU absence 15%, accessibility 10%, verified village population 10%. Missing factors are excluded from the denominator, and confidence reflects the available verified weight.

## AI assistant

`server/chatEngine.js` answers internal questions deterministically from the supplied dataset — it never changes or overrides a priority score and reports missing fields as Not Available / Survey Required. It works in English, Urdu (script), Roman Urdu, and mixed English/Urdu.

`server/externalSources.js` routes topic questions to the eight approved sources through the backend (Punjab Health Department BHU listing, Pakistan Digital Census, PBS Geo-Economic Observatory, PSLM District Dashboard, NDMA alerts, Rescue 1122, OpenStreetMap Overpass, WHO GHO OData). Every external answer shows Source, Retrieved timestamp, and Data status. Unreachable sources are reported honestly; nothing is fabricated, and external data never overwrites the internal dataset.

## Diagrams

Nine architecture diagrams are in `diagrams/`:

1. `01-system-architecture.svg` — Full system component overview
2. `02-auth-flow.svg` — Signup, login, session verification, and protected routes
3. `03-data-flow.svg` — Scoring engine, weight table, priority tiers, and frontend outputs
4. `04-chat-pipeline.svg` — AI chat intent routing: deterministic, external sources, and fallback
5. `05-deployment.svg` — Current system vs. production deployment on Alibaba Cloud
6. `06-use-case.svg` — Use case diagram with actors and system functions
7. `07-erd.svg` — Entity-relationship diagram (users, sessions)
8. `08-dfd-level0.svg` — DFD Level 0 context diagram
9. `09-dfd-level1.svg` — DFD Level 1 decomposed processes

See `docs/PROJECT_DOCUMENTATION.md` and `docs/FINAL_SUMMARY.md` for architecture, testing results, and limitations.
