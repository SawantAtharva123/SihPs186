import pandas as pd

class InteractionFeatureEngineer:
    def __init__(self):
        pass

    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineers interaction features from raw/canonical features.
        Expected columns: sleep_deviation, workload_deviation, night_shift_freq, sleep_deficit, recovery_gap, duty_duration, rest_interval
        """
        df_out = df.copy()
        
        if 'sleep_deviation' in df.columns and 'workload_deviation' in df.columns:
            df_out['sleep_x_workload'] = df['sleep_deviation'] * df['workload_deviation']
            
        if 'night_shift_freq' in df.columns and 'sleep_deficit' in df.columns:
            df_out['night_x_sleep'] = df['night_shift_freq'] * df['sleep_deficit']
            
        if 'workload_excess' in df.columns and 'recovery_gap' in df.columns:
            df_out['workload_x_recovery'] = df['workload_excess'] * df['recovery_gap']
            
        if 'duty_duration' in df.columns and 'rest_interval' in df.columns:
            # -rest_interval because lower rest is higher stress exposure
            df_out['duty_x_rest'] = df['duty_duration'] * -df['rest_interval']
            
        return df_out
