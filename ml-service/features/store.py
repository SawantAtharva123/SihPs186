"""
features/store.py
Feature storage with as_of_timestamp to ensure point-in-time correctness.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from features.pipeline import ComputedFeatures

class FeatureStore:
    """
    In-memory mock for a feature store (would interface with Supabase).
    Handles time-aware retrieval to prevent data leakage.
    """
    def __init__(self):
        # person_id -> list of ComputedFeatures
        self._store: Dict[str, List[ComputedFeatures]] = {}
        
    def save(self, features: ComputedFeatures):
        if features.person_id not in self._store:
            self._store[features.person_id] = []
            
        self._store[features.person_id].append(features)
        # Keep sorted by timestamp
        self._store[features.person_id].sort(key=lambda x: x.as_of_timestamp)
        
    def get_features_as_of(self, person_id: str, timestamp: datetime) -> Optional[ComputedFeatures]:
        """Retrieve the most recent features prior to or exactly at the timestamp."""
        if person_id not in self._store:
            return None
            
        # Linear scan backwards (could use binary search for efficiency)
        records = self._store[person_id]
        for record in reversed(records):
            if record.as_of_timestamp <= timestamp:
                return record
                
        return None

    def get_history(self, person_id: str, start_time: datetime, end_time: datetime) -> List[ComputedFeatures]:
        """Retrieve history of features within a time window."""
        if person_id not in self._store:
            return []
            
        return [r for r in self._store[person_id] if start_time <= r.as_of_timestamp <= end_time]

# Singleton instance
feature_store = FeatureStore()
