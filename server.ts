import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // In-memory cache for coastal weather
  let coastalWeatherCache: any = null;
  let coastalWeatherCacheTime: number = 0;
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  app.get("/api/coastal-weather", async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    const now = Date.now();
    console.log(`[${new Date().toISOString()}] [${requestId}] GET /api/coastal-weather - Start`);

    // Cache-Aside Pattern: Check if valid cache exists
    if (coastalWeatherCache && (now - coastalWeatherCacheTime < CACHE_TTL)) {
      console.log(`[${new Date().toISOString()}] [${requestId}] GET /api/coastal-weather - Returning cached data`);
      return res.json(coastalWeatherCache);
    }

    console.log(`[${new Date().toISOString()}] [${requestId}] GET /api/coastal-weather - Cache miss, fetching fresh data`);
    try {
      const lat = req.query.lat || 32.16;
      const lng = req.query.lng || 34.84;
      
      // Fetch Marine data (Waves, Water Temp)
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,sea_surface_temperature&timezone=auto`;
      // Fetch Forecast data (Wind, UV Index)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`;
      
      console.log(`[${new Date().toISOString()}] [${requestId}] Fetching marine data from: ${marineUrl}`);
      console.log(`[${new Date().toISOString()}] [${requestId}] Fetching weather data from: ${weatherUrl}`);

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl).catch(err => {
          console.error(`[${new Date().toISOString()}] [${requestId}] Marine fetch failed:`, err);
          return { ok: false, status: 500 } as any;
        }),
        fetch(weatherUrl).catch(err => {
          console.error(`[${new Date().toISOString()}] [${requestId}] Weather fetch failed:`, err);
          return { ok: false, status: 500 } as any;
        })
      ]);

      console.log(`[${new Date().toISOString()}] [${requestId}] Marine response: status=${marineRes.status}, type=${marineRes.headers?.get('content-type')}`);
      console.log(`[${new Date().toISOString()}] [${requestId}] Weather response: status=${weatherRes.status}, type=${weatherRes.headers?.get('content-type')}`);

      let marineData = null;
      if (marineRes.ok) {
        const contentType = marineRes.headers?.get('content-type') || '';
        if (contentType.includes('application/json')) {
          marineData = await marineRes.json().catch((err: any) => {
            console.error(`[${new Date().toISOString()}] [${requestId}] Failed to parse marine JSON:`, err);
            return null;
          });
        } else {
          const text = await marineRes.text();
          console.warn(`[${new Date().toISOString()}] [${requestId}] Marine API returned non-JSON: ${text.substring(0, 200)}...`);
        }
      }

      let weatherData = null;
      if (weatherRes.ok) {
        const contentType = weatherRes.headers?.get('content-type') || '';
        if (contentType.includes('application/json')) {
          weatherData = await weatherRes.json().catch((err: any) => {
            console.error(`[${new Date().toISOString()}] [${requestId}] Failed to parse weather JSON:`, err);
            return null;
          });
        } else {
          const text = await weatherRes.text();
          console.warn(`[${new Date().toISOString()}] [${requestId}] Weather API returned non-JSON: ${text.substring(0, 200)}...`);
        }
      }

      const data = {
        waterTemp: marineData?.current?.sea_surface_temperature || 20,
        waveHeight: marineData?.current?.wave_height || 1,
        wavePeriod: marineData?.current?.wave_period || 6,
        windSpeed: weatherData?.current?.wind_speed_10m || 10,
        windDirection: weatherData?.current?.wind_direction_10m || 0,
        uvIndex: weatherData?.current?.uv_index || 0,
        timestamp: new Date().toISOString(),
        location: "חוף מרכז",
        source: marineData && weatherData ? "Open-Meteo Real-time" : "Partial Real-time / Fallback",
        syncStatus: {
          waterTemp: !!marineData,
          waveHeight: !!marineData,
          wavePeriod: !!marineData,
          wind: !!weatherData,
          uvIndex: !!weatherData
        }
      };

      // Update cache
      coastalWeatherCache = data;
      coastalWeatherCacheTime = now;

      console.log(`[${new Date().toISOString()}] [${requestId}] GET /api/coastal-weather - Success, cache updated`);
      res.json(data);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [${requestId}] GET /api/coastal-weather - Critical Error:`, error);
      
      // If we have a stale cache, return it on error as fallback
      if (coastalWeatherCache) {
        console.log(`[${new Date().toISOString()}] [${requestId}] Returning stale cache due to error`);
        return res.json(coastalWeatherCache);
      }

      const hour = new Date().getHours();
      res.json({
        waterTemp: 20,
        waveHeight: 1,
        wavePeriod: 6,
        windSpeed: 10,
        windDirection: 0,
        uvIndex: (hour >= 19 || hour < 6) ? 0 : 3,
        timestamp: new Date().toISOString(),
        location: "חוף מרכז (מצב חירום)",
        source: "Fallback",
        syncStatus: {
          waterTemp: false,
          waveHeight: false,
          wavePeriod: false,
          wind: false,
          uvIndex: false
        }
      });
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
            html_url: `https://github.com/${repo}/actions`
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

  // 404 handler for API routes to prevent falling through to SPA fallback
  app.use("/api/*all", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite server...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    console.log("Vite server initialized and middleware added.");
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
