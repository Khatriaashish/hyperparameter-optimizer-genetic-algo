from fastapi import APIRouter
from app.services.dataset_handler import load_default_datasets

router = APIRouter()

@router.get("/default-datasets")
async def list_default_datasets():
    return load_default_datasets()
