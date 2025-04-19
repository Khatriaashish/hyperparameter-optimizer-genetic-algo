import pandas as pd
import os
from io import StringIO
from app.models.dataset_request import DatasetRequest
from pathlib import Path

DATA_PATH = "app/storage/dataset.csv"
DEFAULT_DATASETS = {
    "iris": "app/templates/iris.csv",
    "wine": "app/templates/wine.csv",
}

async def handle_upload(file):
    contents = await file.read()
    df = pd.read_csv(StringIO(contents.decode("utf-8")))
    df.to_csv(DATA_PATH, index=False)
    return {"message": "Dataset uploaded successfully", "columns": df.columns.tolist()}

def load_default_datasets():
    return {"datasets": list(DEFAULT_DATASETS.keys())}

def load_default_dataset_service(payload: DatasetRequest):
    if payload.name not in DEFAULT_DATASETS:
        return {"error": "Dataset not found."}
    
    path = DEFAULT_DATASETS[payload.name]
    df = pd.read_csv(path)
    df.to_csv(DATA_PATH, index=False)
    return {"message": f"{payload.name} dataset loaded successfully", "columns": df.columns.tolist()}
