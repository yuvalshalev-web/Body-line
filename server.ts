import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import Parser from 'rss-parser';
import { finalizeThursdaySession as finalizeThursdaySessionService } from "./services/rolloverService.js";
import { getDb } from "./services/firebase.js";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";

const parser = new Parser();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cron job: Every Thursday at 07:01
  cron.schedule('1 7 * * 4', async () => {
    console.log('Running scheduled Rollover...');
    const db = getDb();
    
    // Fetch weeklyHistory and yearConfig for the service
    const historySnap = await getDocs(query(collection(db, 'weekly_history'), orderBy('timestamp', 'desc'), limit(100)));
    const weeklyHistory = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const configSnap = await getDocs(collection(db, 'site_config'));
    const configData = configSnap.docs[0]?.data() as any;
    const yearConfig = configData?.yearConfig || null;

    try {
      await finalizeThursdaySessionService(weeklyHistory, yearConfig);
      console.log('Rollover completed successfully.');
    } catch (e) {
      console.error('Rollover failed:', e);
    }
  });

  app.use(express.json());

  // API Route to fetch news
  app.get("/api/news", async (req, res) => {
    const feeds = [
      { url: 'https://www.surfline.com/rss/news', name: 'Surfline' },
      { url: 'https://www.worldsurfleague.com/rss/news', name: 'WSL' },
      { url: 'https://www.surfer.com/feed', name: 'Surfer' },
      { url: 'https://stabmag.com/feed', name: 'Stab' },
      { url: 'https://www.theinertia.com/feed', name: 'The Inertia' }
    ];

    const results: any[] = [];
    
    for (const feed of feeds) {
      try {
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Status code ${response.status}`);
        }

        const xml = await response.text();
        const feedData = await parser.parseString(xml);
        
        const articles = feedData.items.map((item: any) => ({
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || '',
          url: item.link,
          urlToImage: item.enclosure?.url || item.image?.url || '',
          publishedAt: item.pubDate,
          source: feed.name,
          content: item.content || ''
        }));
        results.push(...articles);
      } catch (err) {
        console.error(`Feed ${feed.name} failed:`, err);
      }
    }
    
    res.json(results);
  });

  // API Route to fetch ocean data (water temp)
  app.get("/api/ocean-data", async (req, res) => {
    console.log("Fetching ocean data...");
    try {
      // Using Open-Meteo Marine API for reliable coastal data in Israel (Herzliya area)
      const lat = 32.16;
      const lng = 34.84;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=sea_surface_temperature&timezone=auto&forecast_days=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch from Open-Meteo");
      
      const data = await response.json();
      
      // Extract hourly data for the chart
      const hourly = data.hourly;
      const chartData = hourly.time.map((time: string, index: number) => ({
        time: new Date(time).getHours() + ":00",
        temp: hourly.sea_surface_temperature[index]
      })).slice(0, 24); // Last 24 hours

      res.json({
        currentTemp: hourly.sea_surface_temperature[0],
        chartData,
        source: "Open-Meteo (IMS Sync)"
      });
    } catch (err) {
      console.error("Ocean data fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch ocean data" });
    }
  });

  app.get("/api/ocean-data/historical", async (req, res) => {
    console.log("Fetching historical ocean data...", req.query);
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: "Start and end dates required" });
      }

      const lat = 32.16;
      const lng = 34.84;
      // Note: Open-Meteo Marine API supports historical data via the same endpoint if dates are in the past
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=sea_surface_temperature&start_date=${start}&end_date=${end}&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch historical data");
      
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Historical ocean data fetch failed:", err);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  // API Route for the new Coastal Dashboard (Central Coast)
  app.get("/api/coastal-weather", async (req, res) => {
    try {
      const lat = 32.16;
      const lng = 34.84;
      
      // Fetch Marine Data (Wave Height, Water Temp)
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,sea_surface_temperature&timezone=auto`;
      
      // Fetch Weather Data (Wind, UV Index)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl, { headers: { 'User-Agent': 'SurferApp/1.0' } }),
        fetch(weatherUrl, { headers: { 'User-Agent': 'SurferApp/1.0' } })
      ]);

      if (!marineRes.ok || !weatherRes.ok) throw new Error("Failed to fetch coastal data");

      const marineData = await marineRes.json();
      const weatherData = await weatherRes.json();

      res.json({
        waterTemp: marineData.current.sea_surface_temperature,
        waveHeight: marineData.current.wave_height,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        uvIndex: weatherData.current.uv_index,
        timestamp: marineData.current.time,
        location: "חוף מרכז",
        source: "IMS / Open-Meteo"
      });
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

  // API Routes for Statistics Center "Sea Observation"
  
  // Module A: Community Pulse
  app.get("/api/stats/community", (req, res) => {
    // Mocking community data for now
    // In a real app, this would query Firestore
    const data = {
      heatmap: Array.from({ length: 52 }, (_, i) => ({
        week: i + 1,
        days: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20))
      })),
      growth: [
        { month: 'Jan', new: 10, veterans: 50 },
        { month: 'Feb', new: 15, veterans: 55 },
        { month: 'Mar', new: 8, veterans: 65 },
        { month: 'Apr', new: 20, veterans: 70 },
      ],
      venn: {
        surfing: 80,
        social: 60,
        overlap: 40
      }
    };
    res.json(data);
  });

  // Module B: Personal User Insights
  app.get("/api/stats/user/:id", (req, res) => {
    const { id } = req.params;
    // Mocking user data
    const data = {
      userId: id,
      attendance: {
        sea: 42,
        social: 12
      },
      streak: 5,
      rank: "Local", // Rookie, Local, Legend
      gritScore: 88,
      totalSessions: 54,
      attendancePercent: 92,
      isTop10: true,
      joiningDate: "01/09/2023",
      ageGroup: "U18",
      progress: [
        { name: 'Sea', value: 75, color: '#006994' },
        { name: 'Social', value: 40, color: '#40E0D0' }
      ]
    };
    res.json(data);
  });

  // Get all members attendance for percentile calculation
  app.get("/api/stats/community/attendance", (req, res) => {
    // Mocking a list of attendance counts for all members
    // In a real app, this would be a query like:
    // db.collection('users').get().then(snap => snap.docs.map(d => d.data().totalSessions))
    const counts = Array.from({ length: 150 }, () => Math.floor(Math.random() * 100));
    // Ensure the current user's count is in there or similar
    res.json({ counts });
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

    // Mocking other system data
    const data = {
      visitors: {
        daily: 120 + Math.floor(Math.random() * 10),
        weekly: 850
      },
      dbSize: 4.2 + (Math.random() * 0.1), // MB
      storageSize: 156.4, // MB
      errorRate: calculatedErrorRate,
      traffic: [
        { time: '00:00', value: 10 },
        { time: '04:00', value: 5 },
        { time: '08:00', value: 45 },
        { time: '12:00', value: 80 },
        { time: '16:00', value: 110 },
        { time: '20:00', value: 60 },
      ],
      performance: {
        server: 94,
        db: 88
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
