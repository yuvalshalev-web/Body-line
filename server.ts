import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/test-weather", async (req, res) => {
    res.json({ status: "test ok" });
  });

  app.get("/api/ocean-data", async (req, res) => {
    try {
      const lat = 32.16;
      const lng = 34.84;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=sea_surface_temperature&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch ocean data");
      const data = await response.json();
      res.json({ temp: data.current.sea_surface_temperature });
    } catch (err) {
      console.error("Ocean data fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch ocean data" });
    }
  });

  app.get("/api/ocean-data/historical", async (req, res) => {
    try {
      const { start, end } = req.query;
      const lat = 32.16;
      const lng = 34.84;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&start_date=${start}&end_date=${end}&hourly=sea_surface_temperature&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch historical ocean data");
      const data = await response.json();
      res.json({ hourly: { time: data.hourly.time, sea_surface_temperature: data.hourly.sea_surface_temperature } });
    } catch (err) {
      console.error("Historical ocean data fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch historical ocean data" });
    }
  });

  app.get("/api/coastal-weather", async (req, res) => {
    try {
      const lat = 32.16;
      const lng = 34.84;
      
      // Fetch Marine Data (Wave Height, Water Temp)
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,sea_surface_temperature&timezone=auto`;
      
      // Fetch Weather Data (Wind, UV Index)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl),
        fetch(weatherUrl)
      ]);

      if (!marineRes.ok) {
        const text = await marineRes.text();
        console.error("Marine API fetch failed:", marineRes.status, text);
        throw new Error(`Marine API fetch failed: ${marineRes.status}`);
      }
      if (!weatherRes.ok) {
        const text = await weatherRes.text();
        console.error("Weather API fetch failed:", weatherRes.status, text);
        throw new Error(`Weather API fetch failed: ${weatherRes.status}`);
      }

      const marineData = await marineRes.json();
      const weatherData = await weatherRes.json();

      if (!marineData.current || !weatherData.current) {
        console.error("Marine or Weather API returned no current data");
        throw new Error("No current data available");
      }

      const result = {
        waterTemp: marineData.current.sea_surface_temperature,
        waveHeight: marineData.current.wave_height,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        uvIndex: weatherData.current.uv_index,
        timestamp: marineData.current.time,
        location: "חוף מרכז",
        source: "IMS / Open-Meteo"
      };

      res.json(result);
    } catch (err) {
      console.error("Coastal weather fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch coastal weather" });
    }
  });

  // Global error tracking for "Sea Observation"
  let totalRequests = 0;
  let errorRequests = 0;
  const requestHistory: { timestamp: number; isError: boolean }[] = [];

  // Middleware to track requests and errors
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      totalRequests++;
      const isError = res.statusCode >= 400;
      if (isError) errorRequests++;
      
      requestHistory.push({ timestamp: Date.now(), isError });
      
      // Keep only last 1000 requests for the rate calculation
      if (requestHistory.length > 1000) requestHistory.shift();
    });
    next();
  });

  // Module C: System & Infrastructure
  app.get("/api/stats/system", (req, res) => {
    // Calculate real error rate from history (last 1 hour or last 1000 requests)
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentRequests = requestHistory.filter(r => r.timestamp > oneHourAgo);
    
    let calculatedErrorRate = 0;
    if (recentRequests.length > 0) {
      const recentErrors = recentRequests.filter(r => r.isError).length;
      calculatedErrorRate = recentErrors / recentRequests.length;
    } else {
      // Fallback to a very low baseline if no traffic yet
      calculatedErrorRate = 0.001; 
    }

    // System data - using real request counts where possible
    const data = {
      visitors: {
        daily: totalRequests,
        weekly: totalRequests // Placeholder for weekly
      },
      dbSize: 0, // Real-time DB size not available via client SDK
      storageSize: 0, // Real-time storage size not available via client SDK
      errorRate: calculatedErrorRate,
      traffic: [
        { time: '00:00', value: 0 },
        { time: '04:00', value: 0 },
        { time: '08:00', value: 0 },
        { time: '12:00', value: 0 },
        { time: '16:00', value: 0 },
        { time: '20:00', value: totalRequests },
      ],
      performance: {
        server: 100,
        db: 100
      }
    };
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
