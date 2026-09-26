# SAHAYAK — New ML/AI Engine Implementation Guide

## Architecture Overview

```
SAHAYAK ML Service (ml-service/)
│
├── main.py                         # FastAPI application factory
├── requirements.txt                # Dependencies
│
├── config/                         # Configuration & infrastructure
│   ├── settings.py                 # Pydantic settings (env-driven, no hardcoding)
│   ├── logging_config.py           # Structured JSON logging
│   └── supabase.py                 # Supabase client
│
├── api/                            # API layer
│   ├── envelope.py                 # Consistent {success, data, meta, warnings}
│   ├── deps.py                     # Auth/context dependencies
│   └── routes/
│       ├── health.py
│       ├── person.py               # /v1/person/{id}/*
│       ├── unit.py                 # /v1/unit/{id}/*
│       ├── intervention.py         # /v1/intervention/*
│       └── jobs.py                 # /v1/ml/jobs
│
├── data/                           # Data access & validation
│   ├── validator.py                # Schema validation + missing-data metadata
│   └── loader.py                   # Data loading from Supabase
│
├── features/                       # Feature engineering
│   ├── definitions.py              # Canonical feature definitions
│   ├── pipeline.py                 # Compute feature set from raw data
│   └── store.py                    # Feature storage with as_of_timestamp
│
├── baseline/                       # Personal baseline engine
│   ├── engine.py                   # Robust baseline (median, MAD, EWMA)
│   ├── maturity.py                 # NEW/LEARNING/DEVELOPING/ESTABLISHED
│   ├── confidence.py               # Baseline confidence scoring
│   └── adaptation.py              # Gradual EWMA adaptation
│
├── deviation/                      # Deviation engine
│   └── engine.py                   # Robust z-score, direction-aware
│
├── persistence/                    # Persistence engine
│   └── engine.py                   # ISOLATED/REPEATED/PERSISTENT/SUSTAINED
│
├── recovery/                       # Recovery analytics
│   ├── score.py                    # Recovery score series
│   ├── debt.py                     # Recovery debt (1/3/7-day)
│   ├── half_life.py                # Exponential decay half-life
│   ├── trajectory.py               # Trajectory classification
│   └── cumulative_load.py          # Cumulative load model
│
├── volatility/                     # Routine volatility
│   └── engine.py                   # Duty/rest/shift volatility
│
├── signal_agreement/               # Multi-signal fusion
│   └── engine.py                   # Normalize, compare, detect conflict
│
├── state/                          # Current state engine
│   └── engine.py                   # STABLE/EMERGING/PERSISTENT/CONFLICTING/SUSTAINED
│
├── explainability/                 # Explanation layer
│   ├── engine.py                   # Build contributor timeline
│   └── formatter.py                # Human-readable text generation
│
├── interactions/                   # Stressor interaction engine
│   ├── features.py                 # Interaction feature engineering
│   ├── model.py                    # XGBoost model (fallback: statistical)
│   └── shap_explainer.py           # SHAP TreeExplainer + human text
│
├── anomaly/                        # Anomaly detection
│   ├── detector.py                 # Robust z-score + EWMA + quantile
│   └── thresholds.py              # Configurable thresholds
│
├── simulation/                     # What-if simulators
│   ├── person.py                   # Personal what-if
│   ├── unit.py                     # Unit what-if
│   └── intervention.py             # Intervention simulation (WO)
│
├── digital_twin/                   # Work-recovery digital twin
│   └── twin.py                     # Exposure/recovery/deviation trajectories
│
├── aggregation/                    # Unit & org aggregation
│   ├── unit.py                     # Unit metrics (k≥5 privacy)
│   ├── wellness_weather.py         # Wellness weather states
│   └── root_cause.py              # Unit root-cause analysis
│
├── models/                         # Model registry & versioning
│   └── registry.py                 # Model metadata, ENGINE_VERSIONS
│
├── pipelines/                      # ML job system
│   ├── job_manager.py              # Job lifecycle, coalescing, idempotency
│   └── retry.py                    # Exponential backoff retry
│
├── evaluation/                     # Model evaluation
│   ├── metrics.py                  # MAE, RMSE, F1, ROC-AUC, calibration
│   ├── splitter.py                 # Time-aware train/val/test split
│   └── drift.py                    # PSI, KS test drift monitoring
│
├── synthetic_data/                 # Synthetic data generation
│   ├── generator.py                # 100–500 persons, 90–180 days
│   └── patterns.py                 # Edge-case patterns
│
└── tests/                          # Test suite
    ├── test_baseline.py
    ├── test_deviation.py
    ├── test_persistence.py
    ├── test_recovery.py
    ├── test_signal.py
    ├── test_simulation.py
    ├── test_privacy.py
    └── test_e2e.py
```

---

## Core Intelligence Pipeline

