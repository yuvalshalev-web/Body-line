async function test() {
  const stationId = "178";
  const imsUrl = `https://api.ims.gov.il/v1/envista/stations/${stationId}/data/latest`;
  try {
    const res = await fetch(imsUrl, {
      headers: { "Authorization": `ApiToken invalid_token` }
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Response:", text.substring(0, 200));
  } catch (err) {
    console.error(err);
  }
}

test();
