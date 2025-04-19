from pydantic import BaseModel

class OptimizationRequest(BaseModel):
    target_column: str
    generations: int = 10
    population_size: int = 10
    model_type: str = "random_forest"  # could be: "random_forest", "svm", "neural_network"
