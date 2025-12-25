# Development Plan — The Architecture of Evidence (Next.js + Vercel + Tigris + Neon + DuckDB)

This plan turns the book + visualization system into a **production-grade web app** with a **reusable “evidence component” library** and a **data pipeline** that supports:
- JSON “evidence payloads” for charts and model outputs
- Parquet datasets in Tigris, queried via DuckDB (Node or WASM)

---

## 1) Goals & Non‑Goals

### Goals
- **Consistency:** repeatable chart/interaction patterns across chapters and dashboards.
- **Rigor by default:** uncertainty (CI/SE) as a first-class layer; defensible comparisons.
- **Web-native:** fast rendering, good UX, accessible defaults, MDX publishing.
- **Dual runtime analytics:** DuckDB **Node** for heavier/private queries and DuckDB **WASM** for lightweight client-side exploration.

### Non‑Goals (for now)
- Full lakehouse orchestration (Spark/Trino/etc.).
- Arbitrary user-authored SQL over private datasets (we’ll use templated queries).

---

## 2) System Architecture (High-Level)

### Storage & Compute
- **Neon (Postgres):** canonical metadata + auth + content registry + query templates + caching indices.
- **Tigris (Object Storage):** source datasets (Parquet), derived artifacts (JSON), thumbnails, exports.
- **Next.js on Vercel:** MDX book, dashboards, API routes, auth, signed URL issuance, optional DuckDB Node execution.

### Two data “lanes”
1. **Evidence Payload Lane (JSON):** curated, chart-ready artifacts (e.g., `RegressionPayload`, `TimeTrendPayload`).
2. **Dataset Lane (Parquet):** larger tables; dashboard queries executed via DuckDB.

---

## 3) Data Architecture

### 3.1 Tigris bucket layout (suggested)
- `raw/` — raw ingests (optional; often you’ll skip and go straight to `curated/`)
- `curated/` — curated Parquet datasets used by dashboards
- `artifacts/` — evidence payloads: `artifacts/{artifactId}/payload.json`
- `exports/` — downloadable assets generated on demand: CSV, parquet extracts, png/svg snapshots
- `cache/` — cached query outputs keyed by hash (optional but extremely useful)

### 3.2 Neon schema (suggested tables)
- `datasets`  
  - `id`, `name`, `description`, `tigris_bucket`, `tigris_prefix`, `format` (parquet), `partitioning`, `public` (bool)
- `dataset_files`  
  - `dataset_id`, `path`, `row_count`, `minmax_stats` (jsonb), `updated_at`
- `artifacts`  
  - `id`, `type` (TimeTrend/Regression/TopicModel), `tigris_path`, `created_at`, `provenance` (jsonb)
- `chapters` / `pages`  
  - mapping from MDX → referenced `artifact_id[]` and `dataset_id[]`
- `query_templates`  
  - whitelisted SQL templates with parameters (prevents SQL injection, ensures stable semantics)
- `query_cache` (optional)  
  - `key_hash`, `dataset_id`, `template_id`, `params`, `tigris_path`, `created_at`

---

## 4) DuckDB Strategy (Node vs WASM)

### 4.1 Decision rule
Use **DuckDB Node** when:
- Data is private or requires credentials (don’t ship keys to browser).
- Queries are heavy (multi-file scans, joins, large aggregations).
- You want stable performance (server can cache results).

Use **DuckDB WASM** when:
- Datasets are small/moderate and can be accessed via public or pre‑signed URLs.
- You want “local-first” exploration without server cost.
- The view is primarily exploratory (not a core KPI dashboard).

### 4.2 Reading Parquet from Tigris
You have two robust options:

**Option A — S3 API path (best for server-side DuckDB Node):**
- DuckDB `httpfs` can read `s3://bucket/path/*.parquet` when configured with an endpoint + secret.
- Tigris is S3-compatible, so this works cleanly.

**Option B — HTTPS path (best for DuckDB WASM and public server queries):**
- Serve Parquet via HTTPS (public or pre-signed).
- DuckDB can use Parquet metadata + HTTP range requests to partially read only needed row groups/columns (when supported by the runtime).

### 4.3 Security model for browser access
- Prefer **short-lived presigned URLs** for private objects.
- Ensure correct **CORS** behavior for DuckDB WASM and browser fetches.
- Never presign “upload” URLs to a domain that could execute user content without careful controls.

---

## 5) Core Libraries & App Structure (Monorepo-friendly)

### 5.1 Packages / folders (suggested)
- `apps/web/` — Next.js app router, MDX, dashboards
- `packages/viz/` — chart components (Observable Plot + Recharts), shared UI tokens
- `packages/evidence/` — TypeScript schemas + validators (zod), chart payload builders
- `packages/storage/` — Tigris client, signed URL helpers, cache helpers
- `packages/duck/` — DuckDB helpers (Node Neo bindings, WASM helpers), query template execution

### 5.2 Evidence Payload types (as you sketched)
- `TimeTrendPayload` — values + intervals + events
- `RegressionPayload` — coefficients + SE/CI + model metadata
- `TopicModelPayload` — prevalence + exemplars + drift

