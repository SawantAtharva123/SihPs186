# SAHAYAK — Task Breakdown

Personnel Welfare Intelligence, Recovery & Intervention Platform.
Derived from `MASTERPrompt.docx`. Status legend: `[x]` done · `[ ]` pending.

---

## WS0 — Planning Docs

- [x] `task.md` (this file)
- [x] `implementation.md` — architecture, contracts, schemas, verification

## WS1 — ML Service (`ml-service/`, FastAPI + Python 3.12)

- [x] Project scaffold: `requirements.txt`, package layout, `app/main.py` (CORS, versioned responses)
- [x] `baseline/` — rolling median, MAD robust z-score, EWMA, baseline confidence (sample count, history, missingness)
- [x] `anomaly/` — deviation detection, persistence rules (Emerging / Persistent / Sustained, never from one reading), thresholds
- [x] `recovery/` — recovery score, recovery debt (expected − actual), trajectory classification, half-life (exponential fit), post-intervention recovery
- [x] `volatility/` — shift transition rate, duty start/duration variance, rest variance, day/night switching, sequence entropy
- [x] `signal_agreement/` — per-signal states, agreement/conflict level, missing signal handling
- [x] `stressor_interaction/` — interaction features (A×B, A×C, B×C, A×B×C), interpretable model, SHAP-style contributor output (swappable interface)
- [x] `explainability/` — contributor engine, human-readable formatter, uncertainty labels
- [x] `simulation/` — personal what-if, unit what-if, trajectory projection, mandatory disclaimer
- [x] `recommendations/` — evidence-aware, non-diagnostic "observed / potential / why" triples
- [x] `data/` — synthetic scenario generators A–F (stable, emerging, persistent, conflicting, recovery-after-intervention, high volatility)
- [x] API endpoints per MASTER §78, every response: `{data, confidence, warnings, model_version, generated_at}`
- [x] pytest suite (engines + API contract)

## WS2 — Mobile Data Layer (`sih-app/src/`)

- [x] `offline/database.ts` — `openDatabaseAsync`, WAL, foreign keys
- [x] `offline/migrations.ts` — `PRAGMA user_version` incremental migrations, full schema (§13 subset + sync columns + analytics cache + notifications + audit)
- [x] `offline/syncQueue.ts`, `syncManager.ts` (backoff 5/15/30/60 s, max attempts), `retryPolicy.ts`, `conflictResolver.ts`, `connectivity.ts` (NetInfo + manual demo override)
- [x] `repositories/` — check-ins, activities (sessions + attempts), duty, sleep, recovery, support requests, pulses, feedback, cases, interventions, profiles, notifications, analytics cache (no SQL in components)
- [x] `services/auth.ts` — local demo accounts, session via `expo-sqlite/kv-store`, logout, audit entries
- [x] `services/analyticsClient.ts` — typed HTTP client → FastAPI, cache-write-through, offline-safe
- [x] `services/demoScenario.ts` — seeds scenarios A–F (personnel + unit members + duty/sleep/recovery/activities) into SQLite
- [x] `services/notifications.ts`, `services/audit.ts`, `services/export.ts`
- [x] `hooks/` — useCheckIn, useActivities, useTrends, useRecoveryAnalytics, useSignalAgreement, useWelfareCases, useInterventions, useUnitAnalytics, useConnectivity
- [x] `components/charts/` — TrendLineChart (baseline overlay, event markers, tap-to-inspect), Sparkline, trajectory chart
- [x] `components/ui/` — StateBadge, ConfidencePill, EmptyState, ErrorState, SectionCard

## WS3 — Auth & Navigation

- [x] `(auth)/login.tsx` — demo account quick-select, credential login, password reset (local), session persistence
- [x] Role-based routing (`app/index.tsx` → personnel / welfare / command groups)
- [x] Root providers: SQLiteProvider (migrations), AuthProvider, DataProvider, SyncProvider
- [x] Header — role switcher (§108 demo mode), scenario picker, real sync/connectivity indicator, logout

## WS4 — Personnel Role (7 tabs, fully functional)

