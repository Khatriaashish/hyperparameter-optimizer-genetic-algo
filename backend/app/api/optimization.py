from fastapi import APIRouter
from app.models.optimization_request import OptimizationRequest
from app.services.optimizer import run_optimization

router = APIRouter()

@router.post("/start-optimization")
async def start_optimization(req: OptimizationRequest):
    return await run_optimization(req)
