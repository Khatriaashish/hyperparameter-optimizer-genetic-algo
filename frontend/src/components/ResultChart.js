import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ResultChart = ({ generationScores }) => {
  const data = generationScores.map((score, index) => ({
    generation: index + 1,
    score,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 w-full max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Score per Generation
      </h3>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="generation"
              tick={{ fill: "#4B5563" }}
              label={{
                value: "Generation",
                position: "insideBottomRight",
                offset: -5,
                fill: "#6B7280",
              }}
            />
            <YAxis
              tick={{ fill: "#4B5563" }}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                fill: "#6B7280",
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", borderColor: "#ccc" }}
              labelStyle={{ color: "#6B7280" }}
              itemStyle={{ color: "#4B5563" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#4F46E5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResultChart;