```
RAW DATA (from Supabase / offline sync)
    ↓
data/validator.py         → Validate, flag missing fields, imputation metadata
    ↓
features/pipeline.py      → Compute canonical feature set with as_of_timestamp
    ↓
baseline/engine.py        → Rolling median + MAD + EWMA per person per metric
    ↓
deviation/engine.py       → Robust z-score, direction-aware
    ↓
persistence/engine.py     → Duration/frequency/severity tracking
    ↓
signal_agreement/engine.py → Normalize signals, detect conflict
    ↓
state/engine.py           → STABLE / EMERGING / PERSISTENT / CONFLICTING / SUSTAINED
    ↓
interactions/model.py     → XGBoost (or statistical fallback) + SHAP
    ↓
explainability/engine.py  → Observed / model-derived / possible / uncertain
    ↓
recovery/                 → Debt, half-life, trajectory, cumulative load
    ↓
Store derived results → Supabase
```

---

## Configuration System (config/settings.py)

All thresholds are configurable via environment variables / YAML:

```python
class BaselineConfig:
    min_observations: int = 7
    established_observations: int = 22
    adaptation_rate: float = 0.05      # EWMA alpha
    short_term_window: int = 7
    long_term_window: int = 30

class PersistenceConfig:
    isolated_threshold: int = 1
    repeated_threshold: int = 2
    persistent_threshold: int = 3
    sustained_threshold: int = 5

class PrivacyConfig:
    min_aggregate_group_size: int = 5

class RecoveryConfig:
    half_life_min_observations: int = 5
    debt_windows: list = [1, 3, 7]

class DeviationConfig:
    mild_threshold: float = 1.0        # z-score
    moderate_threshold: float = 1.5
    severe_threshold: float = 2.0
```

---

## API Response Envelope

Every endpoint returns:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "model_version": "baseline-v0.2.0",
    "generated_at": "2026-09-26T12:00:00Z",
    "data_quality": "good",
    "confidence": 0.84,
    "baseline_maturity": "ESTABLISHED"
  },
  "warnings": []
}
```

Errors:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Not enough historical data to estimate a reliable baseline."
  }
}
```

---

## Baseline Maturity

| Stage | Observations | Confidence | Behavior |
|---|---|---|---|
| NEW | 0–6 | Low (< 0.3) | Descriptive only, no deviation scores |
| LEARNING | 7–13 | Moderate (0.3–0.6) | Weak signals, wide uncertainty |
| DEVELOPING | 14–21 | Good (0.6–0.8) | Deviation active, persistence limited |
| ESTABLISHED | 22+ | High (0.8+) | Full pipeline active |

---

## State Machine

```
STABLE              → No significant deviation across signals
EMERGING_CHANGE     → 1–2 deviations, short persistence, moderate confidence
PERSISTENT_DEVIATION → 3+ observations with consistent deviation
CONFLICTING_SIGNALS → Signals disagree (high × normal signals)
SUSTAINED_CONCERN   → Long persistence, multiple signals, high confidence
```

**Transition rules:**
- Conflicting signals ALWAYS reduce confidence (never inflate concern)
- Low baseline maturity caps state at EMERGING_CHANGE
- Missing data increases uncertainty, reduces confidence
- Single bad observation = ISOLATED, no state change

---

## Recovery Debt Formula

```
Recovery Debt(t) = Σ [Expected_Recovery(d) - Actual_Recovery(d)]
                  for d in window (1d, 3d, 7d)

Expected_Recovery = personal_baseline_recovery_score
Actual_Recovery   = observed_recovery_score
```

---

## Recovery Half-Life

```
deviation(t) = deviation_initial × exp(-λ × t)
half_life = ln(2) / λ
```
Only computed when ≥ 5 post-deviation observations exist.

---

## Cumulative Load Formula

```
Load(t) = Load(t-1) + StressExposure(t) - Recovery(t)

StressExposure = w1×workload + w2×duty_hours + w3×night_shifts
               + w4×consecutive_duty + w5×routine_volatility

Recovery = w6×sleep + w7×rest + w8×recovery_score
```
All weights configurable.

---

## XGBoost + SHAP Design

```python
# Interaction features
sleep_x_workload      = sleep_deviation × workload_deviation
night_x_sleep         = night_shift_freq × sleep_deficit
workload_x_recovery   = workload_excess × recovery_gap
duty_x_rest           = duty_duration × -rest_interval

# Model: predict recovery_trajectory
model = XGBRegressor(n_estimators=100, max_depth=4)

# SHAP
explainer = shap.TreeExplainer(model)
shap_values = explainer(X_instance)

# Human-readable translation
# shap_value = -0.27 →
# "Night-shift exposure is associated with a lower modeled recovery trajectory."
```

Fallback: if model not trained or data < 30 samples → statistical interaction model.

---

## Privacy Rules

- Unit aggregates require **k ≥ 5** persons
- If k < 5: return `{"error": {"code": "PRIVACY_GUARD", "message": "Insufficient group size"}}`
- Never expose individual results as unit results
- Command dashboard: aggregates only
- Welfare officer: individual (authorized scope only)

