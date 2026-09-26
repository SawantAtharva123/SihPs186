# SAHAYAK
## Privacy-Preserving AI for Personnel Welfare, Stress & Resilience

> **One-line pitch:** SAHAYAK transforms personnel welfare from reactive reporting into proactive, personalized intervention by learning each person's normal operating baseline, detecting meaningful deviations and accumulated stress, identifying team-level stress patterns, and recommending explainable workload/recovery interventions.

---

## 1. Executive Concept

Personnel in CAPFs, Armed Forces, police, disaster-response units, and other high-stress organizations operate under highly variable workloads, shifts, deployments, sleep disruption, training demands, transfers, and recovery opportunities.

The central insight behind SAHAYAK is:

> **There is no universal definition of “normal stress.”**

A physiological or behavioral value that is ordinary for one person may represent a substantial deviation for another. Similarly, a single 1–10 self-reported stress score is an imperfect and context-dependent measurement.

SAHAYAK therefore treats every observation as a **noisy signal** and estimates welfare state from longitudinal, multimodal, person-specific patterns.

The platform combines:

- Personal wellness baselines
- Workload and operational context
- Voluntary wellness check-ins
- Optional wearable/biometric features
- Short voluntary cognitive micro-tasks
- Stressor interaction effects (“stress resonance”)
- Team/network-level co-movement analysis
- Recovery dynamics
- Routine instability
- Signal disagreement / uncertainty detection
- Cumulative stress and recovery balance
- Explainable welfare recommendations
- Counterfactual schedule/intervention simulation
- Aggregate “wellness weather” visualization

The **digital-twin concept is intentionally excluded from the competition MVP** because it adds substantial modeling complexity.

---

# 2. What Makes SAHAYAK Different

A typical competition solution may look like:

`HRMS data -> ML model -> Stress score -> Alert`

SAHAYAK instead follows:

`Observe -> Personalize -> Detect deviation -> Understand context -> Identify accumulation -> Detect team patterns -> Simulate intervention -> Recommend action -> Measure recovery`

The system is not intended to diagnose mental illness or label people as “weak,” “unstable,” or “low resilience.”

It is a **welfare-support and workload-intelligence system**.

---

# 3. Design Principles

## 3.1 Personal before population

The system learns each person's normal operating range before heavily relying on population thresholds.

## 3.2 Longitudinal before instantaneous

A persistent trend is more important than one unusual measurement.

## 3.3 Multimodal before single-sensor

No single signal should be treated as ground truth.

## 3.4 Recovery matters as much as exposure

The system tracks both stress exposure and how quickly the individual returns toward baseline.

## 3.5 Uncertainty is information

If self-report, sleep, workload, and physiology disagree, the system should explicitly represent uncertainty rather than forcing a binary decision.

## 3.6 Individual welfare, organizational learning

Individual-level data should be tightly restricted. Command-level analytics should primarily emphasize aggregate workload, recovery, and unit-level trends.

## 3.7 Support, not punishment

Predictions should be used to guide welfare checks, counseling access, workload balancing, and recovery planning — not disciplinary action.

---

# 4. Core Architecture

```text
                         DATA SOURCES
                              |
          +-------------------+-------------------+
          |                   |                   |
        HRMS             Mobile App          Wearables*
          |                   |                   |
          |             Wellness data       Derived features
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                 +-------------------------+
                 | Privacy / Consent Layer |
                 | RBAC + Encryption       |
                 | Data Minimization      |
                 +-----------+-------------+
                             |
                             v
                 +-------------------------+
                 | Feature Engineering     |
                 +-----------+-------------+
                             |
              +--------------+---------------+
              |              |               |
              v              v               v
       Personal Baseline  Exposure       Team Context
          Engine          Engine          / Graph
              |              |               |
              +--------------+---------------+
                             |
                             v
                 +-------------------------+
                 | Temporal State Engine   |
                 | Deviation + Trends      |
                 | Recovery + Uncertainty  |
                 +-----------+-------------+
                             |
          +------------------+-------------------+
          |                  |                   |
          v                  v                   v
    Stress Response    Team Resonance      Signal Conflict
       Engine             Engine              Engine
          |                  |                   |
          +------------------+-------------------+
                             |
                             v
                 +-------------------------+
                 | Welfare Risk Engine     |
                 | Explainability (SHAP)   |
                 +-----------+-------------+
                             |
                   +---------+---------+
                   |                   |
                   v                   v
            Intervention Engine   Wellness Weather
                   |                   |
                   v                   v
             What-if Simulator   Welfare Dashboard
                   |
                   v
              Follow-up / Recovery
                   |
                   +-------> feedback loop
```

