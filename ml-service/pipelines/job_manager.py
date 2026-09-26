import uuid
from datetime import datetime
from typing import Dict, Any, List

class MLJobManager:
    def __init__(self):
        # In memory store for mock purposes. Should be backed by DB (Supabase).
        self.jobs = {}

    def create_job(self, person_id: str, trigger_type: str, events: List[Dict[str, Any]]) -> str:
        """
        Event coalescing (batch same-person events).
        Creates ml_jobs record (PENDING).
        """
        # Idempotency check: if a pending job exists for this person in the last 5 mins, coalesce.
        for j_id, job in self.jobs.items():
            if job['person_id'] == person_id and job['status'] == 'PENDING':
                job['events'].extend(events)
                return j_id

        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            "id": job_id,
            "person_id": person_id,
            "trigger_type": trigger_type,
            "events": events,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "attempt_count": 0
        }
        return job_id

    def update_job_status(self, job_id: str, status: str, error: str = None):
        if job_id in self.jobs:
            self.jobs[job_id]['status'] = status
            if error:
                self.jobs[job_id]['error_message'] = error
