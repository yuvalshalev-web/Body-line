export default async function handler(req: any, res: any) {
  try {
    const lat = 32.0853;
    const lng = 34.7818;
    const params = "wave_height,water_temperature";
    
    // Get data for the last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=${params}&start_date=${startDate}&end_date=${endDate}&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Historical Ocean Data API error:", error);
    res.status(500).json({ error: 'Failed to fetch historical ocean data' });
  }
}