`* Wearables are optional. The system must remain useful without them.`

---

# 5. Personal Wellness Baseline

## 5.1 Baseline establishment

Before individualized monitoring becomes meaningful, a baseline phase should collect repeated observations during relatively normal operations.

Potential baseline signals:

### Physiological / wellness

- Resting heart rate
- HRV, where available
- Sleep duration
- Sleep consistency
- Activity level
- Optional wearable recovery indicators

### Functional

- Reaction time
- Reaction-time variability
- Simple attention task
- Optional short working-memory task

### Contextual

- Duty hours
- Night-shift frequency
- Consecutive-duty days
- Rest intervals
- Training intensity
- Deployment status
- Leave patterns

### Voluntary self-report

Use concrete, relative questions instead of a single abstract 1–10 score.

Examples:

- “Compared with your usual sleep, was last night's sleep shorter?”
- “Compared with your usual duty, was today's workload higher?”
- “Did routine tasks require more concentration than usual?”
- “Did you feel adequately recovered before today's duty?”

---

# 6. Baseline Representation

Do NOT store:

`Person X -> Baseline stress = 42`

Instead maintain a multidimensional operating profile:

```text
PERSONAL BASELINE

Sleep
  Normal range: 6.1–7.0 h

Resting HR
  Normal range: 73–81 bpm

Reaction time
  Normal range: 295–325 ms

Workload
  Typical range: 7–10 h/day

Recovery
  Typical recovery interval: 10–18 h

Response variability
  Low / Moderate / High
```

For each new observation:

`Deviation = Current State - Personal Baseline`

A normalized form can be used for modeling:

`z_i,t = (x_i,t - mu_i) / sigma_i`

where `mu_i` and `sigma_i` are person-specific baseline parameters.

---

# 7. Stress Load + Recovery Balance

Rather than a single “stress score,” maintain separate states:

- Stress exposure
- Recovery capacity
- Current deviation
- Cumulative load
- Recovery trajectory

A competition-friendly conceptual equation:

`CumulativeLoad(t) = CumulativeLoad(t-1) + StressExposure(t) - Recovery(t)`

This is inspired by cumulative-stress/allostatic-load frameworks, but should **not** be presented as a clinically validated allostatic-load measure.

A practical dashboard could display:

```text
Stress Exposure       72
Recovery Capacity     41
Current Deviation     HIGH
Cumulative Load       RISING
```

---

# 8. Recovery Half-Life

One of the signature features.

After a significant stressor, estimate how long the person's signals take to move back toward their personal baseline.

```text
Stress event
     |
     v
Peak deviation
     |
     +---- Day 1
     |
     +---- Day 2
     |
     +---- Day 3
     |
     v
Near baseline
```

Define a practical metric such as:

`Recovery Half-Life = time required for deviation to fall by 50% toward baseline`

Use it longitudinally rather than as a permanent “resilience score.”

Example:

```text
Person A -> recovery half-life ~10 h
Person B -> recovery half-life ~42 h
```

This allows recommendations to be personalized without declaring either person “resilient” or “non-resilient.”

---

# 9. Routine Entropy / Schedule Volatility

Do not only measure total workload.

Measure how unpredictable the person's operational routine has become.

Example:

```text
Person A
Day -> Sleep -> Day -> Sleep -> Day

Person B
Day -> Night -> Training -> Night -> Travel -> Day -> Emergency
```

Both may have similar average hours, but Person B experiences much higher routine instability.

Potential features:

- Shift-transition count
- Day/night switching frequency
- Variance in duty start time
- Variance in duty duration
- Rest-interval variance
- Travel/posting transition frequency
- Sequence entropy of duty states

This becomes a **Routine Volatility Index**.

Hypothesis:

> Routine instability may be welfare-relevant even when average workload is acceptable.

---

# 10. Micro-Friction: Behavioral/Cognitive Micro-Tasks

Instead of repeatedly asking:

> “How stressed are you from 1 to 10?”

offer a short, voluntary 15–30 second task.

Possible tasks:

- Simple reaction-time test
- Sustained-attention test
- Go/no-go task
- Tiny working-memory task
- Simple Stroop-style task

Track **within-person change**, not population ranking.

Example:

```text
Personal reaction baseline: 305 ms
Today's median:            337 ms
Variability:               +21%
Missed responses:           2
```

The system should NOT conclude:

> “You are stressed.”

