export default async function handler(req: any, res: any) {
  try {
    const response = await fetch("https://ims.gov.il/sites/default/files/ims_data/xml_files/isr_sea.xml");
    if (!response.ok) throw new Error(`IMS XML error: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-8');
    const xml = decoder.decode(buffer);
    
    const centralCoastMatch = xml.match(/<LocationNameEng>Central Coast<\/LocationNameEng>.*?<LocationData>(.*?)<\/LocationData>/);
    if (!centralCoastMatch) {
      return res.json({ forecast: null });
    }
    
    const data = centralCoastMatch[1];
    const timeUnitMatch = data.match(/<TimeUnitData>(.*?)<\/TimeUnitData>/);
    if (!timeUnitMatch) {
      return res.json({ forecast: null });
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
    
    res.json({ forecast: forecastText, raw: { waveHeight, waterTemp, wind } });
  } catch (error) {
    console.error("IMS Marine Forecast error:", error);
    res.status(500).json({ error: "Failed to fetch marine forecast" });
  }
}
