# SAHAYAK — New ML Implementation Task Tracker

## Status Legend
- ⬜ TODO
- 🔄 IN PROGRESS
- ✅ DONE
- ❌ BLOCKED

---

## PHASE 1 — Core Infrastructure
| Task | Status | Module |
|---|---|---|
| Configuration system (no hardcoded thresholds) | ⬜ | `config/settings.py` |
| Structured logging | ⬜ | `config/logging.py` |
| FastAPI app factory (v2) | ⬜ | `main.py` |
| Pydantic v2 schemas (all endpoints) | ⬜ | `api/schemas.py` |
| Supabase client wrapper | ⬜ | `config/supabase.py` |
| Health + metrics endpoint | ⬜ | `api/routes/health.py` |

## PHASE 2 — Synthetic Data + Feature Engineering
| Task | Status | Module |
|---|---|---|
| Comprehensive synthetic data generator (100+ persons, 90–180 days) | ⬜ | `synthetic_data/generator.py` |
| Edge-case patterns (missing, outlier, new user, conflict, leave, intervention) | ⬜ | `synthetic_data/patterns.py` |
| Feature definitions (sleep, workload, duty, recovery, activity) | ⬜ | `features/definitions.py` |
| Feature computation pipeline | ⬜ | `features/pipeline.py` |
| Feature store with timestamps | ⬜ | `features/store.py` |
| Data validation + missing-value metadata | ⬜ | `data/validator.py` |

## PHASE 3 — Baseline + Deviation + Persistence
| Task | Status | Module |
|---|---|---|
| Rolling median + MAD + EWMA baseline | ✅ | `baseline/engine.py` |
| Baseline maturity (NEW/LEARNING/DEVELOPING/ESTABLISHED) | ✅ | `baseline/maturity.py` |
| Baseline confidence scoring | ✅ | `baseline/confidence.py` |
| Gradual baseline adaptation (EWMA alpha) | ✅ | `baseline/adaptation.py` |
| Short-term vs long-term baselines | ✅ | `baseline/engine.py` |
| Robust z-score deviation | ✅ | `deviation/engine.py` |
| Direction-aware deviation (sleep↓ vs workload↑) | ✅ | `deviation/engine.py` |
| Persistence detection (ISOLATED/REPEATED/PERSISTENT/SUSTAINED) | ✅ | `persistence/engine.py` |
| Persistence metadata (duration, frequency, severity) | ✅ | `persistence/engine.py` |

## PHASE 4 — Recovery + Load + Volatility
| Task | Status | Module |
|---|---|---|
| Recovery score series | ⬜ | `recovery/score.py` |
| Recovery debt (expected − actual, 1/3/7-day) | ⬜ | `recovery/debt.py` |
| Recovery half-life (exponential decay model) | ⬜ | `recovery/half_life.py` |
| Recovery trajectory classification | ⬜ | `recovery/trajectory.py` |
| Cumulative load model (configurable weights) | ⬜ | `recovery/cumulative_load.py` |
| Routine volatility (duty timing, rest, night transitions) | ⬜ | `volatility/engine.py` |
| Volatility categories (LOW/MODERATE/HIGH/ELEVATED) | ⬜ | `volatility/engine.py` |

## PHASE 5 — Signal Agreement + State Engine
| Task | Status | Module |
|---|---|---|
| Multi-signal normalization against baseline | ⬜ | `signal_agreement/engine.py` |
| Direction/magnitude agreement scoring | ⬜ | `signal_agreement/engine.py` |
| Conflicting signals detection | ⬜ | `signal_agreement/engine.py` |
| Current state engine (STABLE/EMERGING/PERSISTENT/CONFLICTING/SUSTAINED) | ⬜ | `state/engine.py` |
| State considers deviation+persistence+signals+confidence | ⬜ | `state/engine.py` |
| Explainability engine (observed/model-derived/possible/uncertain) | ⬜ | `explainability/engine.py` |
| Human-readable contributor text generation | ⬜ | `explainability/formatter.py` |

## PHASE 6 — XGBoost + SHAP + Stressor Interaction
| Task | Status | Module |
|---|---|---|
| Interaction feature engineering (sleep×workload, night×sleep, etc.) | ⬜ | `interactions/features.py` |
| XGBoost stressor interaction model | ⬜ | `interactions/model.py` |
| SHAP TreeExplainer integration | ⬜ | `interactions/shap_explainer.py` |
| Human-readable SHAP translation | ⬜ | `interactions/shap_formatter.py` |
| Fallback to statistical model when insufficient data | ⬜ | `interactions/model.py` |

## PHASE 7 — Simulation + Digital Twin
| Task | Status | Module |
|---|---|---|
| Personal what-if simulator (validated inputs, realistic) | ⬜ | `simulation/person.py` |
| Unit what-if simulator | ⬜ | `simulation/unit.py` |
| Intervention simulation (WO scenarios) | ⬜ | `simulation/intervention.py` |
| Work-recovery digital twin | ⬜ | `digital_twin/twin.py` |
| Digital twin: current/scenario/intervention trajectories | ⬜ | `digital_twin/twin.py` |
| Simulation disclaimers enforced | ⬜ | `simulation/` |

