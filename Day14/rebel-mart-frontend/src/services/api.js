import axios from "axios";
import { API_URL } from "../lib/constants";

const api = axios.create({ baseURL: API_URL, timeout: 20000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rebel_mart_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("rebel_mart_token");
    localStorage.removeItem("rebel_mart_user");
    window.dispatchEvent(new Event("rebel-auth-expired"));
  }
  return Promise.reject(error);
});
export default api;
