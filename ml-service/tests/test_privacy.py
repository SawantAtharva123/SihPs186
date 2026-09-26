import pytest
from aggregation.unit import UnitAggregator

def test_privacy_guard_min_group_size():
    aggregator = UnitAggregator(min_k=5)
    
    # K < 5 should return privacy guard error
    small_group = [{"workload": 5}, {"workload": 6}, {"workload": 5}]
    result = aggregator.aggregate_metrics(small_group)
    assert result["success"] is False
    assert result["error"]["code"] == "PRIVACY_GUARD"
    
    # K >= 5 should succeed
    valid_group = [{"workload": 5}] * 5
    result = aggregator.aggregate_metrics(valid_group)
    assert result["success"] is True
    assert "avg_workload" in result["data"]
