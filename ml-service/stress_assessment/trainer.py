"""SAHAYAK — Stress & Welfare Multi-Modal Model Trainer.

Trains an integrated model on:
1. Doctor / Medical Consultation Reports
2. Mini-Game Functional Cognitive Performance (Reaction times, accuracy, error rates)
3. Self-Assessment Check-ins (Sleep hours, mood, energy, recovery feeling)
4. Operational context (Duty hours, night shifts, combat exposure)

Enforces Asymmetric Bayes Risk Decision Rule to mathematically prevent undercounting stress.
"""
from __future__ import annotations

import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
import lightgbm as lgb
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("stress_model_trainer")

# Define paths
WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TRAIN_CSV = os.path.join(WORKSPACE_DIR, "capf_personnel_stress_welfare_training.csv")
OBS_CSV = os.path.join(WORKSPACE_DIR, "wellbeing_observations.csv")
BUNDLE_SAVE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "stress_model_bundle.joblib")

# Cost matrix for Asymmetric Bayes Decision Rule: C[true, pred]
# Rows = True class [Low, Medium, High, Critical]
# Columns = Predicted class [Low, Medium, High, Critical]
# Undercounting (pred < true) carries severe penalties:
ASYMMETRIC_COST_MATRIX = np.array([
    [0.0, 1.0, 2.0, 3.0],    # True: Low
    [3.0, 0.0, 1.0, 2.0],    # True: Medium (pred Low penalty: 3.0)
    [8.0, 4.0, 0.0, 1.0],    # True: High (pred Low penalty: 8.0, pred Med: 4.0)
    [22.0, 12.0, 4.0, 0.0]   # True: Critical (pred Low penalty: 22.0, pred Med: 12.0, pred High: 4.0)
])

FEATURE_COLUMNS = [
    # ── 1. Doctor / Medical Reports Features ──────────────────────────
    "medical_consultations_count",
    "sick_leave_days",
    "prior_counseling_sessions",
    "disciplinary_incidents",
    "absenteeism_rate_pct",
    
    # ── 2. Mini-Games (Cognitive & Reaction Performance) ──────────────
    "rapid_avg_reaction_time_ms",
    "rapid_reaction_time_std_ms",
    "rapid_accuracy",
    "rapid_missed_targets",
    "rapid_false_taps",
    "focus_avg_reaction_time_ms",
    "focus_accuracy",
    "focus_distractor_errors",
    "focus_missed_targets",
    
    # ── 3. Self-Assessment (Sleep hours, Energy, Mood, Recovery) ─────
    "sleep_hours",
    "sleep_quality_score",
    "energy_level",
    "mood_level",
    "recovery_level",
    "wellness_survey_score",
    "peer_support_score",
    "financial_stress_level",
    "self_reported_stress_num",
    
    # ── 4. Operational Context ────────────────────────────────────────
    "duty_hours_per_week",
    "night_shifts_per_month",
    "workload_index",
    "combat_exposure_incidents",
    "family_separation_months"
]

CLASS_NAMES = ["Low", "Medium", "High", "Critical"]
RISK_MAP = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}


