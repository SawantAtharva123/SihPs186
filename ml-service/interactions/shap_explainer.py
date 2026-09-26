import shap
import pandas as pd
from typing import List, Dict, Any

class SHAPExplainer:
    def __init__(self, model):
        # model should be the trained XGBoost instance
        self.model = model
        self.explainer = None
        
    def fit(self, X_background: pd.DataFrame):
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception:
            # Fallback if model is not compatible (e.g. untrained or statistical fallback)
            self.explainer = None

    def explain_instance(self, X_instance: pd.DataFrame) -> List[Dict[str, Any]]:
        if not self.explainer:
            return []
            
        shap_values = self.explainer(X_instance)
        # Convert to dictionary format
        feature_names = X_instance.columns.tolist()
        values = shap_values.values[0]
        
        explanations = []
        for fname, val in zip(feature_names, values):
            if abs(val) > 0.05: # threshold to ignore noise
                explanations.append({
                    "feature": fname,
                    "shap_value": float(val),
                    "importance": "high" if abs(val) > 0.2 else "moderate"
                })
        
        # Sort by absolute SHAP value (most important first)
        explanations.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        return explanations
