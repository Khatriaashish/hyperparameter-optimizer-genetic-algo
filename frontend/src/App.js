import React, { useState } from "react";
import DatasetSelector from "./components/DatasetSelector";
import ResultChart from "./components/ResultChart";
import ConfusionMatrix from "./components/ConfusionMatrix";
import { startOptimization } from "./api";

const App = () => {
  const [step, setStep] = useState(1);
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [selectedTargetColumn, setSelectedTargetColumn] = useState("");
  const [selectedModel, setSelectedModel] = useState("random_forest");
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOptimization = (params) => {
    setLoading(true);
    startOptimization(params)
      .then((response) => {
        setOptimizationResult(response.data);
        setStep(5);
      })
      .catch((error) => console.error("Error during optimization:", error))
      .finally(() => setLoading(false));
  };

  const renderBestParams = () => {
    if (!optimizationResult?.best_params) return null;

    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Best Hyperparameters</h3>
        <div className="overflow-x-auto">
          <table className="table-auto border border-gray-300 w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Parameter</th>
                <th className="border px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(optimizationResult.best_params).map(
                ([key, value]) => (
                  <tr key={key}>
                    <td className="border px-4 py-2">{key}</td>
                    <td className="border px-4 py-2">
                      {" "}
                      {Array.isArray(value) ? (
                        <span className="text-indigo-600 font-medium">
                          [{value.join(", ")}]
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const restartApp = () => {
    setStep(1);
    setDatasetColumns([]);
    setSelectedTargetColumn("");
    setSelectedModel("random_forest");
    setOptimizationResult(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-700">
          ML Hyperparameter Optimization with Genetic Algorithm
        </h1>

        {/* Step 1: Upload Dataset */}
        {step === 1 && (
          <div>
            <DatasetSelector
              setDatasetColumns={(cols) => {
                setDatasetColumns(cols);
                setStep(2);
              }}
            />
          </div>
        )}

        {/* Step 2: Select Target Column */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Select <span className="text-green-600">Target Column</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {datasetColumns.map((col, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedTargetColumn(col);
                    setStep(3);
                  }}
                  className="p-4 border rounded-lg shadow hover:shadow-md transition duration-200 text-center bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <span className="font-medium text-gray-800">{col}</span>
                </button>
              ))}
            </div>
            <StepNavigation onBack={() => setStep(1)} />
          </div>
        )}

        {/* Step 3: Select Model */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Select Model
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Random Forest", value: "random_forest" },
                { label: "SVM", value: "svm" },
                { label: "Neural Network", value: "neural_network" },
              ].map((model) => (
                <button
                  key={model.value}
                  onClick={() => {
                    setSelectedModel(model.value);
                    setStep(4);
                  }}
                  className={`p-4 border rounded-lg shadow hover:shadow-md transition duration-200 text-center ${
                    selectedModel === model.value
                      ? "bg-green-100 border-green-500"
                      : "bg-white hover:bg-green-50"
                  }`}
                >
                  <span className="font-medium text-gray-800">
                    {model.label}
                  </span>
                </button>
              ))}
            </div>
            <StepNavigation onBack={() => setStep(2)} />
          </div>
        )}
        {/* Step 4: Start Optimization */}
        {step === 4 && (
          <div className="flex flex-col items-center space-y-6">
            <h3 className="text-xl font-semibold text-gray-700">
              Start Optimization
            </h3>

            {!loading ? (
              <button
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
                onClick={() =>
                  handleOptimization({
                    target_column: selectedTargetColumn,
                    generations: 5,
                    population_size: 10,
                    model_type: selectedModel,
                  })
                }
              >
                🚀 Start Optimization
              </button>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                  <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                </div>
                <p className="text-center text-sm text-gray-600 italic">
                  🧬 Mixing Genes & Breeding Brains... Please Wait! 😄
                </p>
              </div>
            )}
            <StepNavigation onBack={() => setStep(3)} />
          </div>
        )}

        {/* Step 5: Display Results */}
        {step === 5 && optimizationResult && (
          <div className="space-y-6 mt-6">
            {renderBestParams()}
            <ResultChart
              generationScores={optimizationResult.generation_scores}
            />

            <div>
              <h3 className="text-xl font-semibold mb-2">
                Optimization Summary
              </h3>
              <table className="table-auto border border-gray-300 w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2">Generation</th>
                    <th className="border px-4 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResult.generation_scores?.map((score, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">
                        Generation {index + 1}
                      </td>
                      <td className="border px-4 py-2">{score.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-semibold">
                    <td colSpan="2" className="border px-4 py-2">
                      Best Score: {optimizationResult.best_score}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {optimizationResult.task_type === "classification" &&
              optimizationResult.y_true &&
              optimizationResult.y_pred && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Confusion Matrix
                  </h3>
                  <ConfusionMatrix
                    yTrue={optimizationResult.y_true}
                    yPred={optimizationResult.y_pred}
                  />
                </div>
              )}
            <StepNavigation
              onBack={() => setStep(4)}
              onRestart={restartApp}
              isFinal
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

const StepNavigation = ({ onBack, onRestart, isFinal = false }) => (
  <div className="flex justify-between mt-8">
    {onBack && (
      <button
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded transition-all duration-200"
        onClick={onBack}
      >
        Back
      </button>
    )}
    {isFinal && (
      <button
        className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded transition-all duration-200"
        onClick={onRestart}
      >
        Restart
      </button>
    )}
  </div>
);