def load_and_preprocess_data():
    """Load both CSV datasets and merge aggregated mini-game metrics with personnel profiles."""
    if not os.path.exists(TRAIN_CSV) or not os.path.exists(OBS_CSV):
        raise FileNotFoundError(f"Missing dataset files: {TRAIN_CSV} or {OBS_CSV}")

    logger.info("Loading training profiles from %s...", TRAIN_CSV)
    df_train = pd.read_csv(TRAIN_CSV)
    
    logger.info("Loading wellbeing observations from %s...", OBS_CSV)
    df_obs = pd.read_csv(OBS_CSV)

    logger.info("Aggregating longitudinal mini-game sessions per employee...")
    agg_obs = df_obs.groupby("Employee_ID").agg({
        "Rapid_Avg_Reaction_Time_ms": "mean",
        "Rapid_Reaction_Time_Std_ms": "mean",
        "Rapid_Accuracy": "mean",
        "Rapid_Missed_Targets": "mean",
        "Rapid_False_Taps": "mean",
        "Focus_Avg_Reaction_Time_ms": "mean",
        "Focus_Accuracy": "mean",
        "Focus_Distractor_Errors": "mean",
        "Focus_Missed_Targets": "mean",
        "Energy_Level_1to10": "mean",
        "Mood_Level_1to10": "mean",
        "Recovery_Level_1to10": "mean"
    }).reset_index()

    merged = df_train.merge(agg_obs, on="Employee_ID")
    logger.info("Merged dataset shape: %s", merged.shape)

    # 1. Doctor / Medical Reports mapping
    merged["medical_consultations_count"] = merged["Medical_Consultations_Last_Year"].fillna(0)
    merged["sick_leave_days"] = merged["Sick_Leave_Days"].fillna(0)
    merged["prior_counseling_sessions"] = merged["Prior_Counseling_Sessions"].fillna(0)
    merged["disciplinary_incidents"] = merged["Disciplinary_Incidents_Last_Year"].fillna(0)
    merged["absenteeism_rate_pct"] = merged["Absenteeism_Rate_Pct"].fillna(0)

    # 2. Mini-Games mapping
    merged["rapid_avg_reaction_time_ms"] = merged["Rapid_Avg_Reaction_Time_ms"].fillna(460.0)
    merged["rapid_reaction_time_std_ms"] = merged["Rapid_Reaction_Time_Std_ms"].fillna(40.0)
    merged["rapid_accuracy"] = merged["Rapid_Accuracy"].fillna(0.88)
    merged["rapid_missed_targets"] = merged["Rapid_Missed_Targets"].fillna(1.0)
    merged["rapid_false_taps"] = merged["Rapid_False_Taps"].fillna(1.0)
    merged["focus_avg_reaction_time_ms"] = merged["Focus_Avg_Reaction_Time_ms"].fillna(540.0)
    merged["focus_accuracy"] = merged["Focus_Accuracy"].fillna(0.85)
    merged["focus_distractor_errors"] = merged["Focus_Distractor_Errors"].fillna(1.5)
    merged["focus_missed_targets"] = merged["Focus_Missed_Targets"].fillna(1.5)

    # 3. Self-Assessment (Sleep hours converted from quality score: 1 -> 4.5h, 6 -> 7.0h, 10 -> 8.8h)
    merged["sleep_hours"] = np.round(merged["Sleep_Quality_Score_1to10"] * 0.45 + 4.1, 1)
    merged["sleep_quality_score"] = merged["Sleep_Quality_Score_1to10"].fillna(6.0)
    merged["energy_level"] = merged["Energy_Level_1to10"].fillna(6.5)
    merged["mood_level"] = merged["Mood_Level_1to10"].fillna(6.5)
    merged["recovery_level"] = merged["Recovery_Level_1to10"].fillna(6.5)
    merged["wellness_survey_score"] = merged["Wellness_Survey_Score_1to10"].fillna(6.0)
    merged["peer_support_score"] = merged["Peer_Support_Score_1to10"].fillna(6.5)

    fin_map = {"Low": 1, "Moderate": 2, "High": 3}
    merged["financial_stress_level"] = merged["Financial_Stress_Level"].map(fin_map).fillna(2)
    merged["self_reported_stress_num"] = merged["Self_Reported_Stress_Level"].map(RISK_MAP).fillna(1)

    # 4. Operational Context mapping
    merged["duty_hours_per_week"] = merged["Duty_Hours_Per_Week"].fillna(50.0)
    merged["night_shifts_per_month"] = merged["Night_Shifts_Per_Month"].fillna(6.0)
    merged["workload_index"] = merged["Workload_Index_0to1"].fillna(0.5)
    merged["combat_exposure_incidents"] = merged["Combat_Exposure_Incidents"].fillna(0)
    merged["family_separation_months"] = merged["Family_Separation_Months"].fillna(6.0)

    # Target
    y = merged["Stress_Risk_Category"].map(RISK_MAP)
    X = merged[FEATURE_COLUMNS]

    return X, y


