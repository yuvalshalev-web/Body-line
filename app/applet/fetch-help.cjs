const https = require("https");
https.get("https://gosurf.co.il/help", (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => console.log(data));
});
