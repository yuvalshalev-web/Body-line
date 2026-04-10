export default async function handler(req: any, res: any) {
  try {
    const token = process.env.IMS_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "IMS API token not configured" });
    }
    const response = await fetch("https://api.ims.gov.il/v1/envista/warnings", {
      headers: { "Authorization": `ApiToken ${token}` }
    });
    
    if (!response.ok) {
      return res.json({ data: [] });
    }
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.json({ data: [] });
    }
    
    res.json(data);
  } catch (error) {
    console.error("IMS API Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch IMS warnings" });
  }
}
