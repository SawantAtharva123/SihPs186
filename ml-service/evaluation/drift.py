import numpy as np
from scipy.stats import ks_2samp

class DriftMonitor:
    @staticmethod
    def calculate_psi(expected, actual, buckets=10):
        """
        Calculates Population Stability Index (PSI).
        """
        def scale_range (input, min, max):
            input += -(np.min(input))
            input /= np.max(input) / (max - min)
            input += min
            return input

        breakpoints = np.arange(0, buckets + 1) / (buckets) * 100
        breakpoints = scale_range(breakpoints, np.min(expected), np.max(expected))
        
        expected_percents = np.histogram(expected, breakpoints)[0] / len(expected)
        actual_percents = np.histogram(actual, breakpoints)[0] / len(actual)

        def sub_psi(e_perc, a_perc):
            if a_perc == 0:
                a_perc = 0.0001
            if e_perc == 0:
                e_perc = 0.0001
            value = (e_perc - a_perc) * np.log(e_perc / a_perc)
            return value
            
        psi_value = np.sum(sub_psi(expected_percents[i], actual_percents[i]) for i in range(0, len(expected_percents)))
        return psi_value

    @staticmethod
    def calculate_ks_test(expected, actual):
        """
        Kolmogorov-Smirnov test for distribution drift.
        """
        statistic, p_value = ks_2samp(expected, actual)
        return {
            "ks_statistic": statistic,
            "p_value": p_value,
            "drift_detected": p_value < 0.05
        }