It should record:

> “Functional signal deviated from personal baseline.”

---

# 11. Signal Disagreement Engine

A major differentiator.

Treat every source as an imperfect sensor.

Example:

```text
Self-report       NORMAL
Sleep             NORMAL
Workload          HIGH
Reaction time     NORMAL
HRV               HIGHLY DEVIATED
```

Instead of forcing a decision, generate:

> **Conflicting evidence — additional observation recommended.**

Another example:

```text
Self-report       HIGH STRESS
Workload          NORMAL
Sleep             NORMAL
Physiology        NORMAL
```

Again, do not assume the self-report is false. It is simply a different signal.

A useful internal measure:

`SignalAgreement = similarity/convergence across independent signal families`

Possible states:

- Stable
- Emerging change
- Persistent deviation
- Conflicting signals
- Sustained concern

---

# 12. Stress Resonance

This models **interactions between stressors** rather than assuming all effects add linearly.

Instead of:

`Stress = A + B + C`

allow:

`Stress = A + B + C + A*B + B*C + A*C + ...`

Examples:

- Night shift alone -> moderate effect
- Poor sleep alone -> moderate effect
- Transfer alone -> small effect
- Night shift + poor sleep + transfer -> disproportionately large deviation

The system should identify combinations associated with unusual response patterns.

Implementation options:

### MVP

- Tree-based models
- SHAP interaction values
- Explicit interaction features

### Advanced

- Generalized additive/interactions model
- Temporal feature interaction model
- Attention-based temporal model

Output:

```text
Most influential stressor combination:

Night duties
        +
Sleep disruption
        +
High workload
        -> unusually high recovery deviation
```

---

# 13. Team Stress Network

This is one of the main visual/demo differentiators.

Represent personnel as a graph:

### Nodes

Each node = one personnel member.

Node attributes can include:

- Aggregate welfare signal
- Recovery deviation
- Current workload pressure
- Recent trend

### Edges

Connect personnel who share relevant organizational context:

- Same team
- Same shift
- Same deployment
- Same training cohort
- Same immediate operational group
- Same supervisor, where appropriate

### Edge attributes

Potentially:

- Shared exposure count
- Shift overlap
- Duty overlap
- Temporal similarity of welfare trajectories

---

# 14. Stress Resonance in the Team Graph

The goal is NOT to claim:

> “Person A caused Person B's stress.”

Instead measure:

> **Synchronized changes in welfare signals among connected personnel.**

Example:

```text
           A
          / \
         /   \
        B-----C
         \   /
          \ /
           D
```

If A, B, C and D all exhibit increasing recovery debt after the same operational event, the system can surface:

> **Cluster-level stress resonance detected.**

Possible graph analytics:

- Community detection
- Node centrality
- Cluster-level average recovery debt
- Temporal correlation/co-movement
- Connected-component analysis
- Louvain/Leiden clustering
- Network-level anomaly detection

Future research can investigate temporal/lagged relationships, but the MVP should describe these as **associations**, not proven causal propagation.

---

# 15. “Stress Weather” — Organization-Level Visualization

Turn aggregate welfare analytics into an intuitive visualization.

Example:

```text
=================================================
             ORGANIZATIONAL WELLNESS WEATHER
=================================================

North Zone        STABLE
Central Ops       RISING PRESSURE
Training Wing     HIGH RECOVERY DEBT
Deployment Unit   IMPROVING

Stress Front: ██████████ -> Training Wing
Recovery:     ██████░░░░
Schedule Volatility: ████████░░
=================================================
```

Possible visualizations:

- Heat maps
- Animated temporal map of units
- Graph of connected teams
- Unit wellness “weather systems”
- Stress/recovery trend lines
- Network clusters

The command view should emphasize **aggregated trends**, not individual psychological details.

---

# 16. Stress Archetypes

Do not assign permanent labels such as “resilient” or “weak.”

Instead discover **response patterns** from longitudinal data.

Possible archetypes for analytical use:

### Fast Recoverer
Large short-term response, rapid return toward baseline.

### Slow Accumulator
Small daily deviations, but steadily increasing cumulative load.

### Acute Responder
Mostly stable until specific intense events produce large deviations.

### Sleep-Sensitive
Small sleep disruptions produce disproportionately large downstream changes.

### Schedule-Sensitive
Routine volatility is strongly associated with deviations.

These can be generated through clustering/trajectory analysis and should be treated as **descriptive model states**, not human labels.

---

# 17. Counterfactual Welfare Engine

