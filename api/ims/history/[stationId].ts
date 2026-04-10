export default async function handler(req: any, res: any) {
  try {
    const { stationId } = req.query;
    const token = process.env.IMS_API_TOKEN;
    if (!token) return res.status(500).json({ error: "Token missing" });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const from = yesterday.toISOString().split('T')[0].replace(/-/g, '/');
    const to = tomorrow.toISOString().split('T')[0].replace(/-/g, '/');

    const response = await fetch(`https://api.ims.gov.il/v1/envista/stations/${stationId}/data/?from=${from}&to=${to}`, {
      headers: { "Authorization": `ApiToken ${token}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`IMS History error (${response.status}):`, errorText.substring(0, 100));
      return res.status(response.status).json({ error: `IMS History error: ${response.status}` });
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn("IMS History API returned non-JSON response (likely invalid token or API down).");
      return res.json([]);
    }

    // Extract wind speed and gusts for the last 24 hours
    const history = (data.data || [])
      .filter((entry: any) => new Date(entry.datetime).getTime() >= yesterday.getTime())
      .map((entry: any) => {
      const ws = entry.channels.find((c: any) => c.name === 'WS');
      const wsMax = entry.channels.find((c: any) => c.name === 'WSmax');
      return {
        time: entry.datetime,
        windSpeed: ws && ws.valid ? ws.value * 1.94384 : null,
        windGusts: wsMax && wsMax.valid ? wsMax.value * 1.94384 : null
      };
    }).filter((e: any) => e.windSpeed !== null);

    res.json(history);
  } catch (error) {
    console.error("IMS History Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
}
