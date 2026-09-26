import xgboost as xgb
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

class InteractionModel:
    def __init__(self):
        self.model = xgb.XGBRegressor(n_estimators=100, max_depth=4, random_state=42)
        self.is_trained = False
        
    def train(self, X: pd.DataFrame, y: pd.Series):
        if len(X) < 30:
            # Fallback handled in logic using model, or we can just train a very weak one
            pass
        self.model.fit(X, y)
        self.is_trained = True
        
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_trained:
            # Statistical fallback
            return self._statistical_fallback(X)
        return self.model.predict(X)
        
    def _statistical_fallback(self, X: pd.DataFrame) -> np.ndarray:
        """
        Simple linear fallback when XGBoost is not trained (e.g. data < 30)
        """
        # A dummy heuristic assuming standardized inputs
        preds = []
        for _, row in X.iterrows():
            pred = 0
            if 'sleep_x_workload' in row:
                pred += row['sleep_x_workload'] * 0.1
            if 'night_x_sleep' in row:
                pred += row['night_x_sleep'] * 0.2
            preds.append(pred)
        return np.array(preds)