This is the “action” component.

Instead of asking only:

> “Who is at risk?”

ask:

> **“What is the smallest operational change likely to improve welfare?”**

For a person or team, simulate candidate changes:

```text
Option A: Add recovery day
Option B: Move night shift
Option C: Redistribute shift
Option D: Delay training commitment
```

Estimate:

```text
Current projected load      71

After option A              48
After option B              55
After option C              52
After option D              61
```

The system should explain assumptions and make clear that these are **model estimates**, not guaranteed outcomes.

---

# 18. Optimization Formulation

A conceptual objective:

`Minimize total projected welfare burden`

subject to:

- Required personnel coverage
- Mission/operational constraints
- Training deadlines
- Minimum staffing levels
- Existing leave constraints
- Maximum duty limits
- Personnel availability

A competition MVP does not need a full military scheduling optimizer.

A constrained heuristic or OR-Tools prototype is enough.

Example:

```text
Current schedule
-> Recovery debt: 68

Candidate change
-> Swap two night shifts
-> Recovery debt: 51
```

---

# 19. Intervention Recommendation Engine

Recommendation logic should combine model output + rules + explainability.

Examples:

### Pattern
High workload + declining recovery + repeated night shifts

### Recommendation
- Confidential welfare check
- Review upcoming duty allocation
- Consider additional recovery interval
- Offer voluntary counseling/support

---

### Pattern
Team-level synchronized deterioration

### Recommendation
- Review unit workload
- Inspect roster/schedule volatility
- Consider recovery rotation
- Avoid targeting an individual without additional evidence

---

### Pattern
Conflicting signals

### Recommendation
- Do not escalate automatically
- Collect another observation
- Offer optional check-in

---

# 20. Mobile Wellness Application

## Daily check-in

Target time: 20–60 seconds.

Possible prompts:

- Was your sleep shorter than usual?
- Was your workload higher than usual?
- Did routine tasks require more concentration?
- Did you feel adequately recovered?
- Did anything unusually difficult happen during duty?

Optional:

- Mood
- Energy
- Physical fatigue
- Family concerns
- Workload concern
- Health concern

Avoid forcing an abstract “stress = 1–10” question as the primary signal.

---

# 21. Confidential Support Request

Add a low-friction support mechanism:

```text
NEED SUPPORT?

[ Confidential welfare check ]
[ Counseling ]
[ Medical support ]
[ Workload discussion ]
[ I don't want to specify ]
```

The last option is intentionally important:

> Personnel should not have to justify a request for help before receiving a welfare check.

---

# 22. Role-Based Dashboards

## Personnel

Show:

- Personal trends
- Recovery trend
- Optional wellness insights
- Recommendations
- Support request

Do not show:

- “Your commander thinks you are high risk”
- Comparative ranking against colleagues

## Welfare Officer

Show, where authorized:

- Individual welfare signals
- Key deviations
- Explainable factors
- Intervention history
- Follow-up status

## Commander

Prefer:

- Unit-level workload
- Recovery pressure
- Schedule volatility
- Team-level clusters
- Aggregate trends

Avoid exposing sensitive individual wellness information unless genuinely necessary and authorized.

---

# 23. Privacy Architecture

## Minimum requirements

- Consent management
- Purpose limitation
- Role-based access control
- Attribute-based access control where useful
- Encryption in transit
- Encryption at rest
- Pseudonymous personnel identifiers
- Audit logs
- Data retention policy
- Secure deletion
- Access monitoring
- Data minimization

## Strong design choice

Do not continuously collect raw private content.

Explicitly out of scope:

- Private messages
- WhatsApp content
- Private call content
- Social-media monitoring
- Camera-based emotion inference
- Continuous microphone surveillance
- Private browsing history
- Personal GPS history outside authorized operational systems

## Wearable privacy

Where possible:

`Wearable -> Mobile device -> Derived features -> Encrypted backend`

rather than continuously transmitting raw sensor streams.

---

# 24. Privacy Thresholds for Aggregate Analytics

Command-level views should use minimum-group thresholds where appropriate.

Example:

If only three people belong to a group, do not reveal a chart that effectively identifies one person's private welfare state.

Use:

- Minimum aggregation thresholds
- Suppression of small groups
- Pseudonymous IDs
- Strict role permissions

This is a feature, not a limitation.

---

# 25. ML/Data Architecture

## Model 1 — Personal Baseline Model

Purpose:

Estimate normal ranges for each individual.

Methods:

- Rolling statistics
- Robust median/MAD
- EWMA
- Quantile ranges
- Slowly adapting baseline

