import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
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
    
    return response.status(200).json(result);
  } catch (error) {
    console.error("Open-Meteo API Proxy error:", error);
    return response.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
