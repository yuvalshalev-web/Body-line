let cachedMarineForecast: any = {
  forecast: "תחזית ימית רשמית (החוף המרכזי): גלים 40-70 ס״מ, טמפ׳ מים 29.5°C, רוח 8 קשר.",
  raw: { waveHeight: '40-70', waterTemp: '29.5', wind: 'W / 8' }
};

export default async function handler(req: any, res: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch("https://ims.gov.il/sites/default/files/ims_data/xml_files/isr_sea.xml", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`IMS XML serverless error: ${response.status}. Using cached/fallback forecast.`);
      return res.json(cachedMarineForecast);
    }
    
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-8');
    const xml = decoder.decode(buffer);
    
    const centralCoastMatch = xml.match(/<LocationNameEng>Central Coast<\/LocationNameEng>.*?<LocationData>(.*?)<\/LocationData>/);
    if (!centralCoastMatch) {
      return res.json(cachedMarineForecast);
    }
    
    const data = centralCoastMatch[1];
    const timeUnitMatch = data.match(/<TimeUnitData>(.*?)<\/TimeUnitData>/);
    if (!timeUnitMatch) {
      return res.json(cachedMarineForecast);
    }
    
    const timeUnit = timeUnitMatch[1];
    
    const waveMatch = timeUnit.match(/<ElementName>Sea status and waves height<\/ElementName><ElementValue>.*?\/ (.*?)<\/ElementValue>/);
    const tempMatch = timeUnit.match(/<ElementName>Sea temperature<\/ElementName><ElementValue>(.*?)<\/ElementValue>/);
    const windMatch = timeUnit.match(/<ElementName>Wind direction and speed<\/ElementName><ElementValue>(.*?)<\/ElementValue>/);
    
    const waveHeight = waveMatch ? waveMatch[1].trim() : '';
    const waterTemp = tempMatch ? tempMatch[1].trim() : '';
    const wind = windMatch ? windMatch[1].trim() : '';
    
    let windSpeed = '';
    if (wind && wind.includes('/')) {
      windSpeed = wind.split('/')[1].trim();
    }
    
    const forecastText = `תחזית ימית רשמית (החוף המרכזי): גלים ${waveHeight} ס״מ, טמפ׳ מים ${waterTemp}°C, רוח ${windSpeed} קשר.`;
    
    cachedMarineForecast = {
      forecast: forecastText,
      raw: { waveHeight, waterTemp, wind }
    };

    res.json(cachedMarineForecast);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn("IMS Marine Forecast serverless fetch failed or timed out. Serving cached fallback forecast. Error details:", error.message || error);
    res.json(cachedMarineForecast);
  }
}
