import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ResidualsChart = ({ residuals }) => {
  if (!residuals?.values?.length) return null;

  const formatNumber = (val) =>
    typeof val === "number" ? Number(val.toFixed(4)) : val;

  const data = residuals.values.map((value, idx) => ({
    index: idx + 1,
    residual: formatNumber(value),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Residual Diagnostics</h3>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="index"
              tick={{ fill: "#4b5563" }}
              label={{ value: "Sample Index", position: "insideBottom", fill: "#4b5563" }}
            />
            <YAxis
              tick={{ fill: "#4b5563" }}
              label={{ value: "Residual", angle: -90, position: "insideLeft", fill: "#4b5563" }}
            />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Area type="monotone" dataKey="residual" stroke="#6366f1" fill="rgba(99, 102, 241, 0.3)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Mean residual:{" "}
          <span className="font-semibold text-gray-800">
            {formatNumber(residuals.mean)}
          </span>
        </p>
        <p>
          Std. dev residual:{" "}
          <span className="font-semibold text-gray-800">
            {formatNumber(residuals.std)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ResidualsChart;

