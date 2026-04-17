import https from 'https';
const url = 'https://marine-api.open-meteo.com/v1/marine?latitude=32.16&longitude=34.79&daily=wave_height_max,wave_direction_dominant&timezone=Asia%2FJerusalem';
https.get(url, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
