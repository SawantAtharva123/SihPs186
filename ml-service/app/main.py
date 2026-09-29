"""SAHAYAK ML service — FastAPI application factory."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from models.registry import MODEL_NAME, MODEL_VERSION


from datetime import datetime, timezone

def create_app() -> FastAPI:
    app = FastAPI(
        title="SAHAYAK ML Service",
        version=MODEL_VERSION,
        description=(
            "Welfare intelligence analytics: personal baselines, deviation, "
            "recovery, volatility, signal agreement, stressor interaction, "
            "simulation and recommendations. Non-diagnostic by design."
        ),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    @app.get("/health")
    @app.get("/ping")
    def health() -> dict:
        return {
            "status": "ok",
            "service": "sahayak-ml-service",
            "model": MODEL_NAME,
            "version": MODEL_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
