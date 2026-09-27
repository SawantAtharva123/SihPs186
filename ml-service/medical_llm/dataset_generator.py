"""Dataset generator for fine-tuning local small LLM (Qwen2.5-0.5B/0.6B) on military medical reports.

Produces structured training datasets in ChatML / Alpaca format tailored for
defense and tactical healthcare environments (Indian Armed Forces & CAPF).
"""

import json
import os
import random
from pathlib import Path

# Clinical report templates covering diverse military medical scenarios
SCENARIOS = [
    # 1. High Altitude / Cold Stress & Combat Fatigue (High / Severe)
    {
        "facility": "153 General Hospital, Leh (Ladakh Sector)",
        "doctor_name": "Lt. Col. R. K. Mukherjee, AMC",
        "consultation_type": "High-Altitude Medical Review",
        "diagnosis": "High-Altitude Hypobaric Fatigue with Stage-1 Sleep Disruption",
        "clinical_notes": (
            "34-year-old Havildar deployed at 14,800 ft for 7 consecutive months. "
            "Presents with persistent retro-orbital throbbing headaches, exertional dyspnea, and terminal insomnia (3.5 hours sleep/night). "
            "SpO2 fluctuating at 84% on room air. Elevated resting heart rate of 102 bpm. Neurological exam negative for HAPE/HACE. "
            "Mental state exam shows psychomotor retardation, heightened irritability, and operational exhaustion. "
            "Soldier expresses acute difficulty concentrating during perimeter watch. "
            "Advised immediate descent to lower staging camp (8,500 ft), continuous oxygenation therapy, and 72-hour operational stand-down. "
            "Unfit for high-altitude weapon patrol until hemodynamics stabilize."
        ),
        "target": {
            "doctor_stress_indicator": "High",
            "clinical_urgency": "Elevated",
            "fit_for_duty": False,
            "recommended_rest_days": 3,
            "somatic_symptoms": ["retro-orbital headache", "tachycardia", "insomnia", "hypoxia", "exertional dyspnea"],
            "key_clinical_findings": [
                "Hypobaric hypoxia with SpO2 at 84%",
                "Severe sleep deprivation (3.5h/night)",
                "Resting tachycardia (102 bpm)",
                "Attentional impairment during perimeter duties"
            ],
            "welfare_recommendation": "Descent to staging camp, 3 days excused duty, and oxygen support before re-evaluation."
        }
    },
    # 2. Severe PTSD / Acute Combat Stress Reaction (Severe)
    {
        "facility": "Unit MI Room, 44 Rashtriya Rifles",
        "doctor_name": "Major Dr. Anita Sharma, Classified Specialist (Psychiatry)",
        "consultation_type": "Post-Incident Psychiatric Evaluation",
        "diagnosis": "Acute Stress Reaction with Severe Hyperarousal & Flashbacks",
        "clinical_notes": (
            "Naik, 28 years, evaluated 48 hours post-IED ambush encounter. "
            "Presents with profound agitation, acoustic hyper-reactivity (startle reaction to loud engine noises), and severe autonomic panic attacks. "
            "Reports distressing intrusive combat imagery and severe nightmares. Resting BP 155/98 mmHg, pulse 116 bpm, diaphoresis noted on palms. "
            "Soldier states: 'I feel permanently on edge and cannot hold a weapon safely.' "
            "Depressive affect with feelings of detachment from peers. Denies overt suicidal ideation, but displays intense cognitive overwhelm. "
            "IMMEDIATE ACTION REQUIRED: Soldier is completely UNFIT FOR DUTY. "
            "Withdraw weapon issue immediately. Prescribe low-dose anxiolytic and transfer to Command Hospital Psychiatry Ward for intensive trauma decompression. "
            "7 days complete medical leave mandatory."
        ),
        "target": {
            "doctor_stress_indicator": "Severe",
            "clinical_urgency": "Immediate",
            "fit_for_duty": False,
            "recommended_rest_days": 7,
            "somatic_symptoms": ["hyperarousal", "autonomic panic", "tachycardia", "hypertension", "diaphoresis", "nightmares"],
            "key_clinical_findings": [
                "Post-IED acute stress reaction",
                "Severe acoustic startle and panic attacks",
                "Weapon safety compromise",
                "Autonomic hyper-reactivity (BP 155/98, pulse 116)"
            ],
            "welfare_recommendation": "Immediate disarming, casualty evacuation to Command Hospital Psychiatry Ward, 7 days strict sick-in-quarters."
        }
    },
    # 3. Negation Case / Routine Fitness Check (Normal)
    {
        "facility": "Base Hospital Barrackpore, Medical Evaluation Wing",
        "doctor_name": "Surg. Cdr. V. S. Pillai, VSM",
        "consultation_type": "Annual Medical Examination & Deployment Clearance",
        "diagnosis": "Category AYE (Fully Fit for All Operational Theatres)",
        "clinical_notes": (
            "Annual SHAPE-1 periodic wellness examination of Subedar, aged 41. "
            "Patient actively denies any persistent headache, chest pain, breathlessness, or joint pain. "
            "Explicitly denies mood fluctuations, anxiety, insomnia, or depressive feelings. Reports solid 7.5 hours nightly sleep. "
            "Mental status examination confirms alert sensorium, sharp cognitive orientation, intact memory, and cheerful affect. "
            "Vitals: BP 120/78 mmHg, resting heart rate 64 bpm, BMI 22.4 kg/m2. ECG and chest radiograph completely normal. "
            "Physical fitness test (PFT) passed with Excellent rating. Fit for all operational and combat deployments without restriction. "
            "Zero rest days indicated."
        ),
        "target": {
            "doctor_stress_indicator": "Normal",
            "clinical_urgency": "Routine",
            "fit_for_duty": True,
            "recommended_rest_days": 0,
            "somatic_symptoms": [],
            "key_clinical_findings": [
                "SHAPE-1 medical fitness confirmed",
                "No somatic complaints or sleep disturbances",
                "Stable hemodynamics (BP 120/78, HR 64)",
                "Full mental readiness and cognitive clarity"
            ],
            "welfare_recommendation": "Maintain standard training and physical activity routines. Routine re-check in 12 months."
        }
    },
    # 4. Moderate Burnout & Circadian Fatigue (Moderate)
    {
        "facility": "Sector Hospital, Border Security Force (BSF) Jaisalmer",
        "doctor_name": "Dr. Pradeep Rathore, Chief Medical Officer (SG)",
        "consultation_type": "Shift Work & Circadian Adaptation Review",
        "diagnosis": "Shift Work Sleep Disorder with Mild Somatosensory Fatigue",
        "clinical_notes": (
            "Head Constable on rotational border night-vigil duty along the western international boundary. "
            "Reports difficulty initiating daytime sleep following rotating night duties (1800h to 0600h shifts). "
            "Complains of eye strain, mild lumbar stiffness after standing patrol, and daytime lethargy. "
            "Denies clinical depression, suicidal ideation, or panic attacks. Speech is coherent, memory intact. "
            "Blood pressure normal at 124/82 mmHg. Vitals stable. Reaction time test indicates slight psychomotor slowing. "
            "Assessment: Moderate cumulative fatigue secondary to rapid shift oscillation. "
            "Recommend 24-hour sleep re-alignment rest rotation, hydration protocol, and adjustment to forward shift rotation schedule. "
            "Fit for standard camp administrative duties; temporarily avoid consecutive triple night vigils."
        ),
        "target": {
            "doctor_stress_indicator": "Moderate",
            "clinical_urgency": "Routine",
            "fit_for_duty": True,
            "recommended_rest_days": 1,
            "somatic_symptoms": ["eye strain", "lumbar stiffness", "daytime lethargy", "circadian insomnia"],
            "key_clinical_findings": [
                "Circadian disruption from rotating night patrols",
                "Mild psychomotor reaction delay",
                "No acute psychiatric decompensation",
                "Physical vitals within normal parameters"
            ],
            "welfare_recommendation": "1 day circadian restorative rest, shift rotation re-alignment, and avoiding back-to-back night duties."
        }
    },
    # 5. High Operational Stress with Somatization (High)
    {
        "facility": "Central Armed Police Composite Hospital, Srinagar",
        "doctor_name": "Dr. Farooq Ahmad, Senior Medical Officer (General Medicine)",
        "consultation_type": "Gastrointestinal & Stress Clinic",
        "diagnosis": "Stress-Induced Gastritis & Tension Cephalea with High Workload Strain",
        "clinical_notes": (
            "31-year-old Constable on active convoy escort duty. Presents with recurrent epigastric burning, acid reflux, and tension headaches for 3 weeks. "
            "Endoscopy non-ulcerative. Patient notes symptoms flare significantly prior to high-risk road opening duties. "
            "Exhibits noticeable muscle tension in trapezius and clenched jaw. Reports chronic poor sleep (4 hours/night, frequent waking). "
            "Mental state: Soldier describes feeling 'constantly under pressure with no breathing space.' "
            "Appetite is diminished; lost 2 kg over the past month. "
            "Diagnosis: Significant psychosomatic stress reaction manifesting as functional dyspepsia. "
            "Advise 4 days excused heavy duty for gut rest and psychological decompression. Prescribed PPI, magnesium supplement, and referral to unit counselor. "
            "Temporary light camp duties only."
        ),
        "target": {
            "doctor_stress_indicator": "High",
            "clinical_urgency": "Elevated",
            "fit_for_duty": False,
            "recommended_rest_days": 4,
            "somatic_symptoms": ["epigastric burning", "acid reflux", "tension headache", "trapezius spasm", "insomnia", "weight loss"],
            "key_clinical_findings": [
                "Psychosomatic stress-induced dyspepsia and tension headache",
                "Convoy duty anticipatory stress",
                "Appetite suppression and sleep disruption",
                "Musculoskeletal hypertonia"
            ],
            "welfare_recommendation": "4 days excused heavy duty, medical gastro-care, and unit counseling sessions."
        }
    },
    # 6. Physical Minor Injury with Zero Stress (Normal)
    {
        "facility": "Naval Sick Bay, INS Shivaji, Lonavala",
        "doctor_name": "Surgeon Lt. K. Ananya, Indian Navy",
        "consultation_type": "Orthopedic & Physical Trauma",
        "diagnosis": "Grade-1 Lateral Ankle Sprain (Right) - Sports Injury",
        "clinical_notes": (
            "Leading Seaman presented with inversion injury to right ankle sustained during inter-unit volleyball match. "
            "Localized swelling and mild tenderness over anterior talofibular ligament. No bone fracture on X-ray. "
            "Mental status examination: Exceptionally high morale, cheerful, relaxed. Zero psychiatric or emotional distress. "
            "Sleep and appetite excellent. No operational exhaustion or anxiety. "
            "Treatment: RICE protocol, crepe bandage, oral NSAID. "
            "Excused PT and physical drill for 5 days. Fit for non-strenuous desk duties and technical workshops."
        ),
        "target": {
            "doctor_stress_indicator": "Normal",
            "clinical_urgency": "Routine",
            "fit_for_duty": True,
            "recommended_rest_days": 2,
            "somatic_symptoms": ["ankle swelling", "localized tenderness"],
            "key_clinical_findings": [
                "Isolated grade-1 physical athletic sprain",
                "High morale and zero psychological strain",
                "Fit for technical sedentary duty"
            ],
            "welfare_recommendation": "2 days physical rest from drill/PT, crepe support, maintain normal morale."
        }
    }
]