Important safeguard:

Do not rapidly update the long-term baseline during sustained deterioration, or chronic stress could become incorrectly normalized.

---

## Model 2 — Behavioral Anomaly Detection

Possible methods:

- Isolation Forest
- One-Class SVM
- Autoencoder

Input examples:

- Workload deviation
- Sleep deviation
- Reaction-time deviation
- Shift volatility
- HR/HRV deviation

---

## Model 3 — Welfare Risk Model

Recommended MVP:

- XGBoost
- LightGBM
- Calibrated logistic model as an interpretable baseline

Do not jump directly to a deep neural network unless data volume justifies it.

---

## Model 4 — Temporal State Estimation

Possible progression:

### MVP
Rolling windows + EWMA

### Advanced
Kalman filter / state-space model / HMM

### Research extension
Temporal transformer or TCN/LSTM

The target is a **latent welfare state**, not clinical diagnosis.

---

# 26. Feature Groups

## Personal baseline features

- Baseline HR
- Baseline HRV
- Baseline sleep
- Baseline reaction time
- Baseline duty hours

## Current deviation features

- HR z-score
- HRV z-score
- Sleep deviation
- Reaction-time deviation
- Activity deviation

## Operational exposure

- Duty hours
- Night shifts
- Consecutive duties
- Rest duration
- Deployment duration
- Training load
- Transfer frequency
- Leave patterns

## Temporal features

- 3-day trend
- 7-day trend
- 14-day trend
- 30-day trend
- Slope
- Rolling variance
- Change-point indicators

## Recovery features

- Recovery half-life
- Time since last high-load event
- Sleep recovery
- Return-to-baseline percentage

## Routine features

- Shift entropy
- Duty start-time variance
- Day/night switching
- Rest variability

## Network features

- Team-level mean load
- Number of elevated neighbors
- Cluster load
- Team trend
- Centrality
- Community ID

## Signal quality

- Self-report consistency
- Signal agreement
- Missingness
- Sensor quality
- Observation density

---

# 27. Data Model for Competition Prototype

A synthetic longitudinal dataset can contain:

```text
person_id
date
team_id
rank_band
posting_type
deployment_days
duty_hours
night_shift_count
consecutive_duty_days
rest_hours
training_hours
leave_days
transfer_count
sleep_hours
sleep_variability
resting_hr
hrv
activity_level
reaction_time
reaction_variability
attention_score
self_report_sleep_change
self_report_energy_change
self_report_workload_change
self_report_recovery
stress_exposure
cumulative_load
recovery_capacity
baseline_deviation
routine_entropy
signal_agreement
risk_state
intervention
outcome
```

---

# 28. Synthetic Scenario Generation

The prototype should deliberately generate realistic trajectories.

## Scenario A — Stable

Normal schedule, normal sleep, little deviation.

## Scenario B — Night-shift accumulation

Increasing night duties -> sleep disruption -> rising cumulative load.

## Scenario C — High workload cluster

Several team members exposed to the same workload surge.

## Scenario D — Conflicting signals

Self-report says normal, contextual/functional signals show unusual deviation.

## Scenario E — Acute responder

Large response to a specific event followed by quick recovery.

## Scenario F — Slow accumulator

Small daily deviations produce a large cumulative change over several weeks.

## Scenario G — Intervention success

Roster change -> improved recovery -> reduced cumulative load.

## Scenario H — Chronic normalization trap

Recent baseline drifts lower while long-term baseline remains healthy.

This is ideal for demonstrating why a slowly adapting baseline is needed.

---

# 29. Public Datasets for Initial Model Development

Potential sources to investigate:

- WESAD for multimodal wearable stress/affect signals
- Public wearable stress datasets
- Longitudinal wearable/self-report stress datasets
- Public HR/HRV datasets

These should be treated as **model-development/benchmark datasets**, not as substitutes for real military-specific validation.

For the competition demo, the safest route is:

`Public benchmark data -> model development`

`Synthetic personnel dataset -> operational prototype`

`Real personnel data -> future validation only`

---

# 30. Evaluation Strategy

Do not only report accuracy.

## Model metrics

- AUROC
- AUPRC
- Precision
- Recall
- F1
- Calibration
- Brier score

## Personalization metrics

Compare:

1. Population-level model
2. Population model + personal normalization
3. Personalized model
4. Personalized + multimodal temporal model

Key question:

> Does personalization reduce error and improve calibration relative to one-size-fits-all thresholds?

