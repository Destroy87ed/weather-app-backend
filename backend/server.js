const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const axios = require("axios");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes("localhost") || allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.includes(".onrender.com")) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Weather App API",
      version: "1.0.0",
      description: "API documentation for Weather App Backend",
    },
    servers: [{ url: process.env.BACKEND_URL || `http://localhost:${PORT}` }],
    components: {
      schemas: {
        WeatherData: {
          type: "object",
          properties: {
            current: { type: "object" },
            forecast: { type: "object" },
            searchedLocation: { type: "string" },
          },
        },
        WeatherQuery: {
          type: "object",
          properties: {
            id: { type: "integer" },
            location: { type: "string" },
            date_from: { type: "string" },
            date_to: { type: "string" },
            weather_data: { $ref: "#/components/schemas/WeatherData" },
            created_at: { type: "string" },
          },
        },
        YouTubeVideo: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            thumbnail: { type: "string" },
            url: { type: "string" },
          },
        },
        GoogleMap: {
          type: "object",
          properties: {
            embedUrl: { type: "string" },
            lat: { type: "number" },
            lng: { type: "number" },
            address: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const dbDir = path.join(__dirname, "db");
if (!require("fs").existsSync(dbDir)) require("fs").mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => { if (err) console.error(err); });

const createTable = `CREATE TABLE IF NOT EXISTS weather_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT NOT NULL,
  date_from TEXT,
  date_to TEXT,
  weather_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
db.run(createTable);

function validateDateRange(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return { valid: false, error: "Both dates are required" };
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const now = new Date();
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return { valid: false, error: "Invalid date format" };
  if (from > to) return { valid: false, error: "Start date must be before end date" };
  if (to > now) return { valid: false, error: "End date cannot be in the future" };
  return { valid: true };
}

async function getCoordinatesFromLocation(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  try {
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    const response = await axios.get(geocodeUrl);
    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      return { lat: place.lat, lon: place.lon, name: place.name, country: place.country, state: place.state || null, fullName: `${place.name}${place.state ? ", " + place.state : ""}, ${place.country}` };
    }
    return null;
  } catch { return null; }
}

async function getLocationFromCoordinates(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const response = await axios.get(url);
    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon), name: place.name, country: place.country, state: place.state || null, fullName: `${place.name}${place.state ? ", " + place.state : ""}, ${place.country}` };
    }
    return null;
  } catch { return null; }
}

function buildWeatherUrl({ location, lat, lon, type }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (lat && lon) return { current: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`, forecast: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric` };
  if (type === "zip") return { current: `https://api.openweathermap.org/data/2.5/weather?zip=${location}&appid=${apiKey}&units=metric`, forecast: `https://api.openweathermap.org/data/2.5/forecast?zip=${location}&appid=${apiKey}&units=metric` };
  return { current: `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`, forecast: `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric` };
}

app.get("/", (req, res) => res.send("Weather App Backend is running"));

/**
 * @swagger
 * /api/weather:
 *   post:
 *     summary: Get current weather and 5-day forecast
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *               type:
 *                 type: string
 *               dateFrom:
 *                 type: string
 *               dateTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Weather data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherData'
 */
app.post("/api/weather", async (req, res) => {
  try {
    const { location, lat, lon, type, dateFrom, dateTo } = req.body;
    if (!location && (lat === undefined || lon === undefined)) return res.status(400).json({ error: "Location or coordinates required." });
    if (dateFrom && dateTo) { const validation = validateDateRange(dateFrom, dateTo); if (!validation.valid) return res.status(400).json({ error: validation.error }); }
    let enhancedLocationInfo = null;
    if (location && !lat && !lon) enhancedLocationInfo = await getCoordinatesFromLocation(location);
    else if (lat && lon && !location) enhancedLocationInfo = await getLocationFromCoordinates(lat, lon);
    const urls = buildWeatherUrl({ location, lat, lon, type });
    const [currentResp, forecastResp] = await Promise.all([axios.get(urls.current), axios.get(urls.forecast)]);
    const weatherData = { current: currentResp.data, forecast: forecastResp.data, searchedLocation: location || `${lat},${lon}` };
    if (weatherData.current.coord) weatherData.current.coordinates = { lat: weatherData.current.coord.lat, lon: weatherData.current.coord.lon };
    if (enhancedLocationInfo) { weatherData.current.enhancedLocation = enhancedLocationInfo; weatherData.current.displayName = enhancedLocationInfo.fullName; }
    if (weatherData.current.timezone) weatherData.current.timezoneOffset = weatherData.current.timezone;
    db.run(`INSERT INTO weather_queries (location, date_from, date_to, weather_data) VALUES (?, ?, ?, ?)`, [location || `${lat},${lon}`, dateFrom || null, dateTo || null, JSON.stringify(weatherData)]);
    res.json(weatherData);
  } catch (err) {
    if (err.response && err.response.data) res.status(err.response.status).json({ error: err.response.data.message });
    else res.status(500).json({ error: "Failed to fetch weather data." });
  }
});

/**
 * @swagger
 * /api/queries:
 *   get:
 *     summary: Get all weather queries
 *     responses:
 *       200:
 *         description: List of weather queries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherQuery'
 */
