from pydantic_settings import BaseSettings
from typing import List

class BaselineConfig(BaseSettings):
    min_observations: int = 7
    established_observations: int = 22
    adaptation_rate: float = 0.05
    short_term_window: int = 7
    long_term_window: int = 30

class PersistenceConfig(BaseSettings):
    isolated_threshold: int = 1
    repeated_threshold: int = 2
    persistent_threshold: int = 3
    sustained_threshold: int = 5

class PrivacyConfig(BaseSettings):
    min_aggregate_group_size: int = 5

class RecoveryConfig(BaseSettings):
    half_life_min_observations: int = 5
    debt_windows: List[int] = [1, 3, 7]

class DeviationConfig(BaseSettings):
    mild_threshold: float = 1.0
    moderate_threshold: float = 1.5
    severe_threshold: float = 2.0

class Settings(BaseSettings):
    app_name: str = "SAHAYAK ML Service"
    environment: str = "development"
    supabase_url: str = ""
    supabase_key: str = ""
    
    baseline: BaselineConfig = BaselineConfig()
    persistence: PersistenceConfig = PersistenceConfig()
    privacy: PrivacyConfig = PrivacyConfig()
    recovery: RecoveryConfig = RecoveryConfig()
    deviation: DeviationConfig = DeviationConfig()

    class Config:
        env_file = ".env"
        env_nested_delimiter = '__'

settings = Settings()
