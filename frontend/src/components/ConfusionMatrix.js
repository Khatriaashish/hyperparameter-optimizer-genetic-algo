import React, { useMemo } from "react";

const ConfusionMatrix = ({ yTrue = [], yPred = [] }) => {
  const { labels, matrix, maxValue } = useMemo(() => {
    const uniqueLabels = Array.from(new Set([...yTrue, ...yPred])).sort();
    const computedMatrix = uniqueLabels.map((actual) =>
      uniqueLabels.map(
        (predicted) =>
          yTrue.filter((val, i) => val === actual && yPred[i] === predicted)
            .length
      )
    );
    const maxCellValue = Math.max(
      computedMatrix.flat().reduce((acc, val) => Math.max(acc, val), 0),
      1
    );

    return {
      labels: uniqueLabels,
      matrix: computedMatrix,
      maxValue: maxCellValue,
    };
  }, [yTrue, yPred]);

  if (!labels.length) {
    return null;
  }

  const getIntensity = (value) => {
    const ratio = value / maxValue;
    return `rgba(79, 70, 229, ${0.15 + ratio * 0.75})`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <table className="min-w-max table-auto text-sm text-center border-separate border-spacing-0 w-full">
          <thead>
            <tr>
              <th className="bg-gray-50 border border-gray-200 px-4 py-2 text-gray-600">
                Actual \ Predicted
              </th>
              {labels.map((label) => (
                <th
                  key={`pred-${label}`}
                  className="bg-gray-50 border border-gray-200 px-4 py-2 text-gray-600"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((actual, rowIndex) => (
              <tr key={`row-${actual}`}>
                <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700 bg-gray-50">
                  {actual}
                </td>
                {matrix[rowIndex].map((count, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="border border-gray-200 px-4 py-3 font-semibold text-white"
                    style={{
                      backgroundColor: getIntensity(count),
                    }}
                  >
                    {count}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
