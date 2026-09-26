import pytest
from signal_agreement.engine import SignalAgreementEngine

def test_signal_agreement_moderate():
    engine = SignalAgreementEngine()
    res = engine.evaluate_agreement({"sleep": 0.5, "workload": 0.6})
    assert res["agreement_level"] in ["MODERATE", "HIGH"]
    assert res["conflict"] is False

def test_signal_agreement_conflict():
    engine = SignalAgreementEngine()
    res = engine.evaluate_agreement({"sleep": 1.5, "workload": -1.2})
    assert res["conflict"] is True
    assert res["agreement_level"] == "LOW"
