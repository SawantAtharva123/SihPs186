import os
import pandas as pd
import glob
from interactions.features import InteractionFeatureEngineer
from interactions.model import InteractionModel
from interactions.shap_explainer import SHAPExplainer
from evaluation.splitter import TimeAwareSplitter
from evaluation.metrics import EvaluationMetrics
from pipelines.training import TrainingPipeline
from models.registry import ModelRegistry
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_data(data_path: str) -> pd.DataFrame:
    """Load JSON file from the synthetic generator."""
    logger.info(f"Loading {data_path}...")
    df = pd.read_json(data_path)
    return df

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure required columns exist and do basic cleanup."""
    # Assuming the raw dataset contains canonical features or raw check-ins.
    # In a full pipeline, this would run through features/pipeline.py first.
    
    # We will map whatever raw columns might exist to our expected feature columns
    # just as an example of making it robust for training.
    
    expected_cols = ['sleep_deviation', 'workload_deviation', 'night_shift_freq', 
                     'sleep_deficit', 'recovery_gap', 'duty_duration', 'rest_interval', 'date', 'recovery_trajectory']
                     
    for col in expected_cols:
        if col not in df.columns:
            logger.warning(f"Column '{col}' is missing. Filling with default values.")
            if col == 'date':
                df[col] = pd.date_range(start='2026-01-01', periods=len(df), freq='D')
            elif col == 'recovery_trajectory':
                df[col] = 50.0  # target
            else:
                df[col] = 0.0
                
    # Sort by date for time-aware splitting
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date').reset_index(drop=True)
    return df

def main():
    data_path = "synthetic_data.json"
    
    logger.info("Loading raw datasets...")
    df = load_data(data_path)
    
    logger.info(f"Loaded {len(df)} records. Preprocessing...")
    df = preprocess_data(df)
    
    logger.info("Engineering interaction features...")
    engineer = InteractionFeatureEngineer()
    df_engineered = engineer.create_features(df)
    
    # Target and time columns
    target_col = 'recovery_trajectory'
    time_col = 'date'
    
    # Clean up non-numeric columns for XGBoost (except time which is handled by splitter)
    numeric_df = df_engineered.select_dtypes(include=['number', 'datetime'])
    if target_col not in numeric_df.columns:
        numeric_df[target_col] = df_engineered[target_col]
        
    # Setup training pipeline components
    model = InteractionModel()
    splitter = TimeAwareSplitter()
    evaluator = EvaluationMetrics()
    registry = ModelRegistry()
    
    pipeline = TrainingPipeline(
        model=model,
        splitter=splitter,
        evaluator=evaluator,
        registry=registry
    )
    
    logger.info("Starting training pipeline...")
    result = pipeline.run(
        df=numeric_df,
        target_col=target_col,
        time_col=time_col,
        model_name="xgboost-interaction",
        version="v1.0"
    )
    
    logger.info(f"Training completed successfully! Result: {result}")
    
    # We can also fit the SHAP explainer
    logger.info("Fitting SHAP explainer...")
    explainer = SHAPExplainer(model.model)
    # Fit it on a sample of the data (e.g. dropping time/target)
    X_background = numeric_df.drop(columns=[target_col, time_col]).head(100)
    explainer.fit(X_background)
    logger.info("SHAP explainer ready.")

if __name__ == "__main__":
    main()
