from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "version" in response.json()

def test_baseline_calculate():
    response = client.post(
        "/api/v1/baseline/calculate",
        json={
            "metric": "sleep",
            "series": [
                {"date": "2023-01-01", "value": 7.5},
                {"date": "2023-01-02", "value": 7.0},
                {"date": "2023-01-03", "value": 8.0},
                {"date": "2023-01-04", "value": 6.5},
                {"date": "2023-01-05", "value": 7.2},
                {"date": "2023-01-06", "value": 7.5}
            ],
            "window": 14
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "baseline" in data
    assert data["metric"] == "sleep"

def test_deviation_analyze():
    response = client.post(
        "/api/v1/deviation/analyze",
        json={
            "series": [
                {"date": "2023-01-01", "value": 7.5},
                {"date": "2023-01-02", "value": 7.0},
                {"date": "2023-01-03", "value": 8.0}
            ],
            "metric": "sleep"
        }
    )
    assert response.status_code == 200
    assert "state" in response.json()["data"]
