from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, f1_score, roc_auc_score
import numpy as np

class EvaluationMetrics:
    @staticmethod
    def evaluate_regression(y_true, y_pred):
        return {
            "MAE": float(mean_absolute_error(y_true, y_pred)),
            "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
            "R2": float(r2_score(y_true, y_pred))
        }

    @staticmethod
    def evaluate_classification(y_true, y_pred, y_prob=None):
        metrics = {
            "F1": float(f1_score(y_true, y_pred, average='weighted'))
        }
        if y_prob is not None:
            metrics["ROC_AUC"] = float(roc_auc_score(y_true, y_prob, average='weighted', multi_class='ovr'))
        return metrics
