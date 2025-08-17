# Weather App Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the backend root with your API keys:
   ```env
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   YOUTUBE_API_KEY=your_youtube_api_key # (optional)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key # (optional)
   ```
3. Start the server:
   ```bash
   node server.js
   ```

## Endpoints

- `/api/weather` - Get current weather and 5-day forecast
- `/api/queries` - CRUD for weather queries/results
- `/api/export` - Export data (CSV/JSON)

## Database

- SQLite file at `db/database.sqlite`
