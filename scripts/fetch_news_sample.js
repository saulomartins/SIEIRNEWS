const axios = require('axios');
(async()=>{
  try{
    const login = await axios.post('http://localhost:3000/api/auth/login', { email: 'admin@sieirnews.com', password: 'admin123' });
    const news = await axios.get('http://localhost:3000/api/data/news', { headers: { Authorization: 'Bearer ' + login.data.token } });
    const list = Array.isArray(news.data) ? news.data : (news.data && news.data.data ? news.data.data : (news.data.news || []));
    list.slice(0,5).forEach((n,i)=>{
      console.log(`#${i+1}: ${n.title || n.titleText || '—'}`);
      console.log('  ' + (n.url || n.link || ''));
      console.log('  time: ' + (n.pubDate || n.time || n.fullDate || '—'));
      console.log('');
    });
  } catch (e) {
    console.error(e.response ? JSON.stringify(e.response.data) : e.toString());
    process.exit(1);
  }
})();
