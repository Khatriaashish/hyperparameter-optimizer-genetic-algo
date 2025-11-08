# Hyperparameter Optimization Research Lab

A full-stack laboratory for evolutionary hyperparameter search that emphasises research-grade insight and interpretability. Upload your dataset, explore exploratory data analysis (EDA) panels, and benchmark genetic algorithm (GA) runs across model families with rich diagnostics.

---

## Stack Overview

- **Backend**: FastAPI (Python) with scikit-learn models and a custom GA engine (`backend/app`)
- **Frontend**: React + Tailwind + Recharts/Chart.js visual analytics (`frontend/src`)
- **Models Supported**: Random Forest, Support Vector Machine, Multi-layer Perceptron
- **Key Outputs**: GA generation telemetry, evaluation metrics (classification & regression), ROC/Residual diagnostics, feature importance and dataset profiling

---

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API boots on `http://127.0.0.1:8000`.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```

The UI runs on `http://localhost:3000` and expects the backend to be available.

---

## User Journey

1. **Curate Dataset**  
   Upload a CSV or load provided templates (Iris, Wine). The backend persists to `app/storage/dataset.csv`.

2. **EDA Snapshot**  
   Automatic dataset summary includes:
   - Shape, column types, missing value distribution
   - Numeric feature stats (mean/std/min/max/median/skew/kurtosis)
   - Categorical top-k levels
   - High-correlation pairs (|r| ≥ 0.5)
   - Sample rows preview

3. **Target Selection & Model Setup**  
   Pick the response variable, choose a model family, and tune GA parameters (generations/population size).

4. **Run GA Optimization**  
   Backend executes the GA, returning generation-level telemetry plus the champion model.

5. **Research Insights Dashboard**  
   - Best hyperparameters & GA leaderboard
   - Performance metrics (accuracy/precision/recall/F1 or MAE/MSE/R²)
   - ROC curve, confusion matrix, classification report
   - Residual diagnostics for regression
   - Feature importance / coefficient analysis
   - Prediction preview with probabilities (classification)
   - Downloadable trained model artifact (Joblib)

---

## API Surface (Selected Endpoints)

| Endpoint | Method | Description |
| --- | --- | --- |
| `/load/upload-dataset` | POST | Upload CSV; returns `columns` and `summary` payload |
| `/load/load-default-dataset` | POST | Load iris/wine template; same response shape as upload |
| `/getDefault/default-datasets` | GET | Enumerate bundled datasets |
| `/optimize/start-optimization` | POST | Trigger GA search |
| `/optimize/download-model/{model_id}` | GET | Stream the persisted best model as a Joblib artifact |

### Optimization Response Shape (abridged)

```jsonc
{
  "best_score": 0.9421,
  "best_params": { "n_estimators": 142, "max_depth": 9, ... },
  "generation_scores": [0.88, 0.90, 0.93, 0.94, ...],
  "generation_details": [
    {
      "generation": 1,
      "best_score": 0.88,
      "average_score": 0.76,
      "top_candidates": [{ "rank": 1, "score": 0.88, "params": { ... } }]
    },
    ...
  ],
  "evaluation": {
    "summary": { "accuracy": 0.94, "precision_weighted": 0.95, ... },
    "classification_report": { "0": { "precision": ... }, "accuracy": 0.94, ... },
    "confusion_matrix": [[10, 0], [1, 9]],
    "roc_curve": { "fpr": [...], "tpr": [...], "auc": 0.97 },
    "residuals": { ... } // regression only
  },
  "predictions": {
    "y_true": [0, 1, ...],
    "y_pred": [0, 1, ...],
    "probabilities": [[0.1, 0.9], ...]
  },
  "feature_insights": {
    "type": "feature_importance",
    "values": [{ "feature": "sepal_length", "importance": 0.31 }, ...]
  }
}
```

---

## Frontend Highlights

- Multi-step workflow with contextual guidance and inline validation
- Research-focused analytics:
  - GA trajectory (best/mean/median fitness)
  - Final generation leaderboard with hyperparameter chips
  - Interactive ROC curve and residual area chart
  - Heat-mapped confusion matrix
- Prediction preview table (first 10 validation samples)
- Responsive layout optimized for desktop dashboards

---

## Extending the Lab

- Swap/expand model families inside `backend/app/services/genetic_algorithm.py`
- Add bespoke metrics (e.g., PR curves) by enriching `run_optimization`
- Integrate additional charts by extending the React component library in `frontend/src/components`

---

## Troubleshooting & Tips

- Ensure the backend is running before loading the UI; the frontend relies on live API calls.
- Large datasets may increase GA runtime; tweak population size and generations judiciously.
- For classification targets, ensure the dataset includes balanced classes to leverage ROC interpretation.

Happy experimenting!
