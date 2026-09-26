# SAHAYAK — Implementation Document

> Personnel Welfare Intelligence, Recovery & Intervention Platform
> **Understand the Change. Support the Person. Improve the System.**
> Derived from `MASTERPrompt.docx`. This document is the single source of truth for architecture, contracts and verification.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  MOBILE APP (sih-app)  Expo SDK 57 · RN 0.86 · TypeScript        │
│                                                                  │
│  UI (Expo Router)                                                │
│    → Application Services (services/)                            │
│      → Repositories (repositories/)                              │
│        → Local SQLite (offline/)  ── sync queue ──► Supabase*    │
│      → Analytics Client (services/analyticsClient)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (EXPO_PUBLIC_ML_SERVICE_URL)
┌───────────────────────────▼─────────────────────────────────────┐
│  ML SERVICE (ml-service)  FastAPI · Python 3.12 · numpy/sklearn  │
│  baseline → deviation → persistence → recovery → volatility      │
│  → signal agreement → stressor interaction → explain → simulate  │
│  → recommendations                                               │
└─────────────────────────────────────────────────────────────────┘
*Supabase: delivered as ready-to-deploy SQL in supabase/. The app runs
fully in "local mode" until EXPO_PUBLIC_SUPABASE_URL is configured.
```

**Offline-first rule (MASTER §8):** every capture action (check-in, game, pulse, feedback, support request, case note) writes to SQLite immediately, updates UI, enqueues sync. Analytics are computed by the ML service when reachable and cached locally (`analytics_cache` with `model_version` + `generated_at`); screens render from cache offline with last-updated labels.

## 2. Repository Layout

```
sihAPKSAHAYAK/
├── sih-app/          # Expo mobile app (TypeScript, expo-router)
│   └── src/
│       ├── app/            # routes: (auth), (personnel), (welfare), (command)
│       ├── components/     # ui/, charts/, games/, shared widgets
│       ├── constants/      # theme
│       ├── context/        # SahayakContext (session/role/scenario/connectivity)
│       ├── hooks/          # data hooks (no SQL in components)
│       ├── offline/        # database, migrations, syncQueue, syncManager,
│       │                   # connectivity, conflictResolver, retryPolicy
│       ├── repositories/   # per-entity data access
│       ├── services/       # auth, analyticsClient, demoScenario,
│       │                   # notifications, audit, export, unitAggregation
│       └── types/          # shared TypeScript contracts
├── ml-service/       # FastAPI analytics service
│   ├── app/              # FastAPI factory, routes, schemas
│   ├── baseline/ anomaly/ recovery/ volatility/ signal_agreement/
│   ├── stressor_interaction/ explainability/ simulation/ recommendations/
│   ├── data/             # synthetic scenario generators A–F
│   ├── models/           # model registry (name/version)
│   └── tests/            # pytest
├── supabase/         # migrations/ + seed/ (deploy-ready, not required to run)
├── task.md
└── implementation.md
```

## 3. Mobile Data Layer

### 3.1 SQLite schema (offline/migrations.ts, `PRAGMA user_version = 1`)

Raw observation tables (never overwritten by ML output — §99):
`profiles`, `units`, `unit_memberships`, `duty_records`, `sleep_records`,
`recovery_records`, `check_ins`, `activity_sessions`, `activity_attempts`,
`support_requests`, `unit_pulses`, `personnel_feedback`,
`welfare_cases`, `interventions`, `intervention_followups`,
`notifications`, `audit_logs`, `sync_queue`, `analytics_cache`, `settings`.

Every locally created row carries (§9):
`id` (UUID), `client_id`, `created_at`, `updated_at`, `sync_status`
(`pending|syncing|synced|failed|conflict`), `sync_attempts`,
`last_sync_error`, `device_timestamp`, `server_timestamp`.

`analytics_cache(key TEXT PRIMARY KEY, person_id, unit_id, kind, payload TEXT,
confidence REAL, model_version TEXT, generated_at TEXT)` — derived results only.

### 3.2 Sync engine (offline/)

- `syncQueue.ts` — enqueue/dequeue, dedupe by `client_id`.
- `retryPolicy.ts` — exponential backoff 5 s → 15 s → 30 s → 60 s, max 5 attempts, then `failed`.
- `syncManager.ts` — drains queue when online **and** Supabase configured; otherwise stays in local mode and reports pending counts honestly.
- `connectivity.ts` — `@react-native-community/netinfo` when available; manual Header toggle acts as demo override.
- `conflictResolver.ts` — observations: client-wins with `client_id` dedupe; profile/settings: server-wins.

### 3.3 Services

- `services/auth.ts` — seeded demo accounts (below), session in `expo-sqlite/kv-store`, role routing, logout, password reset (local), audit log entries.
- `services/analyticsClient.ts` — typed fetch wrapper (5 s timeout). On success: writes `analytics_cache`. On failure: returns cached payload with `stale: true`.
- `services/demoScenario.ts` — generates 60 days of duty/sleep/recovery/check-in/activity data for the signed-in personnel **and** 12 unit members, per scenario A–F, so welfare/command views show consistent real data.
- `services/unitAggregation.ts` — aggregates local raw rows for command views (k-anonymity: suppress when n < 5).
- `services/notifications.ts` — local in-app notification center.
- `services/export.ts` — JSON export of own data (Privacy Center).
- `services/audit.ts` — security-sensitive action log (login, case create, export…).

### 3.4 Demo accounts (§108)

| Role | Email | Password |
|---|---|---|
| Personnel | `rohan@sahayak.demo` | `demo1234` |
| Welfare Officer | `meera@sahayak.demo` | `demo1234` |
| Command Admin | `arjun@sahayak.demo` | `demo1234` |

## 4. ML Service (ml-service/)

### 4.1 Engines

| Module | Method | Output |
|---|---|---|
| `baseline/robust_baseline.py` | rolling median + MAD | baseline, deviation, standardized_deviation |
| `baseline/ewma.py` | EWMA (α=0.3) | smoothed trend |
| `baseline/confidence.py` | f(sample_count, history days, missing %, variance) | 0–1 confidence + label |
| `anomaly/deviation.py` | robust z thresholds | per-day deviation flags |
| `anomaly/persistence.py` | consecutive-day rules: ≥3 d Emerging, ≥7 d Persistent, severe ≥10 d Sustained; signal disagreement → Conflicting | welfare state (never from one reading) |
| `recovery/recovery_score.py` | weighted blend of sleep/rest/workload/duty vs baseline | 0–100 |
| `recovery/recovery_debt.py` | Σ(expected − actual) | today / yesterday / 3-day + accumulating/stable/reducing |
| `recovery/half_life.py` | exponential fit on deviation series | days + trajectory points |
| `volatility/routine_volatility.py` | transition rate, start/duration/rest variance, day-night switches, sequence entropy | Low/Moderate/High/Elevated + components |
| `signal_agreement/agreement.py` | per-signal state fusion | agreement level, conflict flag, missing count |
| `stressor_interaction/` | interaction features A×B, A×C, B×C, A×B×C + interpretable linear model | ranked contributors (SHAP-style values, swappable interface) |
| `simulation/what_if.py` | burden model re-projection under scenario params | current vs scenario burden, trajectory, direction, confidence + disclaimer |
| `recommendations/welfare.py` | rule + evidence ranking | "observed / potential consideration / why" triples |

Model registry (`models/registry.py`): every response includes
`model_name`, `model_version`, `generated_at`, `confidence`, `warnings` (§98).
All outputs are non-diagnostic (§3): "observed change", "possible contributing factors".

### 4.2 API (§78) — base `/api/v1`

```
GET  /health
POST /baseline/calculate        {person_id, metric, values:[{date,value}]} → baseline result
POST /deviation/analyze         {series, baseline} → state, flags, persistence
POST /recovery/analyze          {sleep, rest, workload, duty, checkins, baseline}
POST /routine-volatility/analyze {duty_records}
POST /signal-agreement/analyze  {signals:{self_report,sleep,workload,activity,wearable}}
POST /stressor-interaction/analyze {daily records} → ranked contributors
POST /explain/person            {person bundle} → human-readable contributors
POST /simulate/person           {baseline, current, scenario params}
POST /simulate/unit             {unit aggregates, scenario}
POST /intervention/analyze      {before/after series}
POST /recommendations/welfare   {person or unit bundle} → recommendations[]
```

Response envelope (all endpoints):

```json
{
  "data": { },
  "confidence": 0.0,
  "warnings": ["Model simulation — not a guaranteed outcome."],
  "model_version": "sahayak-ml/0.1.0",
  "generated_at": "ISO-8601"
}
```

### 4.3 Running

```bash
cd ml-service
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
pytest -q
```

Mobile env (`.env` in `sih-app/`): `EXPO_PUBLIC_ML_SERVICE_URL=http://<LAN-IP>:8000`
(emulator: `http://10.0.2.2:8000`; device: machine LAN IP).

