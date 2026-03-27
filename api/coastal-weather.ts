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
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
    const weatherData = await weatherRes.json();
    
    // Default to Open-Meteo
    let windSpeed = (weatherData.current?.wind_speed_10m || 0) * 0.539957; // km/h to knots
    let windDirection = weatherData.current?.wind_direction_10m || 0;
    let dataSource = "Open-Meteo";
    let isImsWind = false;

    // Try to fetch from IMS (Station 178 - Tel Aviv Coast)
    if (process.env.IMS_API_TOKEN) {
      try {
        const imsRes = await fetch("https://api.ims.gov.il/v1/envista/stations/178/data/latest", {
          headers: { "Authorization": `ApiToken ${process.env.IMS_API_TOKEN}` }
        });
        
        if (imsRes.ok) {
          const contentType = imsRes.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await imsRes.text();
            console.warn(`IMS Wind fetch returned non-JSON (${contentType}):`, text.substring(0, 100));
            throw new Error("IMS API returned non-JSON response");
          }

          const imsData = await imsRes.json();
          const channels = imsData.data?.[0]?.channels || [];
          const wsChannel = channels.find((c: any) => c.name === 'WS');
          const wdChannel = channels.find((c: any) => c.name === 'WD');
          
          if (wsChannel && wsChannel.valid) {
            windSpeed = wsChannel.value * 1.94384; // m/s to knots
            isImsWind = true;
          }
          if (wdChannel && wdChannel.valid) {
            windDirection = wdChannel.value;
          }
          
          if (isImsWind) {
            dataSource = "IMS (Tel Aviv Coast) + Open-Meteo";
          }
        }
      } catch (err) {
        console.error("IMS Wind fetch error:", err);
      }
    }

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
      windSpeed: windSpeed,
      windDirection: windDirection,
      waterTemp: waterTemp,
      uvIndex: weatherData.current?.uv_index || 0,
      dataSource: dataSource,
      syncStatus: {
        waveHeight: true,
        wind: isImsWind,
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
