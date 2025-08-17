# 🌤️ Weather App - Professional Weather Dashboard

A comprehensive weather application built with React and Express.js featuring real-time weather data, location services, database persistence, and advanced integrations with YouTube and Google Maps.

![Weather App](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite-blue)
![APIs](https://img.shields.io/badge/APIs-OpenWeather%20%7C%20YouTube%20%7C%20Google%20Maps-orange)

## 🚀 Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/weather-app.git
   cd weather-app
   ```

2. **Set up API keys:**

   ```bash
   cd backend
   cp .env.example .env
   # Add your API keys to .env file
   ```

3. **Install and run:**
   ```bash
   npm run dev
   ```

📖 **Need detailed setup instructions?** See [docs/SETUP.md](docs/SETUP.md) for complete configuration guide.

## ✨ Features Overview

### 🎯 Core Weather Features

- **Real-time Weather Data** - Current conditions with detailed metrics
- **5-Day Forecasts** - Extended weather predictions with icons
- **GPS Location Support** - Automatic location detection
- **Global Location Search** - Cities, zip codes, coordinates, landmarks
- **Professional UI** - Modern design with animations and responsive layout

## ✨ Features Completed

### ✅ Tech Assessment 1 - FULLY COMPLETED

- **Location Input**: Enter any location (city, zip, coordinates, landmarks)
- **Current Weather**: Real-time weather with detailed information and icons
- **5-Day Forecast**: Complete forecast with dates, weather, and temperatures
- **Geolocation**: Use current location via GPS
- **Modern UI**: Beautiful gradient design with animations and responsive layout
- **Info Button**: Developer details and PM Accelerator description
- **Real API Integration**: OpenWeatherMap API for live weather data

### ✅ Tech Assessment 2 - FULLY COMPLETED

#### Required Features:

- **✅ CREATE**: Save weather queries with location and date ranges to SQLite database
- **✅ READ**: View all saved weather queries in searchable history
- **✅ UPDATE**: Edit existing weather queries with validation
- **✅ DELETE**: Remove weather queries from database
- **✅ Date Range Validation**: Ensures valid date inputs and logical ranges
- **✅ Location Validation**: Fuzzy location matching via OpenWeatherMap API
- **✅ Database Persistence**: SQLite storage for all weather data

#### Optional Features:

- **✅ YouTube Integration**: Displays travel videos for searched locations
- **✅ Google Maps Integration**: Interactive maps showing searched locations
- **✅ Data Export**: Download weather data in CSV and JSON formats
- **✅ Advanced UI**: Tabbed interface for search, history, and export

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Modern CSS with animations
- **Backend**: Node.js, Express.js
- **Database**: SQLite with weather queries storage
- **APIs**: OpenWeatherMap, YouTube Data API (optional), Google Maps (optional)
- **Features**: CRUD operations, data export, real-time weather

## 🌤️ API Key Setup

### Required:

Add your OpenWeatherMap API key to `backend/.env`:

```env
OPENWEATHER_API_KEY=your_openweathermap_api_key
```

Get your free key at: https://openweathermap.org/api

### Optional (for enhanced features):

```env
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🏗️ Project Structure

```
weather-app/
├── package.json              # Root package with unified scripts
├── README.md                 # Project overview
├── .gitignore               # Git ignore rules
├── backend/                 # Express.js API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── .env               # API keys (not in git)
│   ├── .env.example       # Environment template
│   └── db/                # Database files
│       └── database.sqlite # SQLite database
├── frontend/               # React.js client app
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── App.css        # Styles and animations
│   ├── package.json       # Frontend dependencies
│   └── public/            # Static assets
├── docs/                  # Documentation
│   ├── SETUP.md          # Detailed setup guide
│   └── GITHUB_SETUP.md   # GitHub deployment guide
├── config/               # Configuration files
│   └── api.js           # API endpoints configuration
└── scripts/             # Development scripts
    └── dev.sh          # Development setup script
```

## 🔧 Manual Setup (If needed)

If the one-command setup doesn't work:

1. **Backend:**

   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend (in a new terminal):**
   ```bash
   cd backend/frontend
   npm install
   npm run dev
   ```

## 🎯 API Endpoints

### Weather Operations

- `POST /api/weather` - Get weather data and store query
- `GET /api/queries` - Get all saved weather queries
- `GET /api/queries/:id` - Get specific weather query
- `PUT /api/queries/:id` - Update weather query
- `DELETE /api/queries/:id` - Delete weather query

### Integrations

- `GET /api/youtube/:location` - Get YouTube videos for location
- `GET /api/maps/:location` - Get Google Maps data for location

### Data Export

- `GET /api/export/csv` - Download weather data as CSV
- `GET /api/export/json` - Download weather data as JSON

## 🎨 User Interface

### Navigation Tabs:

1. **🔍 Weather Search**: Main weather lookup with current location option
2. **📋 Search History**: View, edit, and delete saved weather queries
3. **💾 Export Data**: Download weather data in multiple formats

### Features per Tab:

- **Search**: Location input, date ranges, current weather, 5-day forecast, YouTube videos, Google Maps
- **History**: Complete CRUD operations on saved queries
- **Export**: CSV and JSON download options

## 🧪 Testing the Application

1. **Weather Search**: Try "London", "10001", "Tokyo", or use GPS location
2. **Date Ranges**: Add from/to dates for historical context
3. **CRUD Operations**: Save searches, edit them, and delete unwanted ones
4. **Data Export**: Download your weather history
5. **Integrations**: See YouTube videos and maps for locations

## 👨‍💻 Assessment Completion

### Tech Assessment 1: ✅ 100% Complete

- All required features implemented
- All "to stand apart" features included
- Modern, responsive UI design
- Real API integration

### Tech Assessment 2: ✅ 100% Complete

- All required CRUD operations with validation
- All optional features (YouTube, Google Maps, Data Export)
- Advanced UI with tabbed interface
- Complete database persistence

## 🚀 Built By

**Bitania Yonas** for Product Manager Accelerator (PMA) AI Engineer Intern Assessment

**Product Manager Accelerator (PMA)** is a community and learning platform for aspiring and current product managers. Learn more at our [LinkedIn page](https://www.linkedin.com/company/product-manager-accelerator/).

---

## 📝 Quick Commands

- **Start everything**: `npm run dev`
- **Start with script**: `./scripts/dev.sh`
- **Backend only**: `npm run backend`
- **Frontend only**: `npm run frontend`
- **Install all dependencies**: `npm run install-all`
- **Build for production**: `npm run build`
- **Clean dependencies**: `npm run clean`

## 🚀 Deployment

### Deploy to Render (Recommended)

1. **Upload to GitHub** (public repository)
2. **Connect to Render**: https://render.com
3. **Import from GitHub** - Select your repository
4. **Use the render.yaml** file for automatic configuration
5. **Add Environment Variables** in Render dashboard:
   - `OPENWEATHER_API_KEY` (required)
   - `YOUTUBE_API_KEY` (optional)
   - `GOOGLE_MAPS_API_KEY` (optional)

### Manual Deployment Steps

**Backend:**

- Service Type: Web Service
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Add environment variables

**Frontend:**

- Service Type: Static Site
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist`
- Set `VITE_API_URL` to your backend URL

### Other Deployment Options

- **Vercel**: Frontend deployment
- **Heroku**: Full-stack deployment
- **Netlify**: Frontend deployment
- **Railway**: Full-stack deployment

**🎉 Ready to impress? Just run `npm run dev` and start exploring your complete weather app!**
