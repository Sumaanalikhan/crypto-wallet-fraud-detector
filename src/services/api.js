import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE
});

export const analyzeWallet = async (payload) => {
  const response = await API.post("/api/analyze", payload);
  return response.data;
};