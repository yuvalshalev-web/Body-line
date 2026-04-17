import https from 'https';
https.get('https://gosurf.co.il/', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
