from .genetic_algorithm import run_ga
import os
import pandas as pd
from sklearn.utils.multiclass import type_of_target
from math import isinf
from .dataset_handler import DATA_PATH

async def run_optimization(req):
     # Check if dataset exists
    if not os.path.exists(DATA_PATH):
        return {"error": "Dataset not uploaded yet."}

    # Read dataset
    df = pd.read_csv(DATA_PATH)

    if req.target_column not in df.columns:
        return {"error": f"Target column '{req.target_column}' not found in dataset."}

    # Split features and labels
    X = df.drop(columns=[req.target_column])
    y = df[req.target_column]

    # Encode categorical features
    X = pd.get_dummies(X)
    if y.dtype == "object":
        y = pd.factorize(y)[0]

    # Get target type (classification or regression)
    target_type = type_of_target(y)

    # Run GA optimizer
    best_params, best_score, generation_scores, best_model = run_ga(
        X, y,
        generations=req.generations,
        population_size=req.population_size,
        model_type=req.model_type,
        return_model=True
    )

    # Sanitize -inf scores
    def sanitize(score):
        return 0 if isinf(score) else score

    best_score = sanitize(best_score)
    generation_scores = [sanitize(s) for s in generation_scores]

    # Predict only for classification
    if target_type in ["binary", "multiclass"] and best_model:
        y_true = y[test_index := X.index.isin(X.iloc[int(0.8 * len(X)):].index)].tolist()
        y_pred = best_model.predict(X.iloc[int(0.8 * len(X)):]).tolist()
    else:
        y_true = y_pred = None

    # Prepare hyperparameter display
    model_hyperparameters = {}
    if best_params is not None:
        if req.model_type == "random_forest":
            model_hyperparameters = {
                "n_estimators": int(best_params.get("n_estimators", "N/A")),
                "max_depth": int(best_params.get("max_depth", "N/A")),
                "min_samples_split": int(best_params.get("min_samples_split", "N/A")),
                "min_samples_leaf": int(best_params.get("min_samples_leaf", "N/A")),
                "max_features": round(best_params.get("max_features", 0), 4),
            }
        elif req.model_type == "svm":
            model_hyperparameters = {
                "C": round(best_params.get("C", 0), 4),
                "gamma": round(best_params.get("gamma", 0), 4),
                "tol": round(best_params.get("tol", 0), 6)
            }
        elif req.model_type == "neural_network":
            model_hyperparameters = {
                "hidden_layer_sizes": tuple([int(best_params.get("layer_size", 0))] * int(best_params.get("hidden_layer_sizes", 1))),
                "alpha": round(best_params.get("alpha", 0), 6),
                "learning_rate_init": round(best_params.get("learning_rate_init", 0), 6)
            }
    else:
        model_hyperparameters = {"error": "No valid hyperparameters found."}

    return {
        "best_score": round(best_score, 4),
        "best_params": model_hyperparameters,
        "generation_scores": generation_scores,
        "y_true": y_true,
        "y_pred": y_pred,
        "task_type": "classification" if target_type in ["binary", "multiclass"] else "regression",
        "model_type": req.model_type
    }
