const puppeteer = require('puppeteer');
(async ()=>{
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({type, text});
    console.log(`[${type}] ${text}`);
  });
  page.on('pageerror', err => {
    console.log('[pageerror]', err.toString());
  });
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('[response error]', resp.status(), resp.url());
  });
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 15000 });
    // wait a bit for Vue mount and async fetches
    await new Promise(r => setTimeout(r, 5000));
    // evaluate existence of Vue root and components
    const info = await page.evaluate(()=>{
      const indicesEl = document.querySelector('.panel-indices');
      const indicesCount = indicesEl ? (indicesEl.querySelectorAll('tbody tr').length) : 0;
      const outer = indicesEl ? indicesEl.outerHTML : null;
      return {
        title: document.title,
        hasVue: typeof Vue !== 'undefined',
        newsPanel: !!document.querySelector('.panel .news-feed'),
        hasIndices: !!indicesEl,
        indicesCount,
        indicesOuter: outer ? outer.slice(0, 1000) : null
      };
    });
    console.log('PAGE_INFO', JSON.stringify(info));
  } catch(e) {
    console.error('ERROR_NAV', e.toString());
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
