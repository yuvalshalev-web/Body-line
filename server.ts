import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    // Mocking system data
    const data = {
      visitors: {
        daily: 120,
        weekly: 850
      },
      dbSize: 4.2, // MB
      storageSize: 156.4, // MB
      errorRate: 0.02, // 2%
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