---

## ML Job System

```
Trigger Event (CHECK_IN_SUBMITTED, ACTIVITY_COMPLETED, ...)
    ↓
Event coalescing (batch same-person events within 5-min window)
    ↓
Create ml_jobs record (PENDING)
    ↓
Worker picks up job (PROCESSING)
    ↓
Run pipeline for affected person/date-range
    ↓
Store derived results (idempotent upsert)
    ↓
Mark job COMPLETED
    ↓ (on failure)
Retry with exponential backoff (5s → 15s → 30s → 60s)
Mark RETRYING → after max_attempts: FAILED
```

---

## Synthetic Data Generator

Generates deterministic longitudinal data:

```python
scenarios = {
    "stable":           # Normal healthy pattern
    "disrupted":        # Temporary sleep/workload disruption
    "persistent":       # Sustained workload increase
    "night_heavy":      # High night-shift schedule
    "recovering":       # Post-intervention recovery
    "high_volatility":  # Erratic schedule
    "conflicting":      # Mixed signal pattern
    "new_user":         # < 7 days history
    "missing_data":     # Many gaps
    "intervention":     # Before/during/after intervention arc
}

# Edge cases
edge_cases = [
    "duplicate_event", "offline_delayed", "outlier_reaction_time",
    "sudden_schedule_change", "long_leave", "insufficient_baseline"
]
```

---

## Frontend Integration Points

### analyticsClient.ts
```typescript
// Base URL: EXPO_PUBLIC_ML_SERVICE_URL (e.g. http://192.168.x.x:8000)

analyzePersonnel(personId: string, data: RawObservationBundle)
  → POST /v1/person/{personId}/analyze

getBaseline(personId: string)
  → GET /v1/person/{personId}/baseline

getRecovery(personId: string)
  → GET /v1/person/{personId}/recovery

getExplanation(personId: string)
  → GET /v1/person/{personId}/explanation

simulateScenario(personId: string, scenario: SimScenario)
  → POST /v1/person/{personId}/simulate

getUnitAnalytics(unitId: string)
  → POST /v1/unit/{unitId}/analyze
```

### Screens that consume ML data
| Screen | Data source | Fallback |
|---|---|---|
| `(personnel)/trends` | `/v1/person/{id}/explanation` | Cached SQLite result |
| `(personnel)/recovery` | `/v1/person/{id}/recovery` | Cached SQLite result |
| `(personnel)/index` | `/v1/person/{id}/baseline` | "Baseline learning" message |
| `(welfare)/index` | `/v1/unit/{id}/analyze` | Cached unit metrics |
| `(welfare)/personnel` | `/v1/person/{id}/explanation` | Cached individual |
| `(command)/index` | `/v1/unit/{id}/trends` (all units) | Cached org metrics |

---

## Non-negotiable Rules

1. **Never return `{"risk": 0.82}` without explanation**
2. **Never diagnose** — use "observed pattern", "potential contributor", "associated with"
3. **New user safety** — 0 observations must never show a score, show "still learning"
4. **Conflicting signals reduce confidence** — do NOT auto-escalate
5. **Simulation disclaimer** — every `/simulate` response must contain `"simulation_disclaimer"` field
6. **Reproducibility** — set `random_state` on all stochastic components
7. **Leakage prevention** — every feature includes `as_of_timestamp`
8. **Privacy guard** — hard-block aggregates with k < 5
9. **No magic numbers** — every threshold lives in `config/settings.py`
10. **Fallback chain** — XGBoost → Statistical → Descriptive, never fabricate

---

## Running the Service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --host 0.0.0.0

# API docs
open http://localhost:8000/docs

# Run tests
pytest tests/ -v

# Generate synthetic data
python -m synthetic_data.generator --persons 100 --days 90 --seed 42
```

---

## Supabase Tables Required (Derived)

```sql
-- Created by migrations
baseline_metrics        (person_id, metric, baseline, mad, confidence, maturity, ...)
deviation_events        (person_id, metric, z_score, direction, persistence_state, ...)
recovery_metrics        (person_id, debt_1d, debt_3d, debt_7d, half_life, trajectory, ...)
cumulative_load         (person_id, date, load_score, stress_exposure, recovery_actual, ...)
routine_volatility      (person_id, date, level, duty_volatility, rest_volatility, ...)
signal_agreement        (person_id, date, result, agreement_level, conflict, ...)
stressor_interactions   (person_id, date, contributors, shap_values, model_version, ...)
model_explanations      (person_id, date, state, summary, contributors, confidence, ...)
what_if_simulations     (person_id, created_at, scenario, result, disclaimer, ...)
ml_jobs                 (id, person_id, trigger_type, status, started_at, ...)
model_registry          (id, model_name, version, status, metrics, ...)
unit_metrics_daily      (unit_id, date, wellness_weather, recovery_pressure, ...)
```
