const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware - CORS configuration for development and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  process.env.FRONTEND_URL, // Production frontend URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Allow any localhost origin or production origins
      if (origin.includes("localhost") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow render.com domains
      if (origin.includes(".onrender.com")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

app.use(express.json());

// SQLite DB setup - Create db directory if it doesn't exist
const dbDir = path.join(__dirname, "db");
if (!require("fs").existsSync(dbDir)) {
  require("fs").mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create table for weather queries if not exists
const createTable = `CREATE TABLE IF NOT EXISTS weather_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT NOT NULL,
  date_from TEXT,
  date_to TEXT,
  weather_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
db.run(createTable);

// Helper: Validate date range
function validateDateRange(dateFrom, dateTo) {
  if (!dateFrom || !dateTo)
    return { valid: false, error: "Both dates are required" };

  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const now = new Date();

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (from > to) {
    return { valid: false, error: "Start date must be before end date" };
  }

  if (to > now) {
    return { valid: false, error: "End date cannot be in the future" };
  }

  return { valid: true };
}

// Helper: Get coordinates from location using OpenWeatherMap Geocoding
async function getCoordinatesFromLocation(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  try {
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      location
    )}&limit=1&appid=${apiKey}`;
    const response = await axios.get(geocodeUrl);

    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      return {
        lat: place.lat,
        lon: place.lon,
        name: place.name,
        country: place.country,
        state: place.state || null,
        fullName: `${place.name}${place.state ? ", " + place.state : ""}, ${
          place.country
        }`,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Helper: Get location name from coordinates (reverse geocoding)
async function getLocationFromCoordinates(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  try {
    const reverseGeocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const response = await axios.get(reverseGeocodeUrl);

    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        name: place.name,
        country: place.country,
        state: place.state || null,
        fullName: `${place.name}${place.state ? ", " + place.state : ""}, ${
          place.country
        }`,
      };
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

// Helper: Build OpenWeatherMap API URL
function buildWeatherUrl({ location, lat, lon, type }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (lat && lon) {
    return {
      current: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      forecast: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
    };
  } else if (type === "zip") {
    return {
      current: `https://api.openweathermap.org/data/2.5/weather?zip=${location}&appid=${apiKey}&units=metric`,
      forecast: `https://api.openweathermap.org/data/2.5/forecast?zip=${location}&appid=${apiKey}&units=metric`,
    };
  } else {
    // Assume city name or general location
    return {
      current: `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location
      )}&appid=${apiKey}&units=metric`,
      forecast: `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        location
      )}&appid=${apiKey}&units=metric`,
    };
  }
}

// Root endpoint
app.get("/", (req, res) => {
  res.send("Weather App Backend is running");
});

// /api/weather endpoint - Enhanced with database storage
app.post("/api/weather", async (req, res) => {
  try {
    const { location, lat, lon, type, dateFrom, dateTo } = req.body;

    if (!location && (lat === undefined || lon === undefined)) {
      return res
        .status(400)
        .json({ error: "Location or coordinates required." });
    }

    // Validate date range if provided
    if (dateFrom && dateTo) {
      const validation = validateDateRange(dateFrom, dateTo);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    let enhancedLocationInfo = null;

    // If user provided a location name, try to get better coordinates and location info
    if (location && !lat && !lon) {
      enhancedLocationInfo = await getCoordinatesFromLocation(location);
    }
    // If user provided coordinates (GPS), get the location name from coordinates
    else if (lat && lon && !location) {
      enhancedLocationInfo = await getLocationFromCoordinates(lat, lon);
    }

    const urls = buildWeatherUrl({ location, lat, lon, type });

    // Fetch current weather and forecast
    const [currentResp, forecastResp] = await Promise.all([
      axios.get(urls.current),
      axios.get(urls.forecast),
    ]);

    const weatherData = {
      current: currentResp.data,
      forecast: forecastResp.data,
      searchedLocation: location || `${lat},${lon}`, // Keep track of what user searched for
    };

    // Enhance current weather data with better location info
    if (weatherData.current.coord) {
      weatherData.current.coordinates = {
        lat: weatherData.current.coord.lat,
        lon: weatherData.current.coord.lon,
      };
    }

    // Add enhanced location info if available
    if (enhancedLocationInfo) {
      weatherData.current.enhancedLocation = enhancedLocationInfo;
      weatherData.current.displayName = enhancedLocationInfo.fullName;
    }

    // Add timezone info if available
    if (weatherData.current.timezone) {
      weatherData.current.timezoneOffset = weatherData.current.timezone;
    }

    // Store in database
    const insertQuery = `INSERT INTO weather_queries (location, date_from, date_to, weather_data) VALUES (?, ?, ?, ?)`;
    db.run(insertQuery, [
      location || `${lat},${lon}`,
      dateFrom || null,
      dateTo || null,
      JSON.stringify(weatherData),
    ]);

    res.json(weatherData);
  } catch (err) {
    if (err.response && err.response.data) {
      res
        .status(err.response.status)
        .json({ error: err.response.data.message });
    } else {
      res.status(500).json({ error: "Failed to fetch weather data." });
    }
  }
});

// CRUD Operations for weather queries

// CREATE - Already handled in /api/weather

// READ - Get all weather queries
app.get("/api/queries", (req, res) => {
  const query = `SELECT * FROM weather_queries ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch queries" });
    } else {
      const queries = rows.map((row) => ({
        ...row,
        weather_data: JSON.parse(row.weather_data),
      }));
      res.json(queries);
    }
  });
});

// READ - Get specific weather query
app.get("/api/queries/:id", (req, res) => {
  const query = `SELECT * FROM weather_queries WHERE id = ?`;
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch query" });
    } else if (!row) {
      res.status(404).json({ error: "Query not found" });
    } else {
      res.json({
        ...row,
        weather_data: JSON.parse(row.weather_data),
      });
    }
  });
});

// UPDATE - Update weather query
app.put("/api/queries/:id", async (req, res) => {
  try {
    const { location, dateFrom, dateTo } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }

    // Validate date range if provided
    if (dateFrom && dateTo) {
      const validation = validateDateRange(dateFrom, dateTo);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Fetch new weather data
    const urls = buildWeatherUrl({ location });
    const [currentResp, forecastResp] = await Promise.all([
      axios.get(urls.current),
      axios.get(urls.forecast),
    ]);

    const weatherData = {
      current: currentResp.data,
      forecast: forecastResp.data,
    };

    const updateQuery = `UPDATE weather_queries SET location = ?, date_from = ?, date_to = ?, weather_data = ? WHERE id = ?`;
    db.run(
      updateQuery,
      [
        location,
        dateFrom || null,
        dateTo || null,
        JSON.stringify(weatherData),
        req.params.id,
      ],
      function (err) {
        if (err) {
          res.status(500).json({ error: "Failed to update query" });
        } else if (this.changes === 0) {
          res.status(404).json({ error: "Query not found" });
        } else {
          res.json({ message: "Query updated successfully", weatherData });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to update weather data" });
  }
});

// DELETE - Delete weather query
app.delete("/api/queries/:id", (req, res) => {
  const deleteQuery = `DELETE FROM weather_queries WHERE id = ?`;
  db.run(deleteQuery, [req.params.id], function (err) {
    if (err) {
      res.status(500).json({ error: "Failed to delete query" });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Query not found" });
    } else {
      res.json({ message: "Query deleted successfully" });
    }
  });
});

// Data Export endpoints
app.get("/api/export/csv", (req, res) => {
  const query = `SELECT * FROM weather_queries ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      const csv = [
        "ID,Location,Date From,Date To,Temperature,Weather,Created At",
        ...rows.map((row) => {
          const weather = JSON.parse(row.weather_data);
          return `${row.id},${row.location},${row.date_from || ""},${
            row.date_to || ""
          },${weather.current.main.temp}°C,${weather.current.weather[0].main},${
            row.created_at
          }`;
        }),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=weather_queries.csv"
      );
      res.send(csv);
    }
  });
});

app.get("/api/export/json", (req, res) => {
  const query = `SELECT * FROM weather_queries ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      const data = rows.map((row) => ({
        ...row,
        weather_data: JSON.parse(row.weather_data),
      }));

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=weather_queries.json"
      );
      res.json(data);
    }
  });
});

// YouTube Integration
app.get("/api/youtube/:location", async (req, res) => {
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return res.json({
        videos: [],
        message: "YouTube API key not configured",
      });
    }

    const searchQuery = `${req.params.location} travel guide`;
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery
    )}&type=video&maxResults=5&key=${youtubeApiKey}`;

    const response = await axios.get(youtubeUrl);
    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json({ videos });
  } catch (err) {
    console.error("YouTube API Error:", err);
    res.json({ videos: [], error: "Failed to fetch YouTube videos" });
  }
});

// Google Maps Integration
app.get("/api/maps/:location", async (req, res) => {
  try {
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!mapsApiKey) {
      return res.json({
        map: null,
        message: "Google Maps API key not configured",
      });
    }

    // Geocoding to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      req.params.location
    )}&key=${mapsApiKey}`;
    const response = await axios.get(geocodeUrl);

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${location.lat},${location.lng}&zoom=12`;

      res.json({
        map: {
          embedUrl,
          lat: location.lat,
          lng: location.lng,
          address: response.data.results[0].formatted_address,
        },
      });
    } else {
      res.json({ map: null, error: "Location not found" });
    }
  } catch (err) {
    console.error("Google Maps API Error:", err);
    res.json({ map: null, error: "Failed to fetch map data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
