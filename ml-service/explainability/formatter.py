from typing import Dict, Any, List

class ExplanationFormatter:
    def format_for_personnel(self, state_result: Dict[str, Any], contributors: List[Dict[str, str]]) -> str:
        state = state_result['state'].replace('_', ' ').title()
        conf = int(state_result['confidence'] * 100)
        
        lines = [
            f"Your current pattern is classified as: {state}",
            f"Model Confidence: {conf}%",
            "",
            "Observed Changes:"
        ]
        
        for c in contributors:
            if c['type'] == 'OBSERVED':
                lines.append(f"• {c['description']}")
                
        return "\n".join(lines)
        
    def format_for_welfare_officer(self, state_result: Dict[str, Any], contributors: List[Dict[str, str]]) -> str:
        state = state_result['state'].replace('_', ' ').title()
        conf = int(state_result['confidence'] * 100)
        
        lines = [
            f"Current State: {state}",
            f"Confidence: {conf}%",
            "",
            "Detailed Analysis:"
        ]
        
        for c in contributors:
            prefix = "[Observed]" if c['type'] == 'OBSERVED' else "[Model-Derived]"
            lines.append(f"• {prefix} {c['description']}")
            
        return "\n".join(lines)
