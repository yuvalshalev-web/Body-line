import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const stationId = request.query.stationId ? String(request.query.stationId) : "178"; // Default to Tel Aviv Coast
    
    // Map station IDs to coordinates for Open-Meteo fallback
    const stationCoords: Record<string, { lat: number, lon: number, name: string }> = {
      "178": { lat: 32.08, lon: 34.78, name: "תל אביב" },
      "26": { lat: 32.82, lon: 34.99, name: "חיפה" },
      "124": { lat: 31.81, lon: 34.64, name: "אשדוד" },
      "208": { lat: 31.67, lon: 34.56, name: "אשקלון" },
      "343": { lat: 32.98, lon: 35.08, name: "שבי ציון" },
      "46": { lat: 32.44, lon: 34.88, name: "חדרה" }
    };

    const coords = stationCoords[stationId] || stationCoords["178"];
    const { lat, lon } = coords;
    
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&hourly=sea_surface_temperature&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,uv_index,surface_pressure,relative_humidity_2m&timezone=auto`;
    const imsUrl = `https://api.ims.gov.il/v1/envista/stations/${stationId}/data/latest`;
    
    const fetchWithRetry = async (url: string, options: any, retries = 2): Promise<any> => {
      try {
        const res = await fetch(url, { 
          ...options, 
          headers: { 
            ...options.headers,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
      } catch (err: any) {
        if (retries > 0) {
          console.warn(`Retrying fetch for ${url}. Retries left: ${retries}`);
          return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
      }
    };

    const fetchMarine = fetchWithRetry(marineUrl, {}).then(data => data).catch(err => {
      console.error("Marine fetch error:", err);
      return { current: {}, hourly: { time: [], sea_surface_temperature: [] } };
    });

    const fetchWeather = fetchWithRetry(weatherUrl, {}).then(data => data).catch(err => {
      console.error("Weather fetch error:", err);
      return { current: {} };
    });

    const fetchIms = process.env.IMS_API_TOKEN ? (async () => {
      try {
        const res = await fetch(imsUrl, {
          headers: { 
            "Authorization": `ApiToken ${process.env.IMS_API_TOKEN}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!res.ok) throw new Error(`IMS API error: ${res.status}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn("IMS API returned non-JSON response (likely invalid token or API down). Skipping IMS data.");
          return null;
        }
      } catch (err) {
        console.error("IMS Wind fetch error:", err);
        return null;
      }
    })() : Promise.resolve(null);

    // Fetch all data concurrently
    const [marineData, weatherData, imsData] = await Promise.all([
      fetchMarine,
      fetchWeather,
      fetchIms
    ]);
    
    // Default to Open-Meteo
    let windSpeed = (weatherData.current?.wind_speed_10m || 0) * 0.539957; // km/h to knots
    let windDirection = weatherData.current?.wind_direction_10m || 0;
    let windGusts = 0;
    let pressure = weatherData.current?.surface_pressure || null;
    let humidity = weatherData.current?.relative_humidity_2m || null;
    let airTemp = weatherData.current?.temperature_2m || 0;
    let rain = 0;
    let dataSource = "Open-Meteo";
    let isImsWind = false;

    // Process IMS data if available
    if (imsData) {
      const channels = imsData.data?.[0]?.channels || [];
      const wsChannel = channels.find((c: any) => c.name === 'WS');
      const wdChannel = channels.find((c: any) => c.name === 'WD');
      const wsMaxChannel = channels.find((c: any) => c.name === 'WSmax');
      const bpChannel = channels.find((c: any) => c.name === 'BP');
      const rhChannel = channels.find((c: any) => c.name === 'RH');
      
      if (wsChannel && wsChannel.valid) {
        windSpeed = wsChannel.value * 1.94384; // m/s to knots
        isImsWind = true;
      }
      if (wdChannel && wdChannel.valid) {
        windDirection = wdChannel.value;
      }
      if (wsMaxChannel && wsMaxChannel.valid) {
        windGusts = wsMaxChannel.value * 1.94384; // m/s to knots
      }
      if (bpChannel && bpChannel.valid) {
        pressure = bpChannel.value;
      }
      if (rhChannel && rhChannel.valid) {
        humidity = rhChannel.value;
      }
      
      const tdChannel = channels.find((c: any) => c.name === 'TD');
      const rainChannel = channels.find((c: any) => c.name === 'Rain');
      
      if (tdChannel && tdChannel.valid) {
        airTemp = tdChannel.value;
      }
      if (rainChannel && rainChannel.valid) {
        rain = rainChannel.value;
      }
      
      if (isImsWind) {
        dataSource = `IMS (${coords.name}) + Open-Meteo`;
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
      location: coords.name,
      stationId: stationId,
      timestamp: new Date().toISOString(),
      waveHeight: marineData.current?.wave_height || 0,
      wavePeriod: marineData.current?.wave_period || 0,
      windSpeed: windSpeed,
      windGusts: windGusts,
      windDirection: windDirection,
      waterTemp: waterTemp,
      airTemp: airTemp,
      rain: rain,
      uvIndex: weatherData.current?.uv_index || 0,
      pressure: pressure,
      humidity: humidity,
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