## Operational metrics

- Detection lead time
- False alert rate
- Intervention acceptance
- Recovery improvement after intervention
- Workforce coverage

## Network metrics

- Ability to identify high-load clusters
- Cluster detection stability
- Early detection of synchronized deterioration

---

# 31. Critical Research Caveats

These should be explicitly acknowledged in the proposal.

### HRV is not a standalone stress detector

HRV is sensitive to many factors and should be interpreted with context and other signals.

### Network co-movement is not proof of stress contagion

If connected personnel change together, the safer interpretation is:

> shared exposure / co-movement / network resonance

rather than:

> Person A caused Person B's stress.

### Resilience should not become a personnel label

Use individualized response and recovery characteristics for support, not ranking.

### Prediction is not diagnosis

The platform should not diagnose PTSD, depression, anxiety disorders, or other clinical conditions.

### Synthetic demonstration is not field validation

Competition results should not be presented as evidence of real-world military effectiveness.

---

# 32. Main Dashboard Concept

```text
============================================================
                     SAHAYAK
              PERSONNEL WELFARE INTELLIGENCE
============================================================

UNIT HEALTH

Recovery Pressure       ████████░░  78%
Schedule Volatility     ██████░░░░  61%
Cumulative Load Trend   ↑ 18%
Network Resonance       HIGH

------------------------------------------------------------

ACTIVE SIGNALS

12   Persistent recovery deviation
 7   Rising workload pressure
 4   Conflicting signal cases
 2   High-resonance team clusters

------------------------------------------------------------

STRESS WEATHER

Training Wing        🔴 Rising
Central Operations   🟠 Elevated
North Unit           🟢 Stable
Deployment Team      🟡 Recovering

------------------------------------------------------------

WHAT CHANGED?

• Night-shift concentration increased 21%
• Mean recovery interval decreased 14%
• One connected team shows synchronized deviation

------------------------------------------------------------

RECOMMENDED ACTION

Review workload/recovery allocation in Training Wing.

[ View explanation ]   [ Simulate intervention ]
============================================================
```

---

# 33. Individual Welfare View

```text
PERSONNEL WELLNESS

Current state:     Persistent deviation
Confidence:        Moderate / High

FROM YOUR BASELINE

Sleep               ↓ 18%
Workload            ↑ 27%
Reaction time       ↑ 11%
Recovery            ↓ 22%

RECOVERY

Current load        63
Recovery capacity   42
Recovery half-life  +8 h vs baseline

PRIMARY CONTRIBUTORS

1. Increased night-shift exposure
2. Reduced recovery interval
3. Sleep variability

RECOMMENDED SUPPORT

Consider confidential welfare check.
Consider schedule/recovery review.

[ Request support ]
```

---

# 34. Team Network View

Visual encoding:

- Node size = workload / exposure
- Node color = deviation from personal baseline
- Edge thickness = shared exposure
- Edge glow = recent co-movement
- Cluster boundary = community detected by graph algorithm

Example interpretation:

> **Cluster 3 shows elevated synchronized recovery deviation following a common operational event.**

This is a much more compelling demo than a static red/yellow/green table.

---

# 35. What-If Simulator Demo

```text
CURRENT STATE

Team recovery burden: 68
High-load personnel: 11

Candidate interventions

1. Add recovery day              -> 52
2. Rebalance two night shifts    -> 56
3. Delay training block          -> 59
4. No change                     -> 68

Suggested action:

Option 1 + 2 produce the largest projected improvement
under current staffing constraints.

[ Apply to simulation ]
```

After the simulated intervention:

```text
Recovery burden: 68 -> 49
High-load personnel: 11 -> 6
Network resonance: HIGH -> MODERATE
```

Then replay the following days to show whether the simulated intervention changes the trajectory.

---

# 36. Competition Demo Story — 3 to 5 Minutes

## Scene 1 — Normal state

Show a unit with stable personnel and normal recovery.

## Scene 2 — Operational pressure

Inject:

- Night shifts
- Reduced rest
- Increased workload
- Training event

## Scene 3 — Personal baselines react differently

Person A:
Small deviation.

Person B:
Moderate deviation, fast recovery.

Person C:
Large deviation, slow recovery.

This visually proves why population thresholds are inadequate.

## Scene 4 — Team network lights up

Several connected personnel deteriorate together.

The system displays:

> Cluster-level resonance detected.

## Scene 5 — Signal disagreement

One person reports normal wellness while objective/contextual signals deviate.

System displays:

> Conflicting evidence — no automatic escalation.

