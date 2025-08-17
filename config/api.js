// API Configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-backend-url.com"
    : "http://localhost:3001";

export const API_ENDPOINTS = {
  WEATHER: `${API_BASE_URL}/api/weather`,
  QUERIES: `${API_BASE_URL}/api/queries`,
  YOUTUBE: `${API_BASE_URL}/api/youtube`,
  MAPS: `${API_BASE_URL}/api/maps`,
  EXPORT: {
    CSV: `${API_BASE_URL}/api/export/csv`,
    JSON: `${API_BASE_URL}/api/export/json`,
  },
};

export default API_BASE_URL;