SYSTEM_PROMPT = (
    "You are an expert military clinical psychiatrist and senior medical officer in the Indian Armed Forces (SAHAYAK System). "
    "Your objective is to read clinical doctor consultation reports, medical notes, and diagnoses for armed forces personnel, "
    "and extract precise, structured clinical insights to safeguard personnel welfare. "
    "You must carefully differentiate between true psychological strain, combat hyperarousal, and pure physical injuries, "
    "and accurately respect negations (e.g., 'denies depression' is Normal, not Severe). "
    "Output must be strictly valid JSON matching this schema:\n"
    "{\n"
    '  "doctor_stress_indicator": "Normal" | "Moderate" | "High" | "Severe",\n'
    '  "clinical_urgency": "Routine" | "Elevated" | "Immediate",\n'
    '  "fit_for_duty": true | false,\n'
    '  "recommended_rest_days": <integer>,\n'
    '  "somatic_symptoms": [<list of strings>],\n'
    '  "key_clinical_findings": [<list of strings>],\n'
    '  "welfare_recommendation": "<concise actionable advice>"\n'
    "}"
)


def format_user_prompt(facility: str, doctor: str, ctype: str, diagnosis: str, notes: str) -> str:
    return (
        f"Facility: {facility}\n"
        f"Attending Medical Officer: {doctor}\n"
        f"Consultation Type: {ctype}\n"
        f"Diagnosis: {diagnosis}\n"
        f"Clinical Notes & Observations:\n{notes}\n\n"
        "Analyze this doctor report and return the structured JSON extraction."
    )


