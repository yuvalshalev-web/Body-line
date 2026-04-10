export default async function handler(req: any, res: any) {
  try {
    const lat = 32.0853;
    const lng = 34.7818;
    const params = "wave_height,water_temperature,wind_speed_10m,wind_direction_10m";
    
    const response = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=${params}&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Ocean Data API error:", error);
    res.status(500).json({ error: 'Failed to fetch ocean data' });
  }
}
