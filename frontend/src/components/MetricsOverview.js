import React from "react";

const MetricCard = ({ label, value, accent }) => (
  <div className={`rounded-lg px-4 py-5 shadow-sm ${accent}`}>
    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const MetricsOverview = ({ evaluation, taskType }) => {
  if (!evaluation?.summary) return null;

  const summary = evaluation.summary;

  const formatValue = (value, precision = 4) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      return value.toFixed(precision);
    }
    return value;
  };

  const classificationMetrics = [
    { label: "Accuracy", value: formatValue(summary.accuracy), accent: "bg-emerald-100" },
    { label: "Precision (weighted)", value: formatValue(summary.precision_weighted), accent: "bg-indigo-100" },
    { label: "Recall (weighted)", value: formatValue(summary.recall_weighted), accent: "bg-amber-100" },
    { label: "F1 (weighted)", value: formatValue(summary.f1_weighted), accent: "bg-sky-100" },
    { label: "Baseline Accuracy", value: formatValue(summary.baseline_accuracy), accent: "bg-rose-100" },
  ];

  const regressionMetrics = [
    { label: "MAE", value: formatValue(summary.mae), accent: "bg-emerald-100" },
    { label: "MSE", value: formatValue(summary.mse), accent: "bg-indigo-100" },
    { label: "RMSE", value: formatValue(summary.rmse), accent: "bg-amber-100" },
    { label: "R²", value: formatValue(summary.r2), accent: "bg-sky-100" },
    { label: "Baseline MSE", value: formatValue(summary.baseline_mse), accent: "bg-rose-100" },
  ];

  const metricsToDisplay = taskType === "classification" ? classificationMetrics : regressionMetrics;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">
        {taskType === "classification" ? "Classification Performance" : "Regression Performance"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricsToDisplay.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default MetricsOverview;