def generate_variations(base_sample: dict, count: int = 5) -> list[dict]:
    """Expands base scenarios with realistic clinical variations for data augmentation."""
    variations = []
    modifiers = [
        ("Soldier expresses mild hesitation regarding upcoming posting.", "Family welfare concern noted."),
        ("Physical vitals reassessed after 30 minutes rest; stable.", "Routine hydration advised."),
        ("Attending Subedar Major reports soldier has been punctual and reliable.", "Peer support is active in platoon."),
        ("Soldier requested clarification on leave certificate.", "Administrative documentation processed."),
        ("Follow-up appointment scheduled at 14-day interval.", "Medical dossier updated in e-Health registry.")
    ]
    
    for i in range(count):
        mod1, mod2 = random.choice(modifiers)
        augmented_notes = f"{base_sample['clinical_notes']} Note: {mod1} {mod2}"
        
        # Clone target
        target = dict(base_sample["target"])
        variations.append({
            "facility": base_sample["facility"],
            "doctor_name": base_sample["doctor_name"],
            "consultation_type": base_sample["consultation_type"],
            "diagnosis": base_sample["diagnosis"],
            "clinical_notes": augmented_notes,
            "target": target
        })
    return variations


def create_training_dataset(output_dir: str = "data") -> tuple[str, str]:
    """Generates train and eval datasets in standard ChatML / OpenAI JSONL format."""
    os.makedirs(output_dir, exist_ok=True)
    all_samples = []
    
    # Base samples
    for sc in SCENARIOS:
        all_samples.append(sc)
        # Augment with realistic clinical variations
        all_samples.extend(generate_variations(sc, count=4))
        
    random.seed(42)
    random.shuffle(all_samples)
    
    split_idx = int(len(all_samples) * 0.85)
    train_samples = all_samples[:split_idx]
    eval_samples = all_samples[split_idx:]
    
    train_path = os.path.join(output_dir, "clinical_train.jsonl")
    eval_path = os.path.join(output_dir, "clinical_eval.jsonl")
    
    for path, data_subset in [(train_path, train_samples), (eval_path, eval_samples)]:
        with open(path, "w", encoding="utf-8") as f:
            for item in data_subset:
                user_msg = format_user_prompt(
                    item["facility"],
                    item["doctor_name"],
                    item["consultation_type"],
                    item["diagnosis"],
                    item["clinical_notes"]
                )
                assistant_msg = json.dumps(item["target"], indent=2)
                record = {
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_msg},
                        {"role": "assistant", "content": assistant_msg}
                    ]
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                
    print(f"Generated {len(train_samples)} training samples at {train_path}")
    print(f"Generated {len(eval_samples)} eval samples at {eval_path}")
    return train_path, eval_path


if __name__ == "__main__":
    create_training_dataset(output_dir=os.path.join(os.path.dirname(__file__), "data"))
