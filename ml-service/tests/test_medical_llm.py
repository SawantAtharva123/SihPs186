from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_medical_report_severe_trauma():
    response = client.post(
        "/api/v1/medical/report-analyze",
        json={
            "person_id": "pers-001",
            "doctor_name": "Major Dr. Anita Sharma",
            "facility": "Unit MI Room, 44 Rashtriya Rifles",
            "consultation_date": "2026-09-27",
            "consultation_type": "Psychological & Welfare Counseling",
            "diagnosis": "Acute Stress Reaction with Severe Hyperarousal",
            "clinical_notes": "Soldier evaluated 48h post-IED ambush. Severe acoustic startle, tachycardia 116 bpm, panic attacks, intrusive flashbacks. Soldier states cannot hold weapon safely. Withdraw weapon issue immediately. Completely unfit for duty. 7 days sick-in-quarters.",
            "doctor_stress_indicator": "Normal",
            "recommended_rest_days": 0,
            "fit_for_duty": True
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["doctor_stress_indicator"] == "Severe"
    assert data["clinical_urgency"] == "Immediate"
    assert data["fit_for_duty"] is False
    assert data["recommended_rest_days"] >= 7
    assert any("tachycardia" in s.lower() for s in data["somatic_symptoms"])
    assert "weapon" in data["welfare_impact"].lower() or "immediate" in data["welfare_impact"].lower()


def test_medical_report_negation_routine_fit():
    response = client.post(
        "/api/v1/medical/report-analyze",
        json={
            "person_id": "pers-002",
            "doctor_name": "Surg. Cdr. V. S. Pillai",
            "facility": "Base Hospital Barrackpore",
            "consultation_date": "2026-09-27",
            "consultation_type": "Duty Fitness Evaluation",
            "diagnosis": "Category AYE (Fully Fit for All Operational Theatres)",
            "clinical_notes": "Annual SHAPE-1 periodic wellness examination. Patient actively denies headache, anxiety, insomnia, or depressive feelings. Cheerful affect, BP 120/78, resting HR 64. PFT Passed with Excellent rating. Fully fit for all combat duties. Zero rest days indicated.",
            "doctor_stress_indicator": "Severe", # Deliberately mislabeled to verify model overrides with true clinical findings
            "recommended_rest_days": 5,
            "fit_for_duty": False
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["doctor_stress_indicator"] == "Normal"
    assert data["clinical_urgency"] == "Routine"
    assert data["fit_for_duty"] is True
    assert data["recommended_rest_days"] == 0


def test_medical_report_high_altitude_strain():
    response = client.post(
        "/api/v1/medical/report-analyze",
        json={
            "person_id": "pers-003",
            "doctor_name": "Lt. Col. R. K. Mukherjee",
            "facility": "153 General Hospital, Leh",
            "consultation_date": "2026-09-27",
            "consultation_type": "Operational Stress & Fatigue",
            "diagnosis": "High-Altitude Hypobaric Fatigue with Stage-1 Sleep Disruption",
            "clinical_notes": "Havildar at 14,800 ft. Throbbing retro-orbital headaches, exertional dyspnea, terminal insomnia (3.5h/night). SpO2 84%, resting HR 102 bpm. Advised immediate descent to 8,500 ft staging camp and 72-hour operational stand-down. Unfit for high-altitude patrol.",
            "doctor_stress_indicator": "Normal",
            "recommended_rest_days": 0,
            "fit_for_duty": True
        }
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["doctor_stress_indicator"] == "High"
    assert data["clinical_urgency"] == "Elevated"
    assert data["fit_for_duty"] is False
    assert data["recommended_rest_days"] >= 3
    assert any("headache" in s.lower() or "hypoxia" in s.lower() for s in data["somatic_symptoms"])
