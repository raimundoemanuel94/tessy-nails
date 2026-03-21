const https = require('https');
const urls = [
  'https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/887352/pexels-photo-887352.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1049687/pexels-photo-1049687.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800'
];
urls.forEach(url => {
  https.get(url, (res) => {
    console.log(res.statusCode, url);
  }).on('error', (e) => {
    console.error(e);
  });
});
