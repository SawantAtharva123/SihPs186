"""Threshold constants for deviation/persistence (MASTER §73)."""

Z_EMERGING = 1.5
Z_PERSISTENT = 2.0
Z_SEVERE = 2.75

DAYS_EMERGING = 3
DAYS_PERSISTENT = 7
DAYS_SUSTAINED = 10

# Signal fusion
CONFLICT_MIN_DISAGREEING_SIGNALS = 2

# Recovery
RECOVERY_SCORE_FLOOR = 0.0
RECOVERY_SCORE_CEIL = 100.0

# k-anonymity threshold for unit pulse aggregates (§36)
K_ANONYMITY_MIN = 5
