const http = require('http');
const https = require('https');
function fetchUrl(u){
  return new Promise((res)=>{
    try{
      const p = u.startsWith('https')?https:http;
      const req = p.get(u, r=>{
        res({statusCode:r.statusCode, headers:r.headers});
        r.resume();
      });
      req.on('error', e=> res({error: e.toString()}));
    } catch(e) { res({error: e.toString()}); }
  });
}

(async ()=>{
  try{
    const body = await new Promise(r=>{
      http.get('http://localhost:3000/', resp=>{
        let s='';
        resp.on('data', c=> s+=c);
        resp.on('end', ()=> r(s));
      }).on('error', e=>{ console.error(e); r(''); });
    });

    const script = [...body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]);
    const link = [...body.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map(m=>m[1]);
    const assets = [...new Set([...script, ...link])];
    const results = [];
    for (const a of assets) {
      const url = /^(https?:)/i.test(a) ? a : ('http://localhost:3000/' + a).replace(/\/\//g, '/').replace('http:/','http://');
      const res = await fetchUrl(url);
      res.asset = a;
      res.url = url;
      results.push(res);
    }
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
