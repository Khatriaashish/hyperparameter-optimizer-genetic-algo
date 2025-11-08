import pandas as pd
import numpy as np
from io import StringIO
from typing import Dict, Any, List
from app.models.dataset_request import DatasetRequest

DATA_PATH = "app/storage/dataset.csv"
DEFAULT_DATASETS = {
    "iris": "app/templates/iris.csv",
    "wine": "app/templates/wine.csv",
}


def _round_numeric(value: Any, precision: int = 4) -> Any:
    if isinstance(value, (int, np.integer)):
        return int(value)
    if isinstance(value, (float, np.floating)):
        return round(float(value), precision)
    return value


def _summarize_numeric_columns(df: pd.DataFrame, numeric_cols: List[str]) -> Dict[str, Dict[str, Any]]:
    summary: Dict[str, Dict[str, Any]] = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue
        summary[col] = {
            "mean": _round_numeric(series.mean()),
            "std": _round_numeric(series.std()),
            "min": _round_numeric(series.min()),
            "max": _round_numeric(series.max()),
            "median": _round_numeric(series.median()),
            "skewness": _round_numeric(series.skew()),
            "kurtosis": _round_numeric(series.kurt()),
        }
    return summary


def _summarize_categorical_columns(df: pd.DataFrame, categorical_cols: List[str]) -> Dict[str, Dict[str, Any]]:
    summary: Dict[str, Dict[str, Any]] = {}
    for col in categorical_cols:
        series = df[col].astype(str).fillna("Missing")
        top_values = series.value_counts().head(5)
        summary[col] = {
            "unique_values": int(series.nunique()),
            "top_values": [
                {
                    "value": idx,
                    "count": int(count),
                    "percentage": _round_numeric((count / len(series)) * 100, 2),
                }
                for idx, count in top_values.items()
            ],
        }
    return summary


def _top_correlations(df: pd.DataFrame, threshold: float = 0.5, limit: int = 10) -> List[Dict[str, Any]]:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return []
    corr_matrix = numeric_df.corr().abs()
    upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    correlations: List[Dict[str, Any]] = []
    for col in upper_tri.columns:
        for row in upper_tri.index:
            value = upper_tri.loc[row, col]
            if pd.notnull(value) and value >= threshold:
                correlations.append(
                    {
                        "feature_a": row,
                        "feature_b": col,
                        "correlation": _round_numeric(value),
                    }
                )
    correlations.sort(key=lambda item: item["correlation"], reverse=True)
    return correlations[:limit]


def _summarize_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    missing_values = {
        col: int(df[col].isna().sum())
        for col in df.columns
        if int(df[col].isna().sum()) > 0
    }

    return {
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": missing_values,
        "numeric_summary": _summarize_numeric_columns(df, numeric_cols),
        "categorical_summary": _summarize_categorical_columns(df, categorical_cols),
        "top_correlations": _top_correlations(df),
        "sample_rows": df.head(5).to_dict(orient="records"),
    }


def _build_dataset_response(message: str, df: pd.DataFrame) -> Dict[str, Any]:
    summary = _summarize_dataframe(df)
    return {
        "message": message,
        "columns": df.columns.tolist(),
        "summary": summary,
    }


async def handle_upload(file):
    contents = await file.read()
    df = pd.read_csv(StringIO(contents.decode("utf-8")))
    df.to_csv(DATA_PATH, index=False)
    return _build_dataset_response("Dataset uploaded successfully", df)


def load_default_datasets():
    return {"datasets": list(DEFAULT_DATASETS.keys())}


def load_default_dataset_service(payload: DatasetRequest):
    if payload.name not in DEFAULT_DATASETS:
        return {"error": "Dataset not found."}

    path = DEFAULT_DATASETS[payload.name]
    df = pd.read_csv(path)
    df.to_csv(DATA_PATH, index=False)
    return _build_dataset_response(f"{payload.name} dataset loaded successfully", df)
