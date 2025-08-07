import React from "react";

const ConfusionMatrix = ({ yTrue, yPred }) => {
  const labels = Array.from(new Set([...yTrue, ...yPred])).sort();
  const matrix = labels.map((actual) =>
    labels.map(
      (predicted) =>
        yTrue.filter((val, i) => val === actual && yPred[i] === predicted)
          .length
    )
  );

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-max table-auto border-collapse border border-gray-300 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">
              Actual \ Predicted
            </th>
            {labels.map((label) => (
              <th
                key={`pred-${label}`}
                className="border border-gray-300 px-4 py-2 font-semibold text-gray-700"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((actual, rowIndex) => (
            <tr
              key={`row-${actual}`}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-800">
                {actual}
              </td>
              {matrix[rowIndex].map((count, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="border border-gray-300 px-4 py-2 text-center"
                >
                  {count}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConfusionMatrix;
