from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.models.optimization_request import OptimizationRequest
from app.services.optimizer import run_optimization

router = APIRouter()

MODEL_STORAGE_DIR = Path("app/storage/models")

@router.post("/start-optimization")
async def start_optimization(req: OptimizationRequest):
    return await run_optimization(req)


@router.get("/download-model/{model_id}")
async def download_model(model_id: str):
    if not MODEL_STORAGE_DIR.exists():
        raise HTTPException(status_code=404, detail="Model not found.")

    matching_files = list(MODEL_STORAGE_DIR.glob(f"{model_id}_*.joblib"))
    if not matching_files:
        raise HTTPException(status_code=404, detail="Model not found.")

    file_path = matching_files[0]
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )
