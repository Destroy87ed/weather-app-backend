// Environment Configuration
const environments = {
  development: {
    API_BASE_URL: "http://localhost:3001",
    FRONTEND_URL: "http://localhost:5173",
    NODE_ENV: "development",
    LOG_LEVEL: "debug",
  },
  production: {
    API_BASE_URL: process.env.API_BASE_URL || "https://your-weather-app.com",
    FRONTEND_URL: process.env.FRONTEND_URL || "https://your-weather-app.com",
    NODE_ENV: "production",
    LOG_LEVEL: "error",
  },
  test: {
    API_BASE_URL: "http://localhost:3001",
    FRONTEND_URL: "http://localhost:5173",
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
  },
};

const currentEnv = process.env.NODE_ENV || "development";
const config = environments[currentEnv];

export default config;
export { environments };
