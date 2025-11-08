import axios from "axios";

export const API_URL = "http://127.0.0.1:8000"; // FastAPI backend URL

export const uploadDataset = (formData) => {
  return axios.post(`${API_URL}/load/upload-dataset`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const loadDefaultDataset = (name) => {
  return axios.post(`${API_URL}/load/load-default-dataset`, { name });
};

export const startOptimization = (params) => {
  return axios.post(`${API_URL}/optimize/start-optimization`, params);
};

export const getDefaultDatasets = () => {
  return axios.get(`${API_URL}/getDefault/default-datasets`);
};

export const getModelDownloadUrl = (modelId) =>
  `${API_URL}/optimize/download-model/${modelId}`;
