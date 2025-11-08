import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const InsightCard = ({ label, value, accent = "bg-blue-100", textColor = "text-blue-700" }) => (
  <div className={`rounded-lg p-4 shadow-sm ${accent}`}>
    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
    <p className={`mt-2 text-2xl font-semibold ${textColor}`}>{value}</p>
  </div>
);

const DatasetInsights = ({ summary }) => {
  const missingValues = summary?.missing_values ?? {};
  const numericSummary = summary?.numeric_summary ?? {};
  const categoricalSummary = summary?.categorical_summary ?? {};
  const correlations = summary?.top_correlations ?? [];
  const sampleRows = summary?.sample_rows ?? [];

  const statsCards = useMemo(() => {
    const rowCount = summary?.shape?.rows ?? 0;
    const columnCount = summary?.shape?.columns ?? 0;
    const numericCount = Object.keys(numericSummary).length;
    const categoricalCount = Object.keys(categoricalSummary).length;
    const missingColumns = Object.keys(missingValues).length;

    return [
      { label: "Rows", value: rowCount.toLocaleString(), accent: "bg-emerald-100", textColor: "text-emerald-700" },
      { label: "Columns", value: columnCount, accent: "bg-indigo-100", textColor: "text-indigo-700" },
      { label: "Numeric Features", value: numericCount, accent: "bg-amber-100", textColor: "text-amber-700" },
      { label: "Categorical Features", value: categoricalCount, accent: "bg-sky-100", textColor: "text-sky-700" },
      { label: "Columns with Missing", value: missingColumns, accent: "bg-rose-100", textColor: "text-rose-700" },
    ];
  }, [summary, numericSummary, categoricalSummary, missingValues]);

  const missingChart = useMemo(() => {
    const labels = Object.keys(missingValues);
    if (!labels.length) return null;

    return {
      data: {
        labels,
        datasets: [
          {
            label: "Missing Values",
            data: labels.map((label) => missingValues[label]),
            backgroundColor: "#f97316",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Missing Values per Column",
            align: "start",
            font: { size: 16, weight: "bold" },
            color: "#1f2937",
          },
        },
        scales: {
          x: {
            ticks: { color: "#4b5563" },
          },
          y: {
            ticks: { color: "#4b5563" },
            beginAtZero: true,
          },
        },
      },
    };
  }, [missingValues]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statsCards.map((card) => (
          <InsightCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-5">
          {missingChart ? (
            <Bar data={missingChart.data} options={missingChart.options} />
          ) : (
            <p className="text-sm text-gray-500">No missing values detected across columns.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Feature Correlations</h4>
          {correlations.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-semibold text-gray-600">Feature A</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Feature B</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">|Correlation|</th>
                  </tr>
                </thead>
                <tbody>
                  {correlations.map((item, idx) => (
                    <tr key={`${item.feature_a}-${item.feature_b}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 text-gray-700 font-medium">{item.feature_a}</td>
                      <td className="px-4 py-2 text-gray-700 font-medium">{item.feature_b}</td>
                      <td className="px-4 py-2 text-gray-600">{item.correlation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No strong linear correlations detected (|r| ≥ 0.5).</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Numeric Feature Summary</h4>
        {Object.keys(numericSummary).length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-600">Feature</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Mean</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Std</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Median</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Min</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(numericSummary).map(([feature, stats], idx) => (
                  <tr key={feature} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 font-medium text-gray-800">{feature}</td>
                    <td className="px-4 py-2 text-gray-600">{stats.mean}</td>
                    <td className="px-4 py-2 text-gray-600">{stats.std}</td>
                    <td className="px-4 py-2 text-gray-600">{stats.median}</td>
                    <td className="px-4 py-2 text-gray-600">{stats.min}</td>
                    <td className="px-4 py-2 text-gray-600">{stats.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No numeric features detected.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Categorical Highlights</h4>
        {Object.keys(categoricalSummary).length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(categoricalSummary).map(([feature, stats]) => (
              <div key={feature} className="border border-gray-100 rounded-md p-4">
                <h5 className="font-semibold text-gray-700 mb-2">{feature}</h5>
                <p className="text-sm text-gray-500 mb-2">
                  Unique values: <span className="font-medium text-gray-700">{stats.unique_values}</span>
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {stats.top_values.map((item) => (
                    <li key={`${feature}-${item.value}`} className="flex justify-between">
                      <span className="font-medium">{item.value}</span>
                      <span>
                        {item.count} ({item.percentage}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No categorical features detected.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Sample Records (first 5 rows)</h4>
        {sampleRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {Object.keys(sampleRows[0]).map((key) => (
                    <th key={key} className="px-4 py-2 font-semibold text-gray-600">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, idx) => (
                  <tr key={`sample-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {Object.values(row).map((value, cellIdx) => (
                      <td key={`cell-${idx}-${cellIdx}`} className="px-4 py-2 text-gray-600">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sample preview unavailable.</p>
        )}
      </div>
    </div>
  );
};

export default DatasetInsights;

