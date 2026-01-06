(async ()=>{
  try{
    const login = await fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@sieirnews.com',password:'admin123'})});
    const loginBody = await login.json();
    console.log('LOGIN:', loginBody && loginBody.token ? 'OK' : JSON.stringify(loginBody));
    if (!loginBody || !loginBody.token) return;
    const token = loginBody.token;
    const resp = await fetch('http://localhost:3000/api/data/nasdaq-average',{headers:{'Authorization': `Bearer ${token}`}});
    const body = await resp.json();
    console.log('NASDAQ AVG RESPONSE:', JSON.stringify(body, null, 2));
  }catch(e){ console.error('ERR', e && e.stack ? e.stack : e.toString()); }
})();
