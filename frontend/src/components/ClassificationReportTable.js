import React from "react";

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toFixed(4);
  return value;
};

const ClassificationReportTable = ({ report }) => {
  if (!report) return null;

  const entries = Object.entries(report);
  const accuracyEntry = entries.find(([label]) => label === "accuracy");
  const rows = entries.filter(([label]) => label !== "accuracy");

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Classification Report</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2 font-semibold text-gray-600">Label</th>
              <th className="px-4 py-2 font-semibold text-gray-600">Precision</th>
              <th className="px-4 py-2 font-semibold text-gray-600">Recall</th>
              <th className="px-4 py-2 font-semibold text-gray-600">F1-Score</th>
              <th className="px-4 py-2 font-semibold text-gray-600">Support</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, metrics], idx) => (
              <tr key={label} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2 font-medium text-gray-800">{label}</td>
                <td className="px-4 py-2 text-gray-600">{formatValue(metrics.precision)}</td>
                <td className="px-4 py-2 text-gray-600">{formatValue(metrics.recall)}</td>
                <td className="px-4 py-2 text-gray-600">{formatValue(metrics["f1-score"])}</td>
                <td className="px-4 py-2 text-gray-600">{metrics.support ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {accuracyEntry && (
        <div className="mt-4 text-sm text-gray-600">
          Overall accuracy:{" "}
          <span className="font-semibold text-gray-800">
            {formatValue(accuracyEntry[1])}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassificationReportTable;

