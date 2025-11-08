import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ResultChart = ({ generationScores = [], generationDetails = [] }) => {
  const chartData = useMemo(() => {
    if (generationDetails.length) {
      return generationDetails.map((detail) => ({
        generation: detail.generation,
        best: detail.best_score,
        average: detail.average_score,
        median: detail.median_score,
      }));
    }

    return generationScores.map((score, index) => ({
      generation: index + 1,
      best: score,
    }));
  }, [generationScores, generationDetails]);

  const latestGeneration =
    generationDetails.length > 0
      ? generationDetails[generationDetails.length - 1]
      : null;

  const hasAverage = chartData.some((item) => item.average !== null && item.average !== undefined);
  const hasMedian = chartData.some((item) => item.median !== null && item.median !== undefined);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Genetic Algorithm Search Trajectory
        </h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                  value: "Fitness Score",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6B7280",
                }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", borderColor: "#ccc" }}
                labelStyle={{ color: "#6B7280" }}
                itemStyle={{ color: "#4B5563" }}
                formatter={(value) => (value !== null && value !== undefined ? value.toFixed(4) : "—")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="best"
                stroke="#4F46E5"
                strokeWidth={2}
                name="Best"
                dot={false}
              />
              {hasAverage && (
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Average"
                  dot={false}
                />
              )}
              {hasMedian && (
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Median"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {latestGeneration?.top_candidates?.length ? (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Final Generation Leaderboard
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-600">Rank</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Score</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Hyperparameters</th>
                </tr>
              </thead>
              <tbody>
                {latestGeneration.top_candidates.map((candidate, idx) => (
                  <tr
                    key={`candidate-${candidate.rank}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 font-medium text-gray-800">
                      #{candidate.rank}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {candidate.score !== null && candidate.score !== undefined
                        ? candidate.score.toFixed(4)
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(candidate.params || {}).map(([key, value]) => (
                          <span
                            key={`${candidate.rank}-${key}`}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                          >
                            {key}: <span className="ml-1 font-semibold">{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ResultChart;
