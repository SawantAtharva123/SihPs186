import pandas as pd
from typing import Tuple

class TimeAwareSplitter:
    def split(self, df: pd.DataFrame, time_col: str, train_ratio: float = 0.7, val_ratio: float = 0.15) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Time-aware train/val/test split.
        Sorts by time_col and splits chronologically to prevent data leakage.
        """
        df_sorted = df.sort_values(by=time_col).reset_index(drop=True)
        n = len(df_sorted)
        
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))
        
        train = df_sorted.iloc[:train_end]
        val = df_sorted.iloc[train_end:val_end]
        test = df_sorted.iloc[val_end:]
        
        return train, val, test
