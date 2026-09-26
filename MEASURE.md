# SAHAYAK - Analysis Report and Measures

## 1. Executive Summary
The application is currently in a structurally disconnected state. While the React Native frontend (`sih-app`) features a complete UI and the Python backend (`ml-service`) contains extensive machine learning logic (baseline calculations, recovery analysis, deviation engines), the two systems are not communicating. The frontend relies entirely on hardcoded UI state, and the ML backend exposes mocked endpoints instead of its actual ML engines.

## 2. Detailed Root Cause Analysis

### A. Frontend-Backend Disconnect
- **Unused API Client:** The frontend contains a well-structured `analyticsClient.ts` (in `sih-app/src/services/`) with the correct fetch logic, timeout handling, and offline caching fallbacks. However, **no UI components import or invoke this client**.
- **Hardcoded UI State:** Screens such as the Welfare Dashboard (`WelfareDashboardScreen`) and Personnel Home (`PersonnelHomeScreen`) use static mock data (e.g., `const statuses = [{ label: 'Stable', count: 48 }]`) instead of rendering live data.
- **Missing Database Pipeline:** The application does not fetch raw signals (`sleep_records`, `duty_records`, `recovery_records`) from the Supabase PostgreSQL database to feed into the ML analysis bundle.

### B. ML Backend Misconfiguration
- **Two Conflicting Routing Layers:** The `ml-service` contains two completely separate FastAPI route definitions:
  1. `api/routes/*` (Currently mounted by `main.py`): Contains stubbed endpoints that return hardcoded JSON (e.g., `return create_success_response({"status": "analyzed"})`).
  2. `app/routes.py` (Currently orphaned): Contains the **actual implementation** that imports the real Python ML engines (from the `baseline/`, `deviation/`, `recovery/` folders) and defines the endpoints expected by the frontend (e.g., `/baseline/calculate`).
- **Entrypoint Error:** Because `ml-service/main.py` imports from the stubbed `api.routes` instead of the fully implemented `app/routes.py`, the actual ML logic is completely unreachable by the frontend.

### C. Route Mismatch
- `analyticsClient.ts` sends POST requests to endpoints like `/api/v1/baseline/calculate`.
- `main.py` exposes routes like `/v1/person/{person_id}/analyze`.
- Even if `app/routes.py` were mounted, it defines `/baseline/calculate` without the `/api/v1` prefix expected by the frontend.

## 3. Alignment with MASTERPrompt Concept
The core concept outlined in the `MASTERPrompt.docx` ("Understand the Change. Support the Person. Improve the System.") requires a continuous data flow: 
`Raw Data (Supabase) -> ML Engine (FastAPI) -> Analytics Response -> Dynamic UI Rendering`. 
Because the ML logic is isolated and the frontend is hardcoded, the system currently fails to evaluate personal baselines, detect persistence, or simulate what-if scenarios as originally architected.

---

## 4. Actionable Measures to Make the Application Work

To make the application functional and driven by the ML logic, the following measures must be implemented in order:

### Measure 1: Fix the ML Service Entrypoint
- **Action:** Modify `ml-service/main.py` to import and mount the routes from `ml-service/app/routes.py` instead of the mocked `api/routes/`.
- **Action:** Add the `/api/v1` prefix to the router configuration in `main.py` so that it perfectly matches the paths requested by the frontend's `analyticsClient.ts`.
- **Expected Outcome:** The FastAPI server will successfully route requests to the actual Numpy/scikit-learn logic residing in the `baseline/`, `deviation/`, and `recovery/` modules.

### Measure 2: Implement Supabase Data Fetching in the Frontend
- **Action:** Create data repository hooks in `sih-app` (using Supabase JS client) to fetch historical user data (`duty_records`, `sleep_records`, and `recovery_records`) dynamically.
- **Action:** Format this raw data into the `RawObservationBundle` payload expected by the ML service endpoints.

### Measure 3: Wire `analyticsClient.ts` to the UI
- **Action:** Refactor the hardcoded frontend components (e.g., `WelfareDashboardScreen`, `PersonnelHomeScreen`, `cases.tsx`) to use React hooks (`useEffect` or TanStack Query).
- **Action:** Call functions from `analyticsClient.ts` (e.g., `analyzeBaseline`, `analyzeDeviation`, `simulatePerson`) using the fetched Supabase data.
- **Expected Outcome:** The UI will replace static strings with dynamic predictions, confidence scores, and warnings returned directly from the ML service.

### Measure 4: Standardize the Payload Schemas
- **Action:** Cross-reference the payload interfaces defined in `analyticsClient.ts` with the Pydantic schemas in `ml-service/app/schemas.py`. 
- **Action:** Ensure field names exactly match (e.g., converting between `camelCase` and `snake_case` if necessary) so that the FastAPI validation does not reject valid requests from the frontend.

### Measure 5: Verify Offline-First Fallbacks
- **Action:** Test the application with the ML service turned off to ensure that `analyticsClient.ts` correctly falls back to `getCached()` data from Expo SQLite.
- **Action:** Ensure the UI components can gracefully render the `AnalyticsResponse` even when `stale: true` is returned, displaying the required "Offline" warnings.
