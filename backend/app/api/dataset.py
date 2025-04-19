from fastapi import APIRouter, UploadFile, File
from app.services.dataset_handler import handle_upload, load_default_dataset_service
from app.models.dataset_request import DatasetRequest

router = APIRouter()

@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    return await handle_upload(file)

@router.post("/load-default-dataset")
async def load_default_dataset(payload: DatasetRequest):
    return load_default_dataset_service(payload)
