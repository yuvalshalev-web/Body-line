import express from "express";
import cors from "cors";
import compression from "compression";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server...");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(compression()); // Enable gzip/brotli compression for faster load times
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    const { service, data } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      let responseText = "";

      if (service === "analyzeImage") {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: data.base64Image.split(',')[1] || data.base64Image } },
              { text: "Analyze this image and provide a one-sentence, poetic caption for a community photo gallery." },
            ],
          },
        });
        responseText = response.text || "A beautiful moment captured and shared.";
      } else if (service === "generateBio") {
        const prompt = `Rewrite the following community member's bio to be more professional, engaging, and concise. 
        Name: ${data.name}
        Role: ${data.role}
        Current Bio: ${data.currentBio || 'Member of our community.'}
        Return only the rewritten bio text, one single sentence.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        responseText = response.text || "Dedicated community member contributing to our shared goals.";
      } else if (service === "getShaperConsultation") {
        const prompt = `You are an expert surfboard shaper with 30 years of experience. 
        Provide a professional, encouraging, and highly technical (yet accessible) consultation for a surfer with the following data:
        - Weight: ${data.weight}kg
        - Height: ${data.height}cm
        - Surfing Level: ${data.level}
        - Fitness Level: ${data.fitness}
        ${data.currentBoard ? `- Current Board: ${data.currentBoard.volume}L, ${data.currentBoard.length}` : ''}
        - Recommended Board: ${data.recommendedBoard.volume}L, ${data.recommendedBoard.length} (${data.recommendedBoard.type})
    
        Explain WHY this board is recommended, what they should look for in rails, tail shape, and rocker. 
        If they have a current board, compare it to the recommendation.
        Keep the tone like a cool, experienced shaper in a dusty workshop.
        Return the response in Hebrew, formatted with markdown (bullet points, bold text).
        Maximum 4-5 sentences.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        responseText = response.text || "הגלשן המומלץ ייתן לך את הציפה והיציבות הדרושים להתקדמות מהירה במים.";
      } else if (service === "getCoachAnalysis") {
        const prompt = `You are a legendary surfing coach with a focus on community and persistence.
        Provide a short, powerful, and motivational analysis for a surfer with the following stats:
        - Name: ${data.name}
        - Rank: ${data.rank}
        - Total Sessions: ${data.totalSessions}
        - Current Streak: ${data.streak} weeks
        - Sessions to Next Rank: ${data.sessionsToNextRank}
    
        Acknowledge their progress, emphasize the importance of their streak, and give them a "mission" for their next session.
        Keep the tone very encouraging, slightly mystical (about the ocean), and professional.
        Return the response in Hebrew, formatted with markdown (bold text).
        Maximum 3-4 sentences.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        responseText = response.text || "המשך להתמיד, הים מעריך את המאמץ שלך.";
      } else if (service === "getForecastAnalysis") {
        const prompt = `You are a local surf guru who knows every sandbar and reef.
        Analyze the following surf forecast and provide a short, expert advice for today:
        - Wave Height: ${data.waveHeight}m
        - Water Temp: ${data.waterTemp}°C
        - Wind: ${data.windSpeed} knots from ${data.windDir}
        - Swell: ${data.swellDir} at ${data.period}s
    
        Tell the surfers what board to take, what wetsuit to wear, and what to expect from the conditions.
        Keep the tone like a salty local who's seen it all.
        Return the response in Hebrew, formatted with markdown (bold text).
        Maximum 3-4 sentences.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        responseText = response.text || "הים נראה טוב היום, צא למים ותהנה.";
      } else {
        return res.status(400).json({ error: "Invalid service" });
      }

      res.json({ text: responseText });
    } catch (error) {
      console.error("Gemini API Proxy error:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });

  // Global error tracking for "Sea Observation"
  let totalRequests = 0;
  let errorRequests = 0;
  const requestHistory: { timestamp: number; isError: boolean }[] = [];

  // Request tracking middleware (moved to top for all requests)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      totalRequests++;
      const isError = res.statusCode >= 400;
      if (isError) errorRequests++;
      
      requestHistory.push({ timestamp: Date.now(), isError });
      if (requestHistory.length > 1000) requestHistory.shift();

      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  console.log(`Server mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  // API routes FIRST - explicitly defined before any static/vite middleware
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: isProd ? 'production' : 'development' });
  });

  app.get("/api/test-weather", (req, res) => {
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

  // In-memory cache for coastal weather
  let coastalWeatherCache: any = null;
  let coastalWeatherCacheTime: number = 0;
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  app.get("/api/coastal-weather", async (req, res) => {
    console.log("DEBUG: /api/coastal-weather route reached (Open-Meteo Proxy)!");
    
    try {
      const lat = 32.08;
      const lon = 34.78;
      
      // Fetch marine data
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&hourly=sea_surface_temperature&timezone=auto`;
      const marineRes = await fetch(marineUrl);
      if (!marineRes.ok) throw new Error(`Marine API error: ${marineRes.status}`);
      const marineData = await marineRes.json();
      
      // Fetch weather data
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&daily=uv_index_max&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
      const weatherData = await weatherRes.json();
      
      // Find current sea surface temp
      const now = new Date();
      const currentHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;
      
      let waterTemp = 20; // fallback
      if (marineData.hourly && marineData.hourly.time) {
        const index = marineData.hourly.time.findIndex((t: string) => t === currentHour);
        if (index !== -1 && marineData.hourly.sea_surface_temperature[index] !== null) {
          waterTemp = marineData.hourly.sea_surface_temperature[index];
        } else if (marineData.hourly.sea_surface_temperature.length > 0) {
          waterTemp = marineData.hourly.sea_surface_temperature[0];
        }
      }

      const result = {
        location: "תל אביב",
        timestamp: new Date().toISOString(),
        waveHeight: marineData.current?.wave_height || 0,
        wavePeriod: marineData.current?.wave_period || 0,
        windSpeed: weatherData.current?.wind_speed_10m || 0,
        windDirection: weatherData.current?.wind_direction_10m || 0,
        waterTemp: waterTemp,
        uvIndex: weatherData.daily?.uv_index_max?.[0] || 0,
        syncStatus: {
          waveHeight: true,
          wind: true,
          waterTemp: true,
          uvIndex: true
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error("Open-Meteo API Proxy error:", error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
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

  app.get("/api/github/actions", async (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /api/github/actions - Request received`);
    try {
      let repo = process.env.GITHUB_REPO || "yuvalshalev/memberhub"; // Fallback repo
      if (repo.startsWith("github.com/")) {
        repo = repo.replace("github.com/", "");
      }
      console.log("Using GitHub repo:", repo);
      const token = process.env.GITHUB_TOKEN;

      // If no token or no repo, return mock data for demo purposes
      if (!token || !repo) {
        console.log("GitHub token or repo missing, returning mock data");
        return res.json({
          action: {
            id: 123456789,
            status: "completed",
            conclusion: "success",
            head_commit: {
              message: "feat: implement real-time quota monitoring 🚀",
              id: "a1b2c3d4e5f6g7h8i9j0",
              author: { name: "Yuval Shalev" }
            },
            html_url: repo ? `https://github.com/${repo}/actions` : "https://github.com",
            updated_at: new Date().toISOString()
          }
        });
      }

      const url = `https://api.github.com/repos/${repo}/actions/runs?per_page=1`;
      console.log("Fetching GitHub actions from URL:", url);
      console.log("Using repo:", repo);
      console.log("Token present:", !!token);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "MemberHub-App"
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`GitHub API returned ${response.status}: ${errorText}. Returning mock data.`);
        return res.json({
          action: {
            id: 0,
            status: "completed",
            conclusion: "success",
            head_commit: {
              message: "Mock: Pipeline stable (API unavailable)",
              id: "mock",
              author: { name: "System" }
            },
            html_url: `https://github.com/${repo}/actions`
          }
        });
      }

      const data = await response.json();
      const latestRun = data.workflow_runs?.[0];

      if (!latestRun) {
        console.warn("No GitHub action runs found, returning mock data");
        return res.json({
          action: {
            id: 0,
            status: "completed",
            conclusion: "success",
            head_commit: {
              message: "No active pipelines found",
              id: "none",
              author: { name: "System" }
            },
            html_url: `https://github.com/${repo}/actions`,
            updated_at: new Date().toISOString()
          }
        });
      }

      res.json({
        action: {
          id: latestRun.id,
          status: latestRun.status,
          conclusion: latestRun.conclusion,
          head_commit: latestRun.head_commit,
          html_url: latestRun.html_url,
          updated_at: latestRun.updated_at
        }
      });
    } catch (err: any) {
      console.error("GitHub actions fetch failed:", err);
      res.status(500).json({ error: err.message || "Failed to fetch GitHub actions" });
    }
  });

  app.get("/api/vercel/status", async (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /api/vercel/status - Request received`);
    try {
      const projectId = process.env.VERCEL_PROJECT_ID;
      const accessToken = process.env.VERCEL_ACCESS_TOKEN;
      console.log("DEBUG: VERCEL_PROJECT_ID present:", !!projectId);
      console.log("DEBUG: VERCEL_ACCESS_TOKEN present:", !!accessToken);

      // Usage Data placeholder
      let usageData = { 
        metrics: {
          bandwidth: "0 GB",
          requests: "0",
          edgeRequests: "0"
        }, 
        topQueries: [] 
      };

      if (!projectId || !accessToken) {
        console.log("Vercel Project ID or Access Token missing, returning mock data");
        return res.json({
          project: {
            id: 'mock-project',
            name: 'MemberHub',
            framework: 'nextjs',
            nodeVersion: '18.x',
            envCount: 5,
            updatedAt: new Date().toISOString()
          },
          latestDeployment: {
            readyState: 'READY',
            url: 'memberhub-demo.vercel.app',
            createdAt: Date.now()
          },
          deployments: [
            {
              uid: 'd1',
              name: 'memberhub',
              url: 'memberhub-demo.vercel.app',
              state: 'READY',
              creator: 'Yuval Shalev',
              createdAt: Date.now() - 86400000
            }
          ],
          usage: usageData,
          speedInsights: {
            performance: 98,
            accessibility: 100,
            bestPractices: 100,
            seo: 100
          }
        });
      }

      const url = `https://api.vercel.com/v9/projects/${projectId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Vercel API returned error: ${JSON.stringify(errorData)}. Returning mock data.`);
        return res.json({
          project: {
            id: projectId,
            name: 'MemberHub',
            framework: 'nextjs',
            nodeVersion: '18.x',
            envCount: 0,
            updatedAt: new Date().toISOString()
          },
          latestDeployment: {
            readyState: 'READY',
            url: 'api-error.vercel.app',
            createdAt: Date.now()
          },
          deployments: [],
          usage: usageData,
          speedInsights: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0
          }
        });
      }

      const data = await response.json();
      const latestDeployment = data.latestDeployments?.[0];

      if (!latestDeployment) {
        console.warn("No Vercel deployments found, returning partial mock data");
        return res.json({
          project: {
            id: data.id || 'none',
            name: data.name || 'Project',
            framework: data.framework || 'Next.js',
            nodeVersion: data.nodeVersion || '18.x',
            envCount: data.env?.length || 0,
            updatedAt: data.updatedAt || new Date().toISOString()
          },
          latestDeployment: {
            readyState: 'READY',
            url: 'no-deployment.vercel.app',
            createdAt: Date.now()
          },
          deployments: [],
          usage: usageData,
          speedInsights: {
            performance: 100,
            accessibility: 100,
            bestPractices: 100,
            seo: 100
          }
        });
      }

      try {
        const usageUrl = `https://api.vercel.com/v1/usage/project/${projectId}?period=30d`;
        const usageResponse = await fetch(usageUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (usageResponse.ok) {
          const uData = await usageResponse.json();
          const metrics = uData.metrics || [];
          const bandwidth = metrics.find((m: any) => m.type === 'bandwidth')?.value || 0;
          const requests = metrics.find((m: any) => m.type === 'requests')?.value || 0;
          const edgeRequests = metrics.find((m: any) => m.type === 'edgeRequests')?.value || 0;

          usageData = {
            metrics: {
              bandwidth: `${(bandwidth / (1024 * 1024 * 1024)).toFixed(2)} GB`,
              requests: requests.toLocaleString(),
              edgeRequests: edgeRequests.toLocaleString()
            },
            topQueries: []
          };

          try {
            const analyticsUrl = `https://api.vercel.com/v1/analytics/web/stats?projectId=${projectId}&environment=production&filter=path&limit=5`;
            const analyticsResponse = await fetch(analyticsUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (analyticsResponse.ok) {
              const aData = await analyticsResponse.json();
              if (aData.data && Array.isArray(aData.data)) {
                usageData.topQueries = aData.data.map((q: any) => ({
                  query: q.path,
                  count: q.count
                }));
              }
            }
          } catch (aErr) {
            console.error("Failed to fetch Vercel analytics:", aErr);
          }
        }
      } catch (uErr) {
        console.error("Failed to fetch Vercel usage:", uErr);
      }

      res.json({
        project: {
          id: data.id,
          name: data.name,
          framework: data.framework || 'Next.js',
          nodeVersion: data.nodeVersion || '18.x',
          envCount: data.env?.length || 0,
          updatedAt: data.updatedAt
        },
        latestDeployment: {
          readyState: latestDeployment.readyState,
          url: latestDeployment.url,
          createdAt: latestDeployment.createdAt
        },
        deployments: data.latestDeployments.map((d: any) => ({
          uid: d.uid,
          name: d.name,
          url: d.url,
          state: d.readyState,
          creator: d.creator?.username || 'System',
          createdAt: d.createdAt
        })),
        usage: usageData,
        speedInsights: {
          performance: 98,
          accessibility: 100,
          bestPractices: 100,
          seo: 100
        }
      });
    } catch (err: any) {
      console.error("Vercel status fetch failed:", err);
      res.status(500).json({ error: err.message || "Failed to fetch Vercel status" });
    }
  });

  // Serve markdown files from root for admin panel
  app.get("/README.md", (req, res) => {
    res.sendFile(path.join(__dirname, "README.md"));
  });
  app.get("/PROJECT_MAP.md", (req, res) => {
    res.sendFile(path.join(__dirname, "PROJECT_MAP.md"));
  });

  // Vite middleware for development
  if (!isProd) {
    console.log("Initializing Vite server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    console.log("Vite server initialized.");
  } else {
    // Serve static files in PRODUCTION mode
    console.log("Serving static files in PRODUCTION mode...");
    const distPath = path.join(__dirname, "dist");
    
    // Serve built assets from dist (which includes public assets)
    app.use(express.static(distPath, { maxAge: '1y' }));
    
    // SPA Fallback - ONLY for non-API routes
    app.get("*all", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
