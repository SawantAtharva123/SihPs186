"""SAHAYAK Root entrypoint for cloud deployment platforms (Render, Railway, etc.)."""
import sys
import os

# Ensure ml-service root directory is on the python search path
ml_service_dir = os.path.join(os.path.dirname(__file__), "ml-service")
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

from app.main import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