app.get("/api/queries", (req, res) => {
  db.all(`SELECT * FROM weather_queries ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) res.status(500).json({ error: "Failed to fetch queries" });
    else res.json(rows.map((row) => ({ ...row, weather_data: JSON.parse(row.weather_data) })));
  });
});

/**
 * @swagger
 * /api/queries/{id}:
 *   get:
 *     summary: Get a weather query by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Weather query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherQuery'
 */
app.get("/api/queries/:id", (req, res) => {
  db.get(`SELECT * FROM weather_queries WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) res.status(500).json({ error: "Failed to fetch query" });
    else if (!row) res.status(404).json({ error: "Query not found" });
    else res.json({ ...row, weather_data: JSON.parse(row.weather_data) });
  });
});

/**
 * @swagger
 * /api/queries/{id}:
 *   put:
 *     summary: Update a weather query
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *               dateFrom:
 *                 type: string
 *               dateTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated weather query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 weatherData: { $ref: '#/components/schemas/WeatherData' }
 */
app.put("/api/queries/:id", async (req, res) => {
  try {
    const { location, dateFrom, dateTo } = req.body;
    if (!location) return res.status(400).json({ error: "Location is required" });
    if (dateFrom && dateTo) { const validation = validateDateRange(dateFrom, dateTo); if (!validation.valid) return res.status(400).json({ error: validation.error }); }
    const urls = buildWeatherUrl({ location });
    const [currentResp, forecastResp] = await Promise.all([axios.get(urls.current), axios.get(urls.forecast)]);
    const weatherData = { current: currentResp.data, forecast: forecastResp.data };
    db.run(`UPDATE weather_queries SET location = ?, date_from = ?, date_to = ?, weather_data = ? WHERE id = ?`, [location, dateFrom || null, dateTo || null, JSON.stringify(weatherData), req.params.id], function (err) {
      if (err) res.status(500).json({ error: "Failed to update query" });
      else if (this.changes === 0) res.status(404).json({ error: "Query not found" });
      else res.json({ message: "Query updated successfully", weatherData });
    });
  } catch { res.status(500).json({ error: "Failed to update weather data" }); }
});

/**
 * @swagger
 * /api/queries/{id}:
 *   delete:
 *     summary: Delete a weather query
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deletion message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */
app.delete("/api/queries/:id", (req, res) => {
  db.run(`DELETE FROM weather_queries WHERE id = ?`, [req.params.id], function (err) {
    if (err) res.status(500).json({ error: "Failed to delete query" });
    else if (this.changes === 0) res.status(404).json({ error: "Query not found" });
    else res.json({ message: "Query deleted successfully" });
  });
});

/**
 * @swagger
 * /api/export/csv:
 *   get:
 *     summary: Export queries as CSV
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
app.get("/api/export/csv", (req, res) => {
  db.all(`SELECT * FROM weather_queries ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) res.status(500).json({ error: "Failed to fetch data" });
    else {
      const csv = ["ID,Location,Date From,Date To,Temperature,Weather,Created At", ...rows.map((row) => {
        const weather = JSON.parse(row.weather_data);
        return `${row.id},${row.location},${row.date_from || ""},${row.date_to || ""},${weather.current.main.temp}°C,${weather.current.weather[0].main},${row.created_at}`;
      })].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=weather_queries.csv");
      res.send(csv);
    }
  });
});

/**
 * @swagger
 * /api/export/json:
 *   get:
 *     summary: Export queries as JSON
 *     responses:
 *       200:
 *         description: JSON file
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherQuery'
 */
app.get("/api/export/json", (req, res) => {
  db.all(`SELECT * FROM weather_queries ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) res.status(500).json({ error: "Failed to fetch data" });
    else { res.setHeader("Content-Type", "application/json"); res.setHeader("Content-Disposition", "attachment; filename=weather_queries.json"); res.json(rows.map((row) => ({ ...row, weather_data: JSON.parse(row.weather_data) }))); }
  });
});

/**
 * @swagger
 * /api/youtube/{location}:
 *   get:
 *     summary: Get YouTube videos for a location
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YouTubeVideo'
 */
app.get("/api/youtube/:location", async (req, res) => {
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) return res.json({ videos: [], message: "YouTube API key not configured" });
    const searchQuery = `${req.params.location} travel guide`;
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=5&key=${youtubeApiKey}`;
    const response = await axios.get(youtubeUrl);
    const videos = response.data.items.map((item) => ({ id: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium.url, url: `https://www.youtube.com/watch?v=${item.id.videoId}` }));
    res.json({ videos });
  } catch { res.json({ videos: [], error: "Failed to fetch YouTube videos" }); }
});

/**
 * @swagger
 * /api/maps/{location}:
 *   get:
 *     summary: Get Google Maps embed for a location
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Map embed info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 map:
 *                   $ref: '#/components/schemas/GoogleMap'
 */
app.get("/api/maps/:location", async (req, res) => {
  try {
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!mapsApiKey) return res.json({ map: null, message: "Google Maps API key not configured" });
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(req.params.location)}&key=${mapsApiKey}`;
    const response = await axios.get(geocodeUrl);
    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${location.lat},${location.lng}&zoom=12`;
      res.json({ map: { embedUrl, lat: location.lat, lng: location.lng, address: response.data.results[0].formatted_address } });
    } else res.json({ map: null, error: "Location not found" });
  } catch { res.json({ map: null, error: "Failed to fetch map data" }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
