import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const RocCurveChart = ({ roc }) => {
  if (!roc?.fpr || !roc?.tpr) return null;

  const data = roc.fpr.map((fprValue, idx) => {
    const fprRounded = Number(Number(fprValue).toFixed(4));
    return {
      fpr: fprRounded,
      tpr: Number(Number(roc.tpr[idx]).toFixed(4)),
      baseline: fprRounded,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        ROC Curve {roc.auc ? `(AUC: ${roc.auc.toFixed(4)})` : ""}
      </h3>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="fpr"
              type="number"
              domain={[0, 1]}
              label={{ value: "False Positive Rate", position: "insideBottom", fill: "#4b5563" }}
              tick={{ fill: "#4b5563" }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: "#4b5563" }}
              tick={{ fill: "#4b5563" }}
            />
            <Tooltip formatter={(value) => value.toFixed(4)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#9ca3af"
              strokeDasharray="4 4"
              dot={false}
              name="Chance"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tpr"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="ROC Curve"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RocCurveChart;

