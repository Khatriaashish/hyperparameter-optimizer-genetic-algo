import React from "react";
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

const FeatureInsights = ({ data }) => {
  if (!data?.values?.length) return null;

  const isImportance = data.type === "feature_importance";
  const limitedValues = data.values.slice(0, 15);
  const labels = limitedValues.map((item) => item.feature);
  const values = limitedValues.map((item) => (isImportance ? item.importance : item.coefficient));

  const chartData = {
    labels,
    datasets: [
      {
        label: isImportance ? "Relative Importance" : "Coefficient",
        data: values,
        backgroundColor: values.map((value) =>
          value >= 0 ? "rgba(59, 130, 246, 0.8)" : "rgba(244, 63, 94, 0.8)"
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: isImportance ? "Feature Importance Ranking" : "Model Coefficients",
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
      },
    },
  };

  const topFeatures = data.top_features ?? data.values.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Bar data={chartData} options={options} />
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Top Drivers</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {topFeatures.map((item) => (
            <li key={item.feature} className="flex justify-between">
              <span className="font-medium">{item.feature}</span>
              <span>
                {isImportance ? item.importance : item.coefficient}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FeatureInsights;

