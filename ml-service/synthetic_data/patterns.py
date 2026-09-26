"""
synthetic_data/patterns.py
Edge-case patterns (missing, outlier, new user, conflict, leave, intervention).
"""
import random
from typing import List, Dict, Any
from datetime import timedelta

def apply_missing_data(sequence: List[Dict[str, Any]], missing_rate: float = 0.1) -> List[Dict[str, Any]]:
    """Randomly drop fields to simulate missing data."""
    for obs in sequence:
        if random.random() < missing_rate:
            obs["sleep_hours"] = None
        if random.random() < missing_rate:
            obs["workload_score"] = None
    return sequence

def apply_outlier(sequence: List[Dict[str, Any]], outlier_rate: float = 0.05) -> List[Dict[str, Any]]:
    """Inject extreme outliers."""
    for obs in sequence:
        if random.random() < outlier_rate:
            obs["sleep_hours"] = random.choice([0.5, 1.0, 16.0])
        if random.random() < outlier_rate:
            obs["workload_score"] = random.choice([0.0, 150.0]) # 150 is out of normal bounds
    return sequence

def create_new_user_pattern(base_date, person_id: str, days: int = 5) -> List[Dict[str, Any]]:
    """Generate a short sequence representing a new user (<7 days history)."""
    sequence = []
    for i in range(days):
        ts = base_date + timedelta(days=i)
        sequence.append({
            "person_id": person_id,
            "timestamp": ts,
            "sleep_hours": random.uniform(6, 8),
            "workload_score": random.uniform(40, 60),
            "duty_hours": 8,
            "is_night_shift": False
        })
    return sequence

def apply_conflicting_signals(sequence: List[Dict[str, Any]], conflict_rate: float = 0.1) -> List[Dict[str, Any]]:
    """Inject conflicting signals, e.g., low sleep but very high recovery/HRV."""
    for obs in sequence:
        if random.random() < conflict_rate:
            obs["sleep_hours"] = 3.0 # Bad
            obs["hrv_ms"] = 100.0    # Good
            obs["resting_heart_rate"] = 50.0 # Good
    return sequence

def apply_leave_pattern(sequence: List[Dict[str, Any]], start_idx: int, duration: int) -> List[Dict[str, Any]]:
    """Simulate a period of leave/vacation (high sleep, low workload)."""
    for i in range(start_idx, min(start_idx + duration, len(sequence))):
        sequence[i]["sleep_hours"] = random.uniform(8, 10)
        sequence[i]["workload_score"] = random.uniform(0, 10)
        sequence[i]["duty_hours"] = 0
        sequence[i]["is_night_shift"] = False
    return sequence

def apply_intervention(sequence: List[Dict[str, Any]], intervention_idx: int) -> List[Dict[str, Any]]:
    """Simulate an intervention improving metrics after a specific index."""
    for i in range(intervention_idx, len(sequence)):
        # Gradual improvement
        improvement = min((i - intervention_idx) * 0.1, 2.0)
        sequence[i]["sleep_hours"] = min(9.0, sequence[i].get("sleep_hours", 7.0) or 7.0 + improvement)
        sequence[i]["workload_score"] = max(20.0, sequence[i].get("workload_score", 50.0) or 50.0 - (improvement * 10))
    return sequence