## PHASE 8 — Unit Aggregation + Wellness Weather + ML Jobs
| Task | Status | Module |
|---|---|---|
| Unit aggregate metrics (min k=5 privacy guard) | ⬜ | `aggregation/unit.py` |
| Wellness Weather states | ⬜ | `aggregation/wellness_weather.py` |
| Unit root-cause analysis | ⬜ | `aggregation/root_cause.py` |
| ML job system (PENDING/PROCESSING/COMPLETED/FAILED/RETRYING) | ⬜ | `pipelines/job_manager.py` |
| Event coalescing (no duplicate jobs per batch) | ⬜ | `pipelines/job_manager.py` |
| Retry with exponential backoff | ⬜ | `pipelines/retry.py` |
| Idempotency (same event → no duplicate results) | ⬜ | `pipelines/job_manager.py` |

## PHASE 9 — Model Registry + Evaluation + Training Pipeline
| Task | Status | Module |
|---|---|---|
| Model registry (DEVELOPMENT/VALIDATED/ACTIVE/RETIRED) | ⬜ | `models/registry.py` |
| Time-aware train/val/test split | ⬜ | `evaluation/splitter.py` |
| Evaluation metrics (MAE, RMSE, F1, ROC-AUC, calibration) | ⬜ | `evaluation/metrics.py` |
| Training pipeline | ⬜ | `pipelines/training.py` |
| Feature store with as_of_timestamp | ⬜ | `features/store.py` |
| Drift monitoring (PSI, KS test) | ⬜ | `evaluation/drift.py` |

## PHASE 10 — API Layer (Full Redesign)
| Task | Status | Module |
|---|---|---|
| `GET /health` | ⬜ | `api/routes/health.py` |
| `POST /v1/person/{id}/analyze` | ⬜ | `api/routes/person.py` |
| `GET /v1/person/{id}/baseline` | ⬜ | `api/routes/person.py` |
| `GET /v1/person/{id}/trends` | ⬜ | `api/routes/person.py` |
| `GET /v1/person/{id}/recovery` | ⬜ | `api/routes/person.py` |
| `GET /v1/person/{id}/explanation` | ⬜ | `api/routes/person.py` |
| `POST /v1/person/{id}/simulate` | ⬜ | `api/routes/person.py` |
| `POST /v1/intervention/simulate` | ⬜ | `api/routes/intervention.py` |
| `POST /v1/unit/{id}/analyze` | ⬜ | `api/routes/unit.py` |
| `GET /v1/unit/{id}/trends` | ⬜ | `api/routes/unit.py` |
| `POST /v1/unit/{id}/simulate` | ⬜ | `api/routes/unit.py` |
| `POST /v1/ml/jobs` | ⬜ | `api/routes/jobs.py` |
| Consistent `{success, data, meta, warnings}` envelope | ⬜ | `api/envelope.py` |
| Input validation + auth context | ⬜ | `api/` |

## PHASE 11 — Tests
| Task | Status | Module |
|---|---|---|
| Baseline unit tests (normal/outlier/missing/new user) | ⬜ | `tests/test_baseline.py` |
| Deviation unit tests | ⬜ | `tests/test_deviation.py` |
| Persistence unit tests | ⬜ | `tests/test_persistence.py` |
| Recovery unit tests | ⬜ | `tests/test_recovery.py` |
| Signal agreement tests | ⬜ | `tests/test_signal.py` |
| Simulation tests (valid/invalid/extreme) | ⬜ | `tests/test_simulation.py` |
| Privacy tests (min group size) | ⬜ | `tests/test_privacy.py` |
| End-to-end integration test (full pipeline) | ⬜ | `tests/test_e2e.py` |

## PHASE 12 — Frontend Integration
| Task | Status | Module |
|---|---|---|
| Update `analyticsClient.ts` to new API endpoints | ⬜ | `sih-app/src/services/analyticsClient.ts` |
| `useRecoveryAnalytics` hook | ⬜ | `sih-app/src/hooks/useRecoveryAnalytics.ts` |
| `useSignalAgreement` hook | ⬜ | `sih-app/src/hooks/useSignalAgreement.ts` |
| `useUnitAnalytics` hook | ⬜ | `sih-app/src/hooks/useUnitAnalytics.ts` |
| Personnel trends screen (live ML data) | ⬜ | `sih-app/src/app/(personnel)/trends.tsx` |
| Personnel recovery screen (live ML data) | ⬜ | `sih-app/src/app/(personnel)/recovery.tsx` |
| Welfare officer dashboard (live ML data) | ⬜ | `sih-app/src/app/(welfare)/index.tsx` |
| Command dashboard (wellness weather) | ⬜ | `sih-app/src/app/(command)/index.tsx` |

---

## Key Design Invariants
1. **No hardcoded fake AI** — every number is computed from real data
2. **Non-diagnostic** — no medical/psychological labels
3. **Personal baseline first** — universal thresholds are forbidden
4. **Confidence is visible** — every result carries confidence + data_quality
5. **Conflicting signals ≠ high concern** — disagreement → reduced confidence
6. **Simulation disclaimer** — every simulation result carries a model disclaimer
7. **Privacy guard** — unit aggregates require k ≥ 5 persons
8. **No leakage** — every feature has `as_of_timestamp`

---

## Dependencies / Tech Stack
- Python 3.12
- FastAPI ≥ 0.115
- Pydantic ≥ 2.7
- numpy ≥ 1.26
- scikit-learn ≥ 1.4
- xgboost ≥ 2.0
- shap ≥ 0.45
- pandas ≥ 2.2
- scipy ≥ 1.13
- networkx ≥ 3.3
- joblib ≥ 1.4
- uvicorn[standard] ≥ 0.30
- pytest ≥ 8.0
- httpx ≥ 0.27