## Scene 6 — Stress interaction

Night shift + sleep disruption + high workload produces a disproportionate response.

Show:

> Stress resonance / interaction effect identified.

## Scene 7 — What-if intervention

Simulate changing two shifts and adding recovery.

Show projected improvement.

## Scene 8 — Follow-up

Replay the next 7–14 days.

Recovery improves.

The story closes with:

> **Detect -> Explain -> Intervene -> Recover**

---

# 37. MVP Scope

The competition MVP should prioritize:

### Must have

1. Synthetic longitudinal personnel dataset
2. Personal baseline engine
3. Deviation/trend engine
4. Cumulative stress/recovery model
5. Recovery half-life
6. Routine volatility
7. Signal disagreement
8. Stressor interactions
9. Team graph + cluster visualization
10. Explainable risk dashboard
11. Intervention recommendation
12. What-if schedule simulation
13. Role-based views
14. Privacy/consent architecture in prototype

### Strong demo extras

15. Stress weather map
16. Micro cognitive task
17. Stress archetypes
18. Intervention outcome replay

### Post-competition

19. Real-world validation
20. Federated learning
21. More sophisticated temporal state estimation
22. On-device feature extraction
23. Advanced constrained scheduling optimization

### Explicitly excluded from MVP

- Digital twin
- Clinical diagnosis
- Continuous surveillance of private communications
- Individual personnel ranking

---

# 38. Suggested Technology Stack

## Backend

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy

## ML

- pandas / NumPy
- scikit-learn
- XGBoost / LightGBM
- SHAP
- NetworkX
- statsmodels where appropriate

## Graphs / Visualization

- Plotly
- Cytoscape.js or react-force-graph
- NetworkX for analytics

## Frontend

- React / Next.js
- Tailwind CSS
- Plotly / Recharts

## Mobile

Preferred competition shortcut:

- React Native + Expo

Alternative:

- Flutter

If mobile development becomes a bottleneck, start with a secure responsive PWA and keep the application API mobile-ready.

## Optimization

- OR-Tools for constrained “what-if” scheduling

## Security

- JWT/OAuth2
- RBAC
- Encrypted secrets
- Audit logging
- Pseudonymization

---

# 39. API Concept

Example endpoints:

```text
POST /auth/login
GET  /personnel/{id}/baseline
GET  /personnel/{id}/timeline
GET  /personnel/{id}/recovery
GET  /personnel/{id}/signals
POST /wellness/checkin
POST /wellness/microtask
GET  /team/{team_id}/network
GET  /team/{team_id}/weather
GET  /alerts
GET  /recommendations/{id}
POST /simulate/intervention
GET  /simulate/{id}/trajectory
POST /support/request
GET  /audit/access-log
```

---

# 40. Research Foundation

The architecture is grounded in several relevant research directions:

1. **Personalized stress modeling.** A 2026 npj Mental Health Research study using longitudinal wearable, ecological-momentary, and blood-pressure data found participant-specific models substantially outperformed a pooled population model for stress prediction and BP-related prediction, supporting person-specific modeling. DOI: 10.1038/s44184-026-00210-9.

2. **Instance-adaptive stress recognition.** A 2026 IEEE T-BME paper explicitly addresses inter-individual variability and proposes instance-adaptive personalized stress recognition from multimodal wearable signals. DOI: 10.1109/TBME.2026.3653495.

3. **Everyday personalized stress monitoring.** Tazarv et al. (2021) explored personalized stress monitoring using HR/HRV from wearable devices in everyday settings and collected repeated self-reports over 1–3 months. DOI: 10.1109/EMBC46164.2021.9630224.

4. **Military stress-response variability.** A study of 50 male peacekeepers found differences in stress reactivity and cardiac recovery associated with resilience and resting vagal control, supporting the idea that personnel can respond and recover differently from similar stressors. DOI: 10.3109/10253890.2013.767326.

5. **Tactical / first-responder HRV evidence.** A systematic review of 60 studies covering defence, emergency response, firefighting and law-enforcement populations found HRV changes associated with acute occupational stress and evidence of recovery dynamics, while cautioning that HRV alone is not yet sufficient to establish chronic allostatic load. DOI: 10.1186/s12889-021-11595-x.

6. **Military allostatic-load framework.** A 2025 review proposed longitudinal wearable cardiometabolic and sleep/neurobehavioral measurements as a research direction for understanding allostatic load in military training. DOI: 10.3389/fphys.2025.1638451.