- [x] Home — live greeting, current state (analytics cache), check-in status, today's activity completion, trends/recovery/pulse previews, notifications
- [x] Daily Check-in — saves to SQLite (`pending` sync), refreshes analytics when online
- [x] Activities — 5 playable games: Quick Tap, Go/No-Go, Sequence Recall, Odd One Out, Direction Match
- [x] Activity engine — session + attempt-level records, difficulty personalization from personal activity baseline
- [x] My Trends — 7/30/90/all periods, SVG charts, baseline overlay, event markers, tap-to-inspect
- [x] Early Warning Radar — directional changes from deviation analysis
- [x] Stressor Map — tappable nodes (current, baseline, deviation, trend, confidence)
- [x] Recovery — overview, debt (today/yesterday/3-day, accumulating/stable/reducing), trajectory, half-life, baseline + confidence
- [x] Why Did My Pattern Change? — contributor timeline (observed data, possible contribution, evidence, confidence, period)
- [x] Personal What-If Simulator — sleep/workload/night shifts/recovery/duty/rest → `POST /simulate/person`
- [x] Recovery Coach — non-medical suggestions from recommendations engine
- [x] Unit Pulse — real aggregates, k-anonymity suppression (n < 5), anonymous pulse submission, Voice of Personnel form (anonymous / follow-up options)
- [x] Privacy Center — data collected, privacy matrix, wearable toggles, JSON data export, controls
- [x] Support — request welfare check-in, contact officer, My Buddy, resources, emergency help
- [x] Offline — all capture flows work offline; screens render from cache with last-updated labels

## WS5 — Welfare Officer Role

- [x] Dashboard — state distribution (Stable / Emerging / Persistent / Sustained / Conflicting), priority personnel, overall analysis arrows, AI recommendations
- [x] Personnel — search, state filters, list from local DB
- [x] Personnel Detail — current state, baseline confidence, emerging patterns, trends, Root Cause Explorer (observed / model-derived / possible, confidence labels), operational info, recovery, activities, signal agreement panel, authorized feedback, support history
- [x] Create Welfare Case — prefilled from detail + direct flow (search → select → details)
- [x] Case lifecycle — New → Under Review → Intervention Planned → Follow-up → Improving → Closed (+ Requires Further Review) with status stepper
- [x] Follow-up recording — sleep / recovery / workload / activity arrows + notes
- [x] Recovery Journey — before → intervention → after → current chart, careful causal language
- [x] Interventions — create (type, dates, officer, notes), status tracking, outcome status
- [x] Intervention Experiment Lab — scenario simulation (add recovery day, move night shift, …) side-by-side current vs alternative + confidence + disclaimer

## WS6 — Command Role

- [x] Organization Dashboard — Wellness Weather grid, org trend summary (vs previous 30 days), recovery pressure / volatility / load / workload / pulse, intervention outcomes (aggregate only)
- [x] Units — list with key aggregate metrics
- [x] Unit Detail — trend analysis (7/30/90/6 mo), schedule & workload deltas, unit root causes, unit what-if (scenarios A–D → `POST /simulate/unit`), intervention planning, outcome monitoring
- [x] Aggregate-only enforcement at repository layer (no person-level rows for command)

## WS7 — Supabase Package (`supabase/`, ready to deploy)

- [x] `migrations/0001_init.sql` — all §13 tables, UUID PKs, FKs, indexes
- [x] `migrations/0002_rls.sql` — §14 RLS (personnel own rows, welfare unit authorization, command aggregate views)
- [x] `seed/seed.sql` — demo units / personnel / accounts

## WS8 — Hardening & Verification

- [x] Empty / error / offline / loading states on every screen
- [x] Non-alarmist copy review (§3), confidence + uncertainty labels on ML insights
- [x] Accessibility labels, minimum touch targets
- [x] `npx tsc --noEmit` clean
- [x] `npx expo lint` clean
- [x] pytest green (ml-service)
- [x] ML service boots (`uvicorn`) and answers `/health`
- [x] AGENTS.md updated (root + sih-app)
