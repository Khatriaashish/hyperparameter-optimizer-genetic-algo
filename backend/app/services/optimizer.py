import os
import uuid
from datetime import datetime, timezone
from math import isinf
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    explained_variance_score,
    mean_absolute_error,
    mean_squared_error,
    precision_recall_fscore_support,
    r2_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.utils.multiclass import type_of_target

from .dataset_handler import DATA_PATH
from .genetic_algorithm import run_ga


MODEL_STORAGE_DIR = Path("app/storage/models")


def _round_numeric(value: Any, precision: int = 4) -> Any:
    if isinstance(value, (int, np.integer)):
        return int(value)
    if isinstance(value, (float, np.floating)):
        return round(float(value), precision)
    return value


def _sanitize_params(params: Dict[str, Any]) -> Dict[str, Any]:
    sanitized = {}
    for key, value in params.items():
        sanitized[key] = _round_numeric(value)
    return sanitized


def _classification_metrics(model, X_val, y_val) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    y_pred = model.predict(X_val)
    metrics: Dict[str, Any] = {
        "accuracy": _round_numeric(accuracy_score(y_val, y_pred)),
    }

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_val, y_pred, average="weighted", zero_division=0
    )
    metrics.update(
        {
            "precision_weighted": _round_numeric(precision),
            "recall_weighted": _round_numeric(recall),
            "f1_weighted": _round_numeric(f1),
        }
    )

    raw_report = classification_report(
        y_val, y_pred, output_dict=True, zero_division=0
    )
    report = {}
    for label, stats in raw_report.items():
        if isinstance(stats, dict):
            report[label] = {
                metric: _round_numeric(score) for metric, score in stats.items()
            }
        else:
            report[label] = _round_numeric(stats)
    conf_matrix = confusion_matrix(y_val, y_pred).tolist()

    unique, counts = np.unique(y_val, return_counts=True)
    class_distribution = {
        str(label): int(count) for label, count in zip(unique, counts)
    }

    roc_info = None
    probability_matrix = None
    if hasattr(model, "predict_proba"):
        probability_matrix = model.predict_proba(X_val)
        if probability_matrix.ndim == 2 and probability_matrix.shape[1] == 2:
            fpr, tpr, thresholds = roc_curve(y_val, probability_matrix[:, 1])
            roc_info = {
                "fpr": fpr.tolist(),
                "tpr": tpr.tolist(),
                "thresholds": thresholds.tolist(),
                "auc": _round_numeric(roc_auc_score(y_val, probability_matrix[:, 1])),
            }
    elif hasattr(model, "decision_function"):
        decision_scores = model.decision_function(X_val)
        if len(np.unique(y_val)) == 2:
            fpr, tpr, thresholds = roc_curve(y_val, decision_scores)
            roc_info = {
                "fpr": fpr.tolist(),
                "tpr": tpr.tolist(),
                "thresholds": thresholds.tolist(),
                "auc": _round_numeric(roc_auc_score(y_val, decision_scores)),
            }
        probability_matrix = decision_scores

    baseline_accuracy = counts.max() / counts.sum()
    metrics["baseline_accuracy"] = _round_numeric(baseline_accuracy)

    return (
        {
            "summary": metrics,
            "classification_report": report,
            "confusion_matrix": conf_matrix,
            "class_distribution": class_distribution,
            "roc_curve": roc_info,
        },
        {
            "y_true": y_val.tolist(),
            "y_pred": y_pred.tolist(),
            "probabilities": probability_matrix.tolist()
            if probability_matrix is not None
            else None,
        },
    )


def _regression_metrics(model, X_val, y_val) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    y_pred = model.predict(X_val)

    mse_value = mean_squared_error(y_val, y_pred)
    mae_value = mean_absolute_error(y_val, y_pred)
    r2_value = r2_score(y_val, y_pred)

    baseline = np.full_like(y_val, fill_value=np.mean(y_val))
    baseline_mse = mean_squared_error(y_val, baseline)

    residuals = y_val - y_pred
    metrics = {
        "mse": _round_numeric(mse_value),
        "rmse": _round_numeric(np.sqrt(mse_value)),
        "mae": _round_numeric(mae_value),
        "r2": _round_numeric(r2_value),
        "explained_variance": _round_numeric(explained_variance_score(y_val, y_pred)),
        "baseline_mse": _round_numeric(baseline_mse),
    }

    return (
        {
            "summary": metrics,
            "residuals": {
                "values": residuals.tolist(),
                "mean": _round_numeric(np.mean(residuals)),
                "std": _round_numeric(np.std(residuals)),
            },
        },
        {
            "y_true": y_val.tolist(),
            "y_pred": y_pred.tolist(),
        },
    )


