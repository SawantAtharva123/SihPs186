# SAHAYAK — Implementation Audit & Task Tracker

## ✅ Already Completed

### ML Service (`ml-service/`)
- `app/main.py` — FastAPI factory, CORS ✅
- `app/routes.py` — All §78 endpoints with response envelope ✅
- `app/schemas.py` — Pydantic request schemas ✅
- `baseline/` — robust_baseline.py, ewma.py, confidence.py ✅
- `anomaly/` — deviation.py, persistence.py, thresholds.py ✅
- `recovery/` — recovery_score.py, recovery_debt.py, half_life.py, trajectory.py ✅
- `volatility/routine_volatility.py` ✅
- `signal_agreement/agreement.py` ✅
- `stressor_interaction/model.py` ✅
- `explainability/` — contributor_engine.py, explanation_formatter.py ✅
- `simulation/what_if.py` ✅
- `recommendations/welfare.py` ✅
- `data/synthetic.py` ✅
- `models/registry.py` ✅
- `stress_assessment/trainer.py` — Multi-modal LightGBM trainer on 10,000 personnel & 80,000 observations ✅
- `stress_assessment/engine.py` — Asymmetric Bayes risk minimization (loss matrix up to 22x) + hard safety floors + signal agreement ✅
- `models/stress_model_bundle.joblib` — Trained model artifact (93.8% critical recall, zero undercounting bias) ✅
- `app/routes.py` — Added `/api/v1/stress/predict`, `/api/v1/medical/report-analyze`, `/api/v1/stress/model-info` ✅
- `app/schemas.py` — Added MultiModalStressRequest, DoctorReportData, MiniGameData, SelfAssessmentData ✅

### Mobile App — Foundation
- `src/types/sahayak.ts` — All TypeScript types ✅
- `src/constants/theme.ts` — Colors, Spacing, Radius, Shadow ✅
- `src/context/SahayakContext.tsx` — role/scenario/offline state ✅
- `src/components/Header.tsx` — Role switcher, offline toggle ✅
- `src/components/DailyCheckInModal.tsx` — Check-in modal with exact sleep hours stepper & quick chips ✅
- `src/components/DoctorReportModal.tsx` — Upload doctor/medical reports with clinical stress flags & rest days ✅
- `src/components/games/QuickTapGame.tsx` — Fully playable ✅
- `src/components/games/GoNoGoGame.tsx` — Reaction inhibition & variability assessment ✅
- `src/repositories/medical.ts` — Medical consultation & clinical notes SQLite repo ✅
- `src/repositories/checkIns.ts` — Check-in repo writing exact sleepHours to sleep_records ✅
- `src/hooks/useStressAssessment.ts` — Live multi-modal aggregation hook (doctor + games + sleep) ✅
- `src/app/_layout.tsx` — Root layout ✅
- `src/app/index.tsx` — Role-based redirect ✅

### Personnel Screens (Basic)
- `(personnel)/_layout.tsx` — 7-tab layout ✅
- `(personnel)/index.tsx` — Home with all card sections ✅
- `(personnel)/activities.tsx` — List + QuickTap game ✅
- `(personnel)/trends.tsx` — Radar + Stressor Map (static) ✅
- `(personnel)/recovery.tsx` — Debt + half-life + what-if simulator ✅

### Welfare Screens (Partial)
- `(welfare)/index.tsx` — Dashboard with state distribution + priority ✅
- `(welfare)/personnel.tsx` — List + detail modal with signal agreement ✅

### Command Screens (Basic)
- `(command)/index.tsx` — Org dashboard + wellness weather ✅
- `(command)/units.tsx` — Unit list (need to check)

---

## ❌ Missing / Stub Screens

### Personnel
- `(personnel)/pulse.tsx` — STUB → Full unit pulse screen needed
- `(personnel)/support.tsx` — STUB → Full support screen needed
- `(personnel)/privacy.tsx` — STUB → Privacy center needed

### Welfare
- `(welfare)/cases.tsx` — STUB → Full case management screen needed
- `(welfare)/interventions.tsx` — STUB → Full interventions + experiment lab needed

### Auth
- `(auth)/login.tsx` — MISSING → Login screen with demo account quick-select

---

## ❌ Missing Infrastructure

### Offline Layer (`src/offline/`)
- `database.ts` — openDatabaseAsync, WAL, FK pragma
- `migrations.ts` — Full schema with PRAGMA user_version
- `syncQueue.ts` — Enqueue/dequeue/dedupe
- `syncManager.ts` — Drain queue when online
- `retryPolicy.ts` — Exponential backoff 5/15/30/60s
- `conflictResolver.ts` — Observations: client-wins; settings: server-wins
- `connectivity.ts` — NetInfo + manual override

### Services (`src/services/`)
- `auth.ts` — Local demo accounts, session in kv-store, audit
- `analyticsClient.ts` — Typed HTTP → FastAPI, cache write-through
- `demoScenario.ts` — Seeds 60-day scenarios A–F into SQLite
- `notifications.ts` — In-app notification center
- `audit.ts` — Security-sensitive action log
- `export.ts` — JSON export of own data
- `unitAggregation.ts` — Aggregates for command views (k≥5)

### Repositories (`src/repositories/`)
- `checkIns.ts`
- `activities.ts`
- `duty.ts`, `sleep.ts`, `recovery.ts`
- `supportRequests.ts`
- `pulses.ts`, `feedback.ts`
- `cases.ts`, `interventions.ts`
- `profiles.ts`
- `notifications.ts`
- `analyticsCache.ts`

### Hooks (`src/hooks/`)
- `useCheckIn.ts`
- `useActivities.ts`
- `useTrends.ts`
- `useRecoveryAnalytics.ts`
- `useSignalAgreement.ts`
- `useWelfareCases.ts`
- `useInterventions.ts`
- `useUnitAnalytics.ts`
- `useConnectivity.ts`

### Games (`src/components/games/`)
- `GoNoGoGame.tsx`
- `SequenceRecallGame.tsx`
- `OddOneOutGame.tsx`
- `DirectionMatchGame.tsx`

### Supabase Package (`supabase/`)
- `migrations/0001_init.sql`
- `migrations/0002_rls.sql`
- `seed/seed.sql`

### ML Tests (`ml-service/tests/`)
- Need to verify existing or add pytest suite

---

## Build Order

1. **Offline layer** (database, migrations, syncQueue, syncManager, retryPolicy, conflictResolver, connectivity)
2. **Services** (auth, analyticsClient, demoScenario, notifications, audit, export, unitAggregation)
3. **Repositories** (all 12 repos)
4. **Hooks** (all 9 hooks)
5. **Login screen** + update _layout.tsx for auth routing
6. **Remaining games** (Go/No-Go, Sequence Recall, Odd One Out, Direction Match)
7. **Personnel stubs** (pulse, support, privacy)
8. **Welfare stubs** (cases, interventions with experiment lab)
9. **Supabase package**
10. **ML pytest suite** (verify/add)
