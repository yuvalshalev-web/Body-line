/**
 * Utility for fetching JSON from the API with retry logic and content-type verification.
 * This helps handle cases where the server is still warming up and returns HTML instead of JSON.
 */
export async function fetchJson(url: string, options: RequestInit = {}, retries = 3): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.signal ? 15000 : 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      signal: options.signal || controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        console.log(`API request failed with status ${response.status}. Retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchJson(url, options, retries - 1);
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`API request to ${url} returned non-JSON response:`, text.substring(0, 100));
      
      if (retries > 0) {
        console.log(`Retrying API request to ${url} due to non-JSON response... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return fetchJson(url, options, retries - 1);
      }
      throw new Error("API returned non-JSON response (likely server warmup page)");
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      if (retries > 0) {
        console.log(`API request to ${url} timed out. Retrying... (${retries} left)`);
        return fetchJson(url, options, retries - 1);
      }
      throw new Error(`API request to ${url} timed out`);
    }
    
    if (retries > 0) {
      console.log(`API request to ${url} failed: ${error.message}. Retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchJson(url, options, retries - 1);
    }
    
    throw error;
  }
}
