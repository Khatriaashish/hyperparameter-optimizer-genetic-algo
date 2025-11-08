import React, { useState, useMemo } from "react";
import DatasetSelector from "./components/DatasetSelector";
import DatasetInsights from "./components/DatasetInsights";
import ResultChart from "./components/ResultChart";
import ConfusionMatrix from "./components/ConfusionMatrix";
import MetricsOverview from "./components/MetricsOverview";
import FeatureInsights from "./components/FeatureInsights";
import RocCurveChart from "./components/RocCurveChart";
import ResidualsChart from "./components/ResidualsChart";
import ClassificationReportTable from "./components/ClassificationReportTable";
import { startOptimization, getModelDownloadUrl } from "./api";

const App = () => {
  const [step, setStep] = useState(1);
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [selectedTargetColumn, setSelectedTargetColumn] = useState("");
  const [selectedModel, setSelectedModel] = useState("random_forest");
  const [gaConfig, setGaConfig] = useState({ generations: 8, populationSize: 20 });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const taskType = optimizationResult?.task_type;
  const evaluation = optimizationResult?.evaluation;
  const predictions = optimizationResult?.predictions;
  const featureInsights = optimizationResult?.feature_insights;

  const handleDatasetLoaded = (payload) => {
    setDatasetDetails(payload);
    setDatasetColumns(payload?.columns ?? []);
    setSelectedTargetColumn("");
    setSelectedModel("random_forest");
    setGaConfig({ generations: 8, populationSize: 20 });
    setOptimizationResult(null);
    setErrorMessage("");
    setStep(2);
  };

  const handleOptimization = () => {
    if (!selectedTargetColumn) {
      setErrorMessage("Please select a target column before running optimization.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    startOptimization({
      target_column: selectedTargetColumn,
      generations: Number(gaConfig.generations),
      population_size: Number(gaConfig.populationSize),
      model_type: selectedModel,
    })
      .then((response) => {
        setOptimizationResult(response.data);
        setStep(4);
      })
      .catch((error) => {
        console.error("Error during optimization:", error);
        setErrorMessage("Optimization failed. Please review your configuration or dataset.");
      })
      .finally(() => setLoading(false));
  };

  const restartApp = () => {
    setStep(1);
    setDatasetDetails(null);
    setDatasetColumns([]);
    setSelectedTargetColumn("");
    setSelectedModel("random_forest");
    setGaConfig({ generations: 8, populationSize: 20 });
    setOptimizationResult(null);
    setLoading(false);
    setErrorMessage("");
  };

  const generationHistory = useMemo(
    () => optimizationResult?.generation_details ?? [],
    [optimizationResult]
  );

  const predictionsPreview = useMemo(() => {
    if (!predictions?.y_true || !predictions?.y_pred) return [];
    return predictions.y_true.slice(0, 10).map((truth, idx) => ({
      actual: truth,
      predicted: predictions.y_pred[idx],
      probability:
        Array.isArray(predictions.probabilities) && predictions.probabilities[idx]
          ? predictions.probabilities[idx]
          : null,
    }));
  }, [predictions]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Research-Grade Hyperparameter Optimization Lab
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload data, inspect key signals, and benchmark genetic algorithm searches across models.
          </p>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-100 border border-red-200 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="bg-white shadow rounded-xl p-8 space-y-8">
          {step === 1 && (
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Step 1 · Curate Your Dataset
              </h2>
              <DatasetSelector onDatasetLoaded={handleDatasetLoaded} />
            </section>
          )}

          {step === 2 && datasetDetails && (
            <section className="space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-1/3 bg-gray-50 rounded-lg p-5 shadow-inner space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Step 2 · Select Target Variable
                  </h2>
                  <p className="text-sm text-gray-600">
                    Choose the response variable to optimize against. Use the dataset summary to understand feature dynamics.
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {datasetColumns.map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedTargetColumn(col)}
                        className={`w-full text-left px-4 py-3 rounded-md border transition-all duration-150 ${
                          selectedTargetColumn === col
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                  <StepNavigation
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                    nextLabel="Continue to Model Setup"
                    disableNext={!selectedTargetColumn}
                  />
                </div>
                <div className="lg:flex-1">
                  <DatasetInsights summary={datasetDetails.summary} />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-gray-50 rounded-lg p-6 shadow-inner space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Step 3 · Model Selection
                  </h2>
                  <p className="text-sm text-gray-600">
                    Evaluate different learning families to probe the search landscape.
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Random Forest",
                        value: "random_forest",
                        description: "Non-linear ensemble with feature importance insights.",
                      },
                      {
                        label: "Support Vector Machine",
                        value: "svm",
                        description: "Max-margin classifier. Best suited for balanced, scaled data.",
                      },
                      {
                        label: "Neural Network",
                        value: "neural_network",
                        description: "Multi-layer perceptron optimized via GA-discovered topology.",
                      },
                    ].map((model) => (
                      <button
                        key={model.value}
                        onClick={() => setSelectedModel(model.value)}
                        className={`w-full text-left px-5 py-4 rounded-lg border transition-all duration-150 ${
                          selectedModel === model.value
                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{model.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 shadow-inner space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Genetic Algorithm Configuration
                  </h2>
                  <p className="text-sm text-gray-600">
                    Calibrate the evolutionary search breadth and depth.
                  </p>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Generations</span>
                      <input
                        type="number"
                        min={3}
                        max={40}
                        value={gaConfig.generations}
                        onChange={(e) =>
                          setGaConfig((prev) => ({
                            ...prev,
                            generations: Number(e.target.value),
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Population Size</span>
                      <input
                        type="number"
                        min={6}
                        max={60}
                        value={gaConfig.populationSize}
                        onChange={(e) =>
                          setGaConfig((prev) => ({
                            ...prev,
                            populationSize: Number(e.target.value),
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                  <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    Increasing generations explores deeper, while larger populations broaden search diversity at higher compute cost.
                  </div>
                  <StepNavigation
                    onBack={() => setStep(2)}
                    onNext={handleOptimization}
                    nextLabel={loading ? "Running Optimization..." : "Run Optimization"}
                    disableNext={loading}
                  />
                  {loading && (
                    <div className="flex items-center gap-3 text-sm text-indigo-600">
                      <span className="h-3 w-3 animate-ping rounded-full bg-indigo-500"></span>
                      Running genetic crossover and mutation cycles...
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 4 && optimizationResult && (
            <section className="space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Step 4 · Optimization Insights
                  </h2>
                  <p className="text-sm text-gray-600">
                    Benchmark quality: {optimizationResult.best_score} | Model family:{" "}
                    <span className="font-semibold text-gray-800">{optimizationResult.model_type}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                    Generations: {optimizationResult.search_configuration?.generations}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                    Population: {optimizationResult.search_configuration?.population_size}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                    Dataset rows: {optimizationResult.dataset_metadata?.row_count}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-3 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800">Best Hyperparameters</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(optimizationResult.best_params || {}).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-700"
                    >
                      {key}: <span className="ml-1 font-semibold text-gray-900">{String(value)}</span>
                    </span>
                  ))}
                </div>
              </div>

              {optimizationResult.model_asset && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-900">Download Trained Model</h3>
                    <p className="text-sm text-indigo-700">
                      Persist the GA-optimized{" "}
                      <span className="font-semibold">
                        {optimizationResult.model_asset.model_type}
                      </span>{" "}
                      estimator for offline validation or deployment.
                    </p>
                  </div>
                  <a
                    href={getModelDownloadUrl(optimizationResult.model_asset.id)}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                    download
                  >
                    <span>
                      Download{" "}
                      <span className="font-semibold">
                        {optimizationResult.model_asset.file_name}
                      </span>
                    </span>
                  </a>
                </div>
              )}

              <MetricsOverview evaluation={evaluation} taskType={taskType} />
              <ResultChart
                generationScores={optimizationResult.generation_scores}
                generationDetails={generationHistory}
              />

              {taskType === "classification" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <ConfusionMatrix
                      yTrue={predictions?.y_true ?? []}
                      yPred={predictions?.y_pred ?? []}
                    />
                    <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Class Distribution</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(evaluation?.class_distribution ?? {}).map(([label, count]) => (
                          <span
                            key={label}
                            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700"
                          >
                            {label}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <RocCurveChart roc={evaluation?.roc_curve} />
                    <ClassificationReportTable report={evaluation?.classification_report} />
                  </div>
                </div>
              )}

              {taskType === "regression" && evaluation?.residuals && (
                <ResidualsChart residuals={evaluation.residuals} />
              )}

              {featureInsights && (
                <FeatureInsights data={featureInsights} />
              )}

              {predictionsPreview.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Prediction Snapshot (first 10 validation records)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2 font-semibold text-gray-600">Index</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Actual</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Predicted</th>
                          {taskType === "classification" && <th className="px-4 py-2 font-semibold text-gray-600">Probabilities</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {predictionsPreview.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 text-gray-600">{idx + 1}</td>
                            <td className="px-4 py-2 text-gray-600">{row.actual}</td>
                            <td className="px-4 py-2 text-gray-600">{row.predicted}</td>
                            {taskType === "classification" && (
                              <td className="px-4 py-2 text-gray-600">
                                {row.probability
                                  ? Array.isArray(row.probability)
                                    ? row.probability.map((p, probIdx) => (
                                        <span key={probIdx} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 mr-2">
                                          Class {probIdx}: {Number(p).toFixed(3)}
                                        </span>
                                      ))
                                    : Number(row.probability).toFixed(3)
                                  : "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <StepNavigation onBack={() => setStep(3)} onRestart={restartApp} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const StepNavigation = ({ onBack, onNext, nextLabel = "Next", disableNext = false, onRestart }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-6">
    <div>
      {onBack && (
        <button
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={onBack}
        >
          Back
        </button>
      )}
    </div>
    <div className="flex gap-3">
      {onRestart && (
        <button
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          onClick={onRestart}
        >
          Restart
        </button>
      )}
      {onNext && (
        <button
          className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm ${
            disableNext
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
          onClick={onNext}
          disabled={disableNext}
        >
          {nextLabel}
        </button>
      )}
    </div>
  </div>
);

export default App;
