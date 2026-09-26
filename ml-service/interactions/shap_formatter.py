from typing import List, Dict, Any

class SHAPFormatter:
    def __init__(self):
        # Mapping technical features to human-readable text
        self.feature_map = {
            "night_x_sleep": "Night-shift exposure combined with sleep deficit",
            "sleep_x_workload": "High workload combined with sleep deficit",
            "workload_x_recovery": "High workload during poor recovery periods",
            "duty_x_rest": "Extended duty duration with reduced rest",
            "night_shift_freq": "Night-shift exposure",
            "sleep_deviation": "Sleep deviation",
            "workload_deviation": "Higher workload"
        }

    def format_explanations(self, shap_explanations: List[Dict[str, Any]]) -> List[str]:
        formatted = []
        for exp in shap_explanations:
            feat = exp['feature']
            val = exp['shap_value']
            imp = exp['importance']
            
            human_name = self.feature_map.get(feat, feat)
            
            direction = "lower" if val < 0 else "higher"
            formatted.append(f"{human_name} is associated with a {direction} modeled recovery trajectory (Contribution: {imp}).")
            
        return formatted