## 5. Screen ↔ Data Wiring (no dead UI)

| Screen | Data source |
|---|---|
| Personnel Home | `profiles` + `analytics_cache` + `check_ins` + `activity_sessions` (today) |
| Trends | `sleep/duty/recovery/check_ins` via repo → charts; radar from `deviation/analyze` |
| Stressor Map | `stressor-interaction/analyze` (cached) |
| Recovery | `recovery/analyze` (cached) + `simulate/person` |
| Unit Pulse | `unitAggregation` over local unit rows (k≥5) + `unit_pulses` insert |
| Welfare Dashboard | `analytics_cache` across authorized personnel of officer's unit |
| Root Cause Explorer | `explain/person` + stressor contributors |
| Cases / Interventions | `welfare_cases`, `interventions`, `intervention_followups` repos |
| Experiment Lab | `simulate/person` scenario presets |
| Command dashboards | `unitAggregation` + `simulate/unit` (aggregate only) |

## 6. Supabase package

- `supabase/migrations/0001_init.sql` — §13 tables, UUID PKs, FKs, indexes on `person_id`, `unit_id`, `created_at`, case/intervention status.
- `supabase/migrations/0002_rls.sql` — RLS: personnel `auth.uid()` own rows; welfare via `unit_memberships` authorization join; command reads aggregate views only (`unit_daily_aggregates`).
- `supabase/seed/seed.sql` — demo org, 4 units, 12 personnel, 3 accounts.

## 7. Verification

| Check | Command |
|---|---|
| Mobile typecheck | `cd sih-app && npx tsc --noEmit` |
| Mobile lint | `cd sih-app && npx expo lint` |
| ML tests | `cd ml-service && pytest -q` |
| ML boot | `uvicorn app.main:app --port 8000` → `GET /health` |
| Demo walkthrough (§109) | login as personnel → pick Scenario E → check-in + games → trends/recovery → login as welfare → priority → case → intervention lab → follow-up → outcome → login as command → weather → unit detail |
| Offline walkthrough | toggle Offline → check-in + Quick Tap → records `pending` → toggle Online → queue drains, cache refreshes |

## 8. Staged ML roadmap (§83)

Now: interpretable statistical engines + interaction-feature linear model behind stable interfaces.
Later: swap `stressor_interaction/model.py` to XGBoost+SHAP, add person-aware validation, without touching the app (`model_version` tracks the change).
