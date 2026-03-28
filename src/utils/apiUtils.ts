export async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    if (text.includes("<title>Starting Server...</title>")) {
      console.warn(`Server is starting up, retrying ${url} later...`);
      throw new Error("SERVER_STARTING");
    }
    throw new Error(`Received non-JSON response from server: ${contentType}`);
  }

  return await response.json();
}
