from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import optimization, dataset, default_datasets
from app.models.optimization_request import OptimizationRequest
from app.models.dataset_request import DatasetRequest
from app.api import api_router
import os
from sklearn.datasets import load_iris, load_wine


app = FastAPI()

# Allow CORS for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory dataset storage
DATA_PATH = "storage/dataset.csv"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

# These are the datasets and where they'll be saved
DEFAULT_DATASETS = {
    "iris": os.path.join(TEMPLATES_DIR, "iris.csv"),
    "wine": os.path.join(TEMPLATES_DIR, "wine.csv"),
}

# Load default datasets
def save_dataset(name: str, path: str):
    if name == "iris":
        data = load_iris(as_frame=True)
    elif name == "wine":
        data = load_wine(as_frame=True)
    else:
        raise ValueError(f"Unsupported dataset: {name}")

    df = data.frame
    df.to_csv(path, index=False)

@app.on_event("startup")
async def create_default_datasets():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    
    for name, path in DEFAULT_DATASETS.items():
        if not os.path.exists(path):
            save_dataset(name, path)
            print(f"[INFO] Created dataset '{name}' from scikit-learn.")
        else:
            print(f"[INFO] Dataset '{name}' already exists.")




# Include routers for different API functionality
app.include_router(api_router)