7. **Context-dependence of stress reporting.** A coordinated analysis of five ecological-momentary-assessment datasets showed that stress-report frequency varies according to the dimension of stress measured and timing of assessment, supporting the decision to treat self-report as one signal among multiple measurements.

8. **Longitudinal wearable + self-report data.** A 2026 six-week dataset from working adults combines continuous wearable signals with repeated self-reported stress, supporting the general feasibility of longitudinal multimodal stress modeling. DOI: 10.1038/s41597-026-07711-4.

9. **Military mHealth intervention evidence.** A 2022 randomized controlled study evaluated a mobile application plus wearable-based physiological stress monitoring in military personnel as part of a stress/mental-health intervention, providing precedent for combining sensing, mobile interfaces and intervention workflows. DOI: 10.3389/fdgth.2022.919626.

---

# 41. Useful Research Links

- Personalized modeling of stress and blood pressure reactivity using mobile health data: https://www.nature.com/articles/s44184-026-00210-9
- Variational Instance-Adaptive Personalized Stress Recognition: https://pubmed.ncbi.nlm.nih.gov/41610346/
- Personalized Stress Monitoring using Wearable Sensors: https://pubmed.ncbi.nlm.nih.gov/34892791/
- Resting vagal control and resilience in peacekeepers: https://pubmed.ncbi.nlm.nih.gov/23327672/
- HRV in first responders and tactical operators systematic review: https://pmc.ncbi.nlm.nih.gov/articles/PMC8449887/
- Allostatic load in military training: https://pubmed.ncbi.nlm.nih.gov/41078375/
- Understanding stress reports in daily life: https://pmc.ncbi.nlm.nih.gov/articles/PMC6526071/
- Six-week longitudinal wearable/self-report stress dataset: https://pubmed.ncbi.nlm.nih.gov/42393096/
- Military wearable/mHealth stress intervention study: https://pmc.ncbi.nlm.nih.gov/articles/PMC9445306/

---

# 42. Research Gap / Novelty Positioning

Do NOT claim:

> “No one has ever done personalized stress detection.”

The literature already contains personalized stress models, wearable sensing, military stress studies, HRV monitoring, and cumulative-stress frameworks.

Instead position SAHAYAK as an **integrated welfare-intelligence architecture** combining:

```text
Personal baseline
        +
Multimodal deviation
        +
Stress-exposure interactions
        +
Routine volatility
        +
Recovery half-life
        +
Signal disagreement
        +
Team/network resonance
        +
Counterfactual intervention
        +
Closed-loop recovery tracking
```

The novelty is primarily in **integration, personalization, network-aware welfare analytics, and intervention-oriented decision support**, especially for uniformed high-stress organizations.

---

# 43. Key Questions We Should Test

1. Does personal normalization improve prediction compared with population thresholds?
2. Does longitudinal trend information outperform one-time self-report?
3. Does multimodal signal fusion reduce false alerts?
4. Can recovery half-life improve early detection of sustained burden?
5. Does schedule volatility add predictive value beyond total workload?
6. Do combinations of stressors produce interaction effects beyond additive models?
7. Can graph-based team patterns detect unit-level stress events earlier than individual alerts?
8. Does explicit modeling of signal disagreement improve calibration or reduce false escalation?
9. Can counterfactual scheduling produce meaningful simulated reductions in cumulative welfare burden?
10. Can the system remain useful while minimizing sensitive data collection?

---

# 44. Final Product Philosophy

SAHAYAK should never feel like:

> **“The organization is watching whether I am mentally fit.”**

It should feel like:

> **“The organization is trying to understand when work patterns are becoming difficult, and is giving people a safer path to support before a problem becomes a crisis.”**

The core loop is:

```text
        OBSERVE
           |
           v
      PERSONALIZE
           |
           v
        DETECT
           |
           v
        EXPLAIN
           |
           v
       SIMULATE
           |
           v
       INTERVENE
           |
           v
        RECOVER
           |
           +-----------> LEARN
                            |
                            +----> repeat
```

---

# 45. Final Pitch

> **SAHAYAK is a privacy-preserving AI welfare intelligence platform for high-stress uniformed organizations. Instead of assigning everyone the same stress threshold or relying on inconsistent self-reported scores, SAHAYAK learns each person's normal operating baseline, detects meaningful deviations, models cumulative stress and recovery, identifies interacting stressors and team-level resonance, detects conflicting evidence, and recommends explainable workload and welfare interventions. The goal is not to label personnel — it is to understand when the system around them is becoming difficult and help intervene earlier.**

