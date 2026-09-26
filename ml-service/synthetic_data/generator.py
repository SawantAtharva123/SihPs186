"""
synthetic_data/generator.py
Comprehensive synthetic data generator (100+ persons, 90–180 days).
"""
import argparse
import random
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Ensure patterns can be imported
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from synthetic_data.patterns import (
        apply_missing_data, apply_outlier, create_new_user_pattern,
        apply_conflicting_signals, apply_leave_pattern, apply_intervention
    )
except ImportError:
    pass

SCENARIOS = [
    "stable", "disrupted", "persistent", "night_heavy",
    "recovering", "high_volatility", "conflicting",
    "new_user", "missing_data", "intervention"
]

def generate_person_data(person_id: str, scenario: str, start_date: datetime, days: int) -> List[Dict[str, Any]]:
    if scenario == "new_user":
        return create_new_user_pattern(start_date, person_id, days=random.randint(1, 6))
        
    sequence = []
    
    # Base generation
    for i in range(days):
        ts = start_date + timedelta(days=i)
        
        # Base stats
        sleep = random.uniform(6.5, 8.5)
        workload = random.uniform(40, 60)
        duty = random.uniform(8, 10)
        night_shift = False
        hrv = random.uniform(40, 70)
        rhr = random.uniform(60, 80)
        
        if scenario == "stable":
            pass # Keep base stats
            
        elif scenario == "disrupted":
            if 30 <= i <= 40:
                sleep -= random.uniform(2, 4)
                workload += random.uniform(20, 40)
                
        elif scenario == "persistent":
            if i > 20:
                workload += 30
                sleep -= 1
                
        elif scenario == "night_heavy":
            if i % 4 < 2: # 2 days on night shift, 2 days off
                night_shift = True
                sleep -= 2
                duty = 12
                
        elif scenario == "high_volatility":
            sleep = random.uniform(4, 10)
            workload = random.uniform(10, 90)
            duty = random.choice([0, 8, 12, 16])
            
        # Append observation
        sequence.append({
            "person_id": person_id,
            "timestamp": ts,
            "sleep_hours": round(sleep, 2),
            "workload_score": round(workload, 2),
            "duty_hours": round(duty, 2),
            "resting_heart_rate": round(rhr, 2),
            "hrv_ms": round(hrv, 2),
            "is_night_shift": night_shift
        })
        
    # Apply post-processing based on scenario
    if scenario == "missing_data":
        sequence = apply_missing_data(sequence, missing_rate=0.3)
    elif scenario == "conflicting":
        sequence = apply_conflicting_signals(sequence, conflict_rate=0.2)
    elif scenario == "intervention":
        sequence = apply_intervention(sequence, intervention_idx=int(days/2))
        
    # Randomly inject occasional leave for anyone
    if random.random() < 0.2 and len(sequence) > 10:
        leave_start = random.randint(0, len(sequence) - 10)
        sequence = apply_leave_pattern(sequence, leave_start, random.randint(3, 7))
        
    # Randomly inject rare outliers
    sequence = apply_outlier(sequence, outlier_rate=0.01)

    return sequence

def generate_dataset(num_persons: int, days: int, seed: int) -> List[Dict[str, Any]]:
    random.seed(seed)
    dataset = []
    start_date = datetime.utcnow() - timedelta(days=days)
    
    for i in range(num_persons):
        person_id = f"person_{i:04d}"
        scenario = random.choice(SCENARIOS)
        
        person_data = generate_person_data(person_id, scenario, start_date, days)
        dataset.extend(person_data)
        
    return dataset

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthetic Data Generator")
    parser.add_argument("--persons", type=int, default=100, help="Number of persons")
    parser.add_argument("--days", type=int, default=90, help="Number of days per person")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--output", type=str, default="synthetic_data.json", help="Output file")
    
    args = parser.parse_args()
    
    print(f"Generating synthetic data for {args.persons} persons over {args.days} days...")
    dataset = generate_dataset(args.persons, args.days, args.seed)
    
    # Custom serializer for datetime
    def datetime_handler(x):
        if isinstance(x, datetime):
            return x.isoformat()
        raise TypeError("Unknown type")
        
    with open(args.output, "w") as f:
        json.dump(dataset, f, default=datetime_handler, indent=2)
        
    print(f"Generated {len(dataset)} records. Saved to {args.output}")
