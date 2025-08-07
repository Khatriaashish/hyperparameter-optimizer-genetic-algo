import React, { useState, useEffect } from "react";
import { getDefaultDatasets, loadDefaultDataset, uploadDataset } from "../api";

const DatasetSelector = ({ setDatasetColumns }) => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDefaultDatasets()
      .then((response) => setDatasets(response.data.datasets))
      .catch((error) => console.error("Error fetching datasets:", error));
  }, []);

  const isCSV = (file) =>
    (file && file.type === "text/csv") || file.name.endsWith(".csv");

  const handleFileSelect = (file) => {
    if (!isCSV(file)) {
      setError("Only CSV files are allowed.");
      return;
    }
    setError("");
    setFile(file);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFileSelect(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = () => setDragActive(true);
  const handleDragLeave = () => setDragActive(false);

  const handleUpload = () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      uploadDataset(formData)
        .then((response) => setDatasetColumns(response.data.columns))
        .catch((error) => console.error("Error uploading dataset:", error));
    }
  };

  const handleDefaultDatasetLoad = () => {
    loadDefaultDataset(selectedDataset)
      .then((response) => setDatasetColumns(response.data.columns))
      .catch((error) => console.error("Error loading default dataset:", error));
  };

  useEffect(() => {
    if (selectedDataset.length > 0) handleDefaultDatasetLoad();
  }, [selectedDataset]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Select Dataset
      </h2>

      {/* Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Upload your dataset (CSV)
        </h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-md p-6 text-center transition ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          <p className="text-gray-500 mb-2">
            Drag & drop your CSV file here or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
          >
            Browse File
          </label>
          {file && (
            <p className="text-sm text-green-700 mt-2">Selected: {file.name}</p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={handleUpload}
            className={`px-4 py-2 rounded transition ${
              file
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!file}
          >
            Upload Dataset
          </button>
        </div>
      </div>

      {/* Default Dataset Selector */}

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          Or select a default dataset
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {datasets.map((dataset, index) => (
            <div
              key={index}
              className={`p-4 text-center border rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                selectedDataset === dataset
                  ? "bg-indigo-100 border-indigo-500 ring-2 ring-indigo-400"
                  : "hover:bg-indigo-50"
              }`}
              onClick={() => setSelectedDataset(dataset)}
            >
              <span className="text-indigo-700 font-medium">{dataset}</span>
            </div>
          ))}
        </div>

        {/* <div className="mt-4 text-center">
          <button
            onClick={handleDefaultDatasetLoad}
            disabled={!selectedDataset}
            className={`px-6 py-2 rounded mt-2 transition font-semibold text-sm ${
              selectedDataset
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            🚀 Load Dataset
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default DatasetSelector;