def _extract_feature_insights(model, feature_names):
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        ranked = sorted(
            [
                {"feature": feature_names[idx], "importance": _round_numeric(score)}
                for idx, score in enumerate(importances)
            ],
            key=lambda item: item["importance"],
            reverse=True,
        )
        return {
            "type": "feature_importance",
            "values": ranked,
            "top_features": ranked[:5],
        }
    if hasattr(model, "coef_"):
        coefficients = np.ravel(model.coef_)
        values = [
            {"feature": feature_names[idx], "coefficient": _round_numeric(score)}
            for idx, score in enumerate(coefficients)
        ]
        values.sort(key=lambda item: abs(item["coefficient"]), reverse=True)
        return {
            "type": "coefficients",
            "values": values,
            "top_features": values[:5],
        }
    return None


async def run_optimization(req):
    if not os.path.exists(DATA_PATH):
        return {"error": "Dataset not uploaded yet."}

    df = pd.read_csv(DATA_PATH)

    if req.target_column not in df.columns:
        return {"error": f"Target column '{req.target_column}' not found in dataset."}

    X = df.drop(columns=[req.target_column])
    y = df[req.target_column]

    X = pd.get_dummies(X)
    is_categorical_target = y.dtype == "object"
    if is_categorical_target:
        y = pd.factorize(y)[0]

    target_type = type_of_target(y)
    is_classification = target_type in ["binary", "multiclass"]
    stratify_labels = y if is_classification else None

    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=stratify_labels if is_classification else None,
    )

    run_ga_result = run_ga(
        X_train,
        y_train,
        X_val,
        y_val,
        generations=req.generations,
        population_size=req.population_size,
        model_type=req.model_type,
        return_model=True,
    )

    if run_ga_result is None:
        return {"error": "Optimization failed to produce a valid model."}

    best_params, best_score, generation_scores, best_model, generation_details = run_ga_result

    if best_model is None:
        return {"error": "No valid model produced during optimization."}

    def sanitize_score(score):
        return 0.0 if isinf(score) else score

    best_score = sanitize_score(best_score)
    generation_scores = [sanitize_score(score) for score in generation_scores]

    if generation_details:
        for record in generation_details:
            record["best_score"] = _round_numeric(record.get("best_score")) if record.get("best_score") is not None else None
            record["average_score"] = _round_numeric(record.get("average_score")) if record.get("average_score") is not None else None
            record["median_score"] = _round_numeric(record.get("median_score")) if record.get("median_score") is not None else None
            record["std_dev"] = _round_numeric(record.get("std_dev")) if record.get("std_dev") is not None else None
            for candidate in record.get("top_candidates", []):
                candidate["score"] = _round_numeric(candidate.get("score")) if candidate.get("score") is not None else None
                candidate["params"] = _sanitize_params(candidate.get("params", {}))

    feature_names = X.columns.tolist()
    feature_insights = _extract_feature_insights(best_model, feature_names)

    if best_params is None:
        formatted_params = {"error": "No valid hyperparameters found."}
    else:
        formatted_params = _sanitize_params(best_params)

    if is_classification:
        evaluation, prediction_payload = _classification_metrics(best_model, X_val, y_val)
    else:
        evaluation, prediction_payload = _regression_metrics(best_model, X_val, y_val)

    MODEL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    model_id = uuid.uuid4().hex
    model_file_name = f"{model_id}_{req.model_type}.joblib"
    model_path = MODEL_STORAGE_DIR / model_file_name
    joblib.dump(best_model, model_path)
    model_asset = {
        "id": model_id,
        "file_name": model_file_name,
        "model_type": req.model_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "download_url": f"/optimize/download-model/{model_id}",
    }

    return {
        "best_score": _round_numeric(best_score),
        "best_params": formatted_params,
        "generation_scores": [_round_numeric(score) for score in generation_scores],
        "generation_details": generation_details,
        "evaluation": evaluation,
        "predictions": prediction_payload,
        "feature_insights": feature_insights,
        "task_type": "classification" if is_classification else "regression",
        "model_type": req.model_type,
        "search_configuration": {
            "generations": req.generations,
            "population_size": req.population_size,
            "validation_split": 0.2,
        },
        "dataset_metadata": {
            "feature_count": len(feature_names),
            "row_count": int(df.shape[0]),
        },
        "model_asset": model_asset,
    }
