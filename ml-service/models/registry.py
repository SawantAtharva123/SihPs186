from datetime import datetime
from typing import Dict, Any

class ModelRegistry:
    def __init__(self):
        # Mock storage
        self.models = {}

    def register_model(self, model_name: str, version: str, artifact_path: str, metrics: Dict[str, float]) -> str:
        model_id = f"{model_name}-{version}"
        self.models[model_id] = {
            "id": model_id,
            "model_name": model_name,
            "version": version,
            "status": "DEVELOPMENT",
            "metrics": metrics,
            "artifact_path": artifact_path,
            "created_at": datetime.utcnow().isoformat()
        }
        return model_id

    def update_status(self, model_id: str, new_status: str):
        if model_id in self.models:
            valid_statuses = ["DEVELOPMENT", "VALIDATED", "ACTIVE", "RETIRED"]
            if new_status in valid_statuses:
                self.models[model_id]["status"] = new_status
                if new_status == "ACTIVE":
                    self.models[model_id]["activated_at"] = datetime.utcnow().isoformat()
                elif new_status == "RETIRED":
                    self.models[model_id]["retired_at"] = datetime.utcnow().isoformat()

    def get_active_model(self, model_name: str) -> Dict[str, Any]:
        for m in self.models.values():
            if m["model_name"] == model_name and m["status"] == "ACTIVE":
                return m
        return None
ENGINE_VERSIONS = {'baseline': 'v1', 'deviation': 'v1', 'recovery': 'v1'}
MODEL_NAME = 'SAHAYAK_CORE'
MODEL_VERSION = '1.0.0'
NON_DIAGNOSTIC_NOTE = 'This is a model simulation, not a guaranteed prediction.'

SIMULATION_DISCLAIMER = 'This is a model simulation, not a guaranteed outcome.'
