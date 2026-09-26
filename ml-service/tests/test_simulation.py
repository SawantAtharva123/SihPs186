import pytest
from simulation.person import PersonSimulator
from simulation.unit import UnitSimulator

class MockModel:
    def predict(self, *args, **kwargs):
        pass

def test_person_simulator_valid():
    sim = PersonSimulator(MockModel())
    res = sim.simulate_scenario({"recovery": 50, "sleep_duration": 6, "workload": 4}, {"sleep_duration": 8, "workload": 4})
    assert res["difference"] > 0 # more sleep -> better recovery
    assert "simulation_disclaimer" in res

def test_person_simulator_invalid():
    sim = PersonSimulator(MockModel())
    with pytest.raises(ValueError, match="negative"):
        sim.simulate_scenario({}, {"sleep_duration": -2})