Add two more “unblocking” schemas early:
- `DatasetManifest` — lists parquet files, partitions, columns, and basic stats
- `DashboardViewPayload` — layout + queries + chart configs (so dashboards are declarative)

---

## 6) Implementation Roadmap (Phases)

### Phase 1 — Infrastructure & Data Access (2–3 weeks)
Deliverables:
- Tigris buckets & naming conventions
- Neon schema (datasets, artifacts, query_templates)
- “Data Access Layer” in Next.js:
  - fetch artifact JSON from Tigris
  - validate payloads (zod)
  - cache aggressively (Vercel caching + optional Tigris cache objects)

Success criteria:
- A single MDX page can render 3–5 charts from Tigris payloads.
- A single dashboard page can reference 1 dataset manifest and a few query templates.

### Phase 2 — Evidence Component Library (TOC Parts II–IV) (3–6 weeks)
Deliverables:
- **Temporal Engine**
  - Event-aware line charts + 95% CI bands
  - Indexing mode (base year = 100)
- **Geographic Engine**
  - Choropleths with uncertainty toggles
  - Linked map → trend drill-down
- **Survey/Categorical Engine**
  - Likert and interval dot plots
  - Weighted estimates + CI display patterns

Success criteria:
- Each component ships with:
  - a schema contract
  - at least 2 reference datasets
  - an MDX “recipe page” (question → grammar → code → writeup)

### Phase 2.5 — DuckDB Query Layer for Dashboards (2–4 weeks, can overlap)
Deliverables:
- **Node DuckDB route** (server runtime):
  - executes whitelisted templates
  - reads Parquet from Tigris via S3 API endpoint or HTTPS
  - returns aggregated data for charts
- **WASM DuckDB route** (client runtime):
  - loads DuckDB-WASM
  - reads public/presigned Parquet via HTTPS (CORS)
  - executes a small set of queries for exploration mode
- **Caching strategy**
  - query_hash → cached JSON/Arrow results in Tigris
  - TTL and invalidation via dataset versioning

Success criteria:
- A dashboard can run the same view in:
  - “Server mode” (fast + private)
  - “Browser mode” (local exploration) on smaller datasets

### Phase 3 — Statistical Synthesis (TOC Part V) (4–8 weeks)
Deliverables:
- `CoefficientPlot`, `EventStudyPlot`, `DiDPanel`
- Residual and distribution diagnostics panels
- Topic model explorer:
  - prevalence over time
  - exemplars
  - drift/regime shift views

Success criteria:
- Each visualization has a “methods note” template and a “failure modes” checklist.

### Phase 4 — Online Book Experience (ongoing; 3–6 weeks to v1)
Deliverables:
- MDX layouts with:
  - consistent recipe sections
  - inline “playground” blocks
  - cross-linking artifacts/datasets
- Search + navigation:
  - by technique (line/dot/heatmap), by data type (panel/text), by claim type (trend/causal/robustness)

Success criteria:
- A chapter can be published with:
  - interactive figures
  - downloadable exports
  - citation-ready captions/methods

### Phase 5 — Agentic Integration (optional but compelling) (2–4 weeks)
Deliverables:
- Python dispatcher notebook/script:
  - outputs Parquet + JSON evidence payloads
  - uploads to Tigris + registers to Neon
- “Live Analysis” page:
  - polls for new artifacts and renders them
  - audit trail: provenance metadata

Success criteria:
- A model run produces an artifact that appears on the site within minutes, with provenance.

---

## 7) Performance, Reliability, and Observability

### Performance budgets
- First meaningful render < 2s on typical pages
- Dashboards: keep heavy queries server-side; return compact aggregates
- Large datasets: prefer partitioned Parquet and pre-aggregations

### Logging & monitoring
- Query latency by template_id
- Cache hit rate
- Artifact fetch times
- Client memory usage in WASM mode (guardrails)

---

## 8) Risks & Mitigations

- **DuckDB Node in serverless environments:** native binaries and cold-start size can be a risk.
  - Mitigation: keep a “server query” surface small; cache outputs; consider moving heavy queries to a dedicated worker later if needed.
- **CORS & presigned URLs with WASM:** browser restrictions can block reads.
  - Mitigation: ensure bucket/object CORS rules are correct; or proxy reads through Next.js.
- **Too much flexibility → inconsistent visuals:** readers get lost.
  - Mitigation: strict payload schemas + a small set of component “modes,” not unlimited customization.

---

## 9) Definition of Done (aligned with your success metrics)
- **Stat-rigor:** uncertainty supported by default where applicable.
- **Accessibility:** WCAG-compliant colors and structure.
- **Performance:** render large county-level views fast (canvas where it matters).

---

## References (for the repo README)
- DuckDB Node (Neo): https://duckdb.org/docs/stable/clients/node_neo/overview
- DuckDB httpfs (HTTP/S3): https://duckdb.org/docs/stable/core_extensions/httpfs/overview.html
- Tigris DuckDB quickstart: https://www.tigrisdata.com/docs/quickstarts/duckdb/
- Tigris presigned URLs: https://www.tigrisdata.com/docs/objects/presigned/