def train_model():
    """Trains the LightGBM multi-modal model with asymmetric evaluation."""
    X, y = load_and_preprocess_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    logger.info("Fitting LightGBM Classifier on %d samples...", len(X_train))
    model = lgb.LGBMClassifier(
        n_estimators=180,
        learning_rate=0.07,
        max_depth=6,
        num_leaves=31,
        random_state=42,
        class_weight="balanced",
        subsample=0.85,
        colsample_bytree=0.85,
        verbose=-1
    )
    model.fit(X_train, y_train)

    # Baseline evaluation
    probs_test = model.predict_proba(X_test)
    raw_preds = np.argmax(probs_test, axis=1)
    logger.info("\n--- Standard Argmax Evaluation ---")
    logger.info("\n%s", classification_report(y_test, raw_preds, target_names=CLASS_NAMES))
    cm_raw = confusion_matrix(y_test, raw_preds)
    logger.info("Confusion Matrix (Standard):\n%s", cm_raw)
    raw_undercount = np.sum(raw_preds < y_test)
    logger.info("Raw Undercounted Cases: %d / %d (%.2f%%)", raw_undercount, len(y_test), (raw_undercount/len(y_test))*100)

    # Asymmetric Bayes Decision Rule evaluation
    expected_losses = probs_test @ ASYMMETRIC_COST_MATRIX
    asym_preds = np.argmin(expected_losses, axis=1)
    logger.info("\n--- Asymmetric Safety-Biased Decision Evaluation ---")
    logger.info("\n%s", classification_report(y_test, asym_preds, target_names=CLASS_NAMES))
    cm_asym = confusion_matrix(y_test, asym_preds)
    logger.info("Confusion Matrix (Asymmetric):\n%s", cm_asym)
    asym_undercount = np.sum(asym_preds < y_test)
    logger.info("Asymmetric Undercounted Cases: %d / %d (%.2f%%)", asym_undercount, len(y_test), (asym_undercount/len(y_test))*100)

    # Critical and High recall
    crit_recall = np.sum((y_test == 3) & (asym_preds == 3)) / np.sum(y_test == 3)
    logger.info("Critical Stress Recall with Safety Bias: %.2f%%", crit_recall * 100)

    # Compute Feature Importances
    importances = model.feature_importances_
    feat_imp = sorted(zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)
    logger.info("\nTop 10 Feature Importances:")
    for f, imp in feat_imp[:10]:
        logger.info("  %s: %d", f, imp)

    # Domain modality groupings for explainability weights
    modality_groups = {
        "doctor_reports": [
            "medical_consultations_count", "sick_leave_days", "prior_counseling_sessions",
            "disciplinary_incidents", "absenteeism_rate_pct"
        ],
        "mini_games": [
            "rapid_avg_reaction_time_ms", "rapid_reaction_time_std_ms", "rapid_accuracy",
            "rapid_missed_targets", "rapid_false_taps", "focus_avg_reaction_time_ms",
            "focus_accuracy", "focus_distractor_errors", "focus_missed_targets"
        ],
        "self_assessment": [
            "sleep_hours", "sleep_quality_score", "energy_level", "mood_level",
            "recovery_level", "wellness_survey_score", "peer_support_score",
            "financial_stress_level", "self_reported_stress_num"
        ],
        "operational_context": [
            "duty_hours_per_week", "night_shifts_per_month", "workload_index",
            "combat_exposure_incidents", "family_separation_months"
        ]
    }

    # Calculate modality weight shares
    total_imp = sum(importances)
    modality_weights = {}
    for mod, cols in modality_groups.items():
        w = sum(importances[FEATURE_COLUMNS.index(c)] for c in cols)
        modality_weights[mod] = round(float(w / total_imp), 3)

    logger.info("Modality Relative Feature Weights: %s", modality_weights)

    # Save Bundle
    os.makedirs(os.path.dirname(BUNDLE_SAVE_PATH), exist_ok=True)
    bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "class_names": CLASS_NAMES,
        "risk_map": RISK_MAP,
        "cost_matrix": ASYMMETRIC_COST_MATRIX,
        "feature_importances": dict(feat_imp),
        "modality_weights": modality_weights,
        "metrics": {
            "test_accuracy": float(np.mean(asym_preds == y_test)),
            "critical_recall": float(crit_recall),
            "undercount_rate_pct": float((asym_undercount / len(y_test)) * 100),
            "sample_count": len(X)
        },
        "version": "2.0.0-asymmetric"
    }

    joblib.dump(bundle, BUNDLE_SAVE_PATH)
    logger.info("Model bundle successfully saved to %s", BUNDLE_SAVE_PATH)
    return bundle


if __name__ == "__main__":
    train_model()
