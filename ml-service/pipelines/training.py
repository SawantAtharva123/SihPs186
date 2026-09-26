import joblib
import pandas as pd
from typing import Dict, Any

class TrainingPipeline:
    def __init__(self, model, splitter, evaluator, registry):
        self.model = model
        self.splitter = splitter
        self.evaluator = evaluator
        self.registry = registry

    def run(self, df: pd.DataFrame, target_col: str, time_col: str, model_name: str, version: str) -> Dict[str, Any]:
        train, val, test = self.splitter.split(df, time_col)
        
        X_train, y_train = train.drop(columns=[target_col, time_col]), train[target_col]
        X_val, y_val = val.drop(columns=[target_col, time_col]), val[target_col]
        X_test, y_test = test.drop(columns=[target_col, time_col]), test[target_col]
        
        # In a real pipeline, we'd handle categorical encoding, imputation, etc. here.
        self.model.train(X_train, y_train)
        
        # Evaluate
        preds = self.model.predict(X_test)
        metrics = self.evaluator.evaluate_regression(y_test, preds)
        
        # Save artifact
        artifact_path = f"artifacts/{model_name}_{version}.pkl"
        # joblib.dump(self.model, artifact_path) # Mock saving
        
        # Register
        model_id = self.registry.register_model(model_name, version, artifact_path, metrics)
        
        return {
            "model_id": model_id,
            "metrics": metrics,
            "status": "COMPLETED"
        }
