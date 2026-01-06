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
    // set dev auto-login flag before navigation
    await page.evaluateOnNewDocument(() => {
      try { 
        localStorage.setItem('ENABLE_DEV_AUTOLOGIN', 'true');
      } catch(e){}
      try {
        localStorage.setItem('newsTranslated', 'true');
      } catch(e){}
    });

    // capture console messages from the page
    page.on('console', msg => {
      try { console.log('PAGE_CONSOLE', msg.type(), msg.text()); } catch(e){}
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 20000 });
    // wait for Vue mount and async fetches
    await new Promise(r => setTimeout(r, 20000));

    // Esperar por condição robusta: #nasdaqLastUpdate != 'Atualizando...' OR #nasdaqAverage visível com valor
    // fallback: pelo menos 5 células .nasdaq-market-change preenchidas. Timeout aumentado para 60s.
    try {
      await page.waitForFunction(() => {
        try {
          const last = document.getElementById('nasdaqLastUpdate');
          if (last && last.textContent && last.textContent.trim().toLowerCase() !== 'atualizando...') return true;
          const avgEl = document.getElementById('nasdaqAverage');
          if (avgEl && avgEl.innerText && !/--|—/.test(avgEl.innerText)) return true;
          const els = document.querySelectorAll('.nasdaq-market-change');
          return Array.from(els).filter(e => {
            try { const t = e && e.textContent && e.textContent.trim(); return !!t && t !== '--' && t !== '—'; } catch(e){return false}
          }).length >= 5;
        } catch(e) { return false }
      }, { timeout: 60000 });
      console.log('✅ NASDAQ: condição de preenchimento atingida antes do snapshot');
    } catch (e) {
      console.log('⏳ NASDAQ: condição não atingida dentro do timeout (60s), prosseguindo com fallback');
    }

    // Attempt interactions and checks
    const info = await page.evaluate(async ()=>{
      const title = document.title;
      const hasVue = typeof Vue !== 'undefined';

      // token and dev flag
      const storedToken = (()=>{ try{ return localStorage.getItem('token'); }catch(e){ return null } })();
      const devFlag = (()=>{ try{ return localStorage.getItem('ENABLE_DEV_AUTOLOGIN'); }catch(e){ return null } })();

      // news content
      const newsFeed = document.querySelector('.news-feed');
      const newsHtml = newsFeed ? newsFeed.innerHTML.slice(0,2000) : null;
      const newsEls = newsFeed ? Array.from(newsFeed.querySelectorAll('.news-item')) : [];
      const newsCount = newsEls.length;

      // indices table rows
      const indicesEl = document.querySelector('.panel-indices');
      const indicesRows = indicesEl ? indicesEl.querySelectorAll('tbody tr') : [];
      const indicesCount = indicesRows.length;

      // coletar detalhes NASDAQ por símbolo
      const nasdaqDetails = [];
      try {
        const nasdaqRows = Array.from(document.querySelectorAll('#nasdaqTableBody tr'));
        nasdaqRows.forEach(row => {
          const id = row.id || '';
          const symbol = id.replace('nasdaq-', '');
          const marketChange = (row.querySelector('.nasdaq-market-change') || {}).textContent || '';
          const frozen = (row.querySelector('.nasdaq-frozen') || {}).textContent || '';
          const diff = (row.querySelector('.nasdaq-diff') || {}).textContent || '';
          nasdaqDetails.push({ symbol, marketChange: marketChange.trim(), frozen: frozen.trim(), diff: diff.trim() });
        });
      } catch(e) { /* ignore */ }
      const nasdaqTable = document.getElementById('nasdaqTableBody');
      const nasdaqTableHtml = nasdaqTable ? nasdaqTable.innerHTML.slice(0,2000) : null;
      const bodyHtml = document.body ? document.body.innerHTML.slice(0,8000) : null;

      // try freeze: find a freeze button and click if present
      const freezeBtn = document.querySelector('.btn-freeze') || document.querySelector('.panel .btn-freeze');
      let freezeResult = 'none';
      if (freezeBtn) {
        freezeBtn.click();
        freezeResult = 'clicked';
      }

      // click translate button if available (search by text containing 'traduz')
      let translateClicked = false;
      const btns = Array.from(document.querySelectorAll('button'));
      const translateBtn = btns.find(b => (b.textContent||'').toLowerCase().includes('traduz'));
      if (translateBtn) {
        try { translateBtn.click(); translateClicked = true; } catch(e){}
      }

      // click sound button if present (toggle)
      let soundClicked = false;
      const soundBtn = btns.find(b => (b.textContent||'').toLowerCase().includes('som') || b.querySelector && b.querySelector('.bi-volume-up'));
      if (soundBtn) { try { soundBtn.click(); soundClicked = true; } catch(e){} }

      // wait a bit for translations to apply
      await new Promise(r => setTimeout(r, 5000));

      // check whether news items contain non-ASCII (likely translated)
      const newsFeed2 = document.querySelector('.news-feed');
      const newsTexts = newsFeed2 ? Array.from(newsFeed2.querySelectorAll('.news-text, .news-item')).map(el=>el.innerText||el.textContent||'') : [];
      const hasNonAscii = newsTexts.some(t => /[^\x00-\x7F]/.test(t));

      // try logout (click) and detect redirect
      let logoutResult = null;
      const logoutBtn = document.querySelector('#logoutBtn') || document.querySelector('.btn-icon[title="Sair"]');
      if (logoutBtn) {
        try { logoutBtn.click(); await new Promise(r=>setTimeout(r,1000)); logoutResult = location.pathname + location.search; } catch(e){ logoutResult = 'error'; }
      }

      // (logoutHref is captured via logoutResult above)
      let logoutHref = null;
      try { logoutHref = location.pathname + location.search; } catch(e) { logoutHref = null }

      // read nasdaq average if present
      const nasdaqAvgEl = document.getElementById('nasdaqAverage');
      const nasdaqAvg = nasdaqAvgEl ? nasdaqAvgEl.innerText : null;
      
      return {
        title, hasVue, devFlag, hasToken: !!storedToken, tokenPreview: storedToken ? storedToken.slice(0,10)+'...' : null,
        newsCount, newsHtml, indicesCount, freezeResult, logoutHref,
        translateClicked, soundClicked, hasNonAscii, newsSample: newsTexts.slice(0,5), logoutResult, nasdaqAvg
        , nasdaqDetails, nasdaqTableHtml, bodyHtml
      };
    });

    console.log('PAGE_INFO', JSON.stringify(info));
    // If nasdaqAvg still missing or contains --, try server-side endpoint as fallback
    try {
      const nasdaqAvgVal = info && info.nasdaqAvg ? info.nasdaqAvg : null;
      if (!nasdaqAvgVal || /--|—/.test(nasdaqAvgVal)) {
        try {
          const serverResp = await page.evaluate(async ()=>{
            try{
              const token = localStorage.getItem('token');
              const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
              const r = await fetch('/api/data/nasdaq-average', { headers });
              if (!r.ok) return { error: 'status:'+r.status };
              const json = await r.json();
              return { json };
            }catch(e){ return { error: (e && e.toString && e.toString()) || String(e) } }
          });
          info.serverNasdaqAvg = serverResp && serverResp.json ? serverResp.json : serverResp;
          console.log('FALLBACK_SERVER_NASDAQ', JSON.stringify(info.serverNasdaqAvg));
        } catch(e) {
          console.log('FALLBACK_ERROR', e && e.toString ? e.toString() : String(e));
        }
      }
    } catch(e) { /* ignore */ }

    // persist output to file for reliable inspection
    try{
      const fs = require('fs');
      const out = { info, logs };
      fs.writeFileSync('scripts/capture_output.json', JSON.stringify(out, null, 2));
    }catch(e){ console.error('WRITE_ERROR', e && e.stack ? e.stack : e.toString()); }
  } catch(e) {
    console.error('ERROR_NAV', e && e.stack ? e.stack : e.toString());
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
