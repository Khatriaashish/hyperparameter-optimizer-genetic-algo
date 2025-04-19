from fastapi import APIRouter
from .dataset import router as load_dataset_router
from .default_datasets import router as getDefault_router
from .optimization import router as optimize_router

api_router = APIRouter()
api_router.include_router(load_dataset_router, prefix="/load")
api_router.include_router(getDefault_router, prefix="/getDefault")
api_router.include_router(optimize_router, prefix="/optimize")