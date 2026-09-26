import pytest
from anomaly.deviation import analyze_deviation
from anomaly.persistence import trailing_run, max_run

def test_analyze_deviation():
    series = [
        {"date": "2023-01-01", "value": 7.5},
        {"date": "2023-01-02", "value": 7.0},
        {"date": "2023-01-03", "value": 8.0}
    ]
    result = analyze_deviation(series, metric="sleep")
    assert "state" in result
    assert "flags" in result

def test_persistence_runs():
    levels = ["normal", "mild", "strong", "normal", "severe", "mild"]
    assert max_run(levels) == 2
    assert trailing_run(levels) == 2
