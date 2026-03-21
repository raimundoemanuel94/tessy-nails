const https = require('https');

https.get('https://unsplash.com/napi/search/photos?query=manicure+pedicure&per_page=10', (resp) => {
  let data = '';
  resp.on('data', (c) => data += c);
  resp.on('end', () => JSON.parse(data).results.forEach(r => console.log(r.id, r.urls.regular)));
});
