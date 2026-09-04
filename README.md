# Smart Health Resource Allocator

## Project Purpose

* **Application Overview**: A decision-support web application for NGO program officers to prioritize health-resource allocation across underserved villages in South Punjab, Pakistan.
* **Event Context**: Built for the Alkhidmat × Alibaba Cloud Hackathon.
* **Core Functionality**: Ingests a supplied dataset of 15 village records, applies a transparent weighted scoring formula to produce priority rankings, and presents the results through an interactive map, filterable tables, location detail pages, data-quality flags, and a multilingual AI assistant — all behind secure session-based authentication.

---

## Implemented Features

| # | Feature | Status |
| :--- | :--- | :--- |
| **1** | Secure signup / login with scrypt password hashing | **BUILT** |
| **2** | Session management with HttpOnly cookies (24-hour expiry) | **BUILT** |
| **3** | KPI dashboard (total locations, avg priority, high-priority count, total population) | **BUILT** |
| **4** | Leaflet map with OpenStreetMap tiles and marker popups | **BUILT** |
| **5** | Priority ranking table with sorting | **BUILT** |
| **6** | District, tehsil, priority, flood-risk, and confidence filters | **BUILT** |
| **7** | Free-text search across locations | **BUILT** |
| **8** | Location detail page with score breakdown and recommended action | **BUILT** |
| **9** | Data quality page with duplicate detection and missing-data flags | **BUILT** |
| **10** | CSV export of filtered data | **BUILT** |
| **11** | AI chatbot — deterministic internal answers (village data) | **BUILT** |
| **12** | AI chatbot — external source routing (8 verified sources) | **BUILT** |
| **13** | AI chatbot — optional Grok API fallback for unmatched questions | **BUILT** |
| **14** | Multilingual UI (English, Urdu) with RTL layout | **BUILT** |
| **15** | Responsive design (single-column reflow at ~455px) | **BUILT** |
| **16** | Score-override refusal (chatbot never modifies priority scores) | **BUILT** |
| **17** | Methodology explanation page | **BUILT** |

---

## How It Works

* **Step 1: Authentication**: The user creates an account or logs in with existing credentials.
* **Step 2: Session Validation**: The server verifies credentials using scrypt hash comparison and issues a session token stored as an HttpOnly cookie.
* **Step 3: Dashboard Initialization**: The authenticated user accesses the dashboard, which loads the scored village dataset from `/api/data`.
* **Step 4: Scoring Engine Execution**: The scoring engine applies five weighted factors to each village record:
  * **Flood risk (40%)**: High = 40, Medium-High = 30, Medium = 20, Low = 10.
  * **Facility distance (25%)**: Normalized against a 40 km ceiling.
  * **BHU absence (15%)**: 15 points if no Basic Health Unit is on site.
  * **Road accessibility (10%)**: Poor/Difficult = 10, Moderate = 5, Good = 0.
  * **Verified population (10%)**: Normalized against a 20,000 ceiling.
* **Step 5: Tiers & Normalization**: Scores are normalized to 0–100 and classified into priority tiers (**Critical** $\ge 80$, **High** $60–79$, **Medium** $40–59$, **Low** $0–39$, **Survey Required** if null).
* **Step 6: Confidence Levels**: Confidence levels reflect data completeness: **High** ($\ge 75\%$ fields available), **Medium** ($45–74\%$ ), **Low** ($<45\%$).
* **Step 7: AI Assistant Logic**: The AI assistant answers questions using deterministic logic for internal data, routes external queries to 8 verified sources, and falls back to the Grok API only when no deterministic match exists.
* **Step 8: Transparency Metadata**: All responses display source metadata (**Source**, **Retrieved timestamp**, **Data status**) for complete transparency.
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e79d5ed3-ccc2-4432-bcb1-72162a6c0b03" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/93345b11-35f4-4f0f-b29a-30ac5e662a37" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/230caeff-48b2-4354-885b-1533c5186136" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d2bc02a2-e614-466a-aaa9-603db753dfa5" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4b5df3ef-3d6f-493a-9e81-2eab7f16e336" />



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
<img width="969" height="727" alt="image" src="https://github.com/user-attachments/assets/6d2d5ac2-7e0f-4c43-84d6-04cafced5f75" />
<img width="969" height="727" alt="image" src="https://github.com/user-attachments/assets/cfe9126c-6687-42fe-9be8-7b8467cbf04e" />
<img width="620" height="465" alt="image" src="https://github.com/user-attachments/assets/b731d7e2-7fb1-450a-8613-e3bff6c90362" />
<img width="620" height="465" alt="image" src="https://github.com/user-attachments/assets/e3844381-fe7a-42ad-860d-f6dbd6119798" />

See `docs/PROJECT_DOCUMENTATION.md` and `docs/FINAL_SUMMARY.md` for architecture, testing results, and limitations.
