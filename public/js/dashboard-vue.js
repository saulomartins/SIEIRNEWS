// Minimal Vue integration for dashboard layout (uses Vue 3 global build + SortableJS)
(function(){
  if (typeof Vue === 'undefined') {
    console.warn('Vue not loaded; dashboard-vue will not initialize.');
    return;
  }

  // Safe error serializer to avoid JSHandle@error in headless logs
  function serializeError(err){
    try{
      if(!err) return String(err);
      if(err.stack) return err.stack;
      if(typeof err === 'object') return JSON.stringify(err);
      return String(err);
    }catch(e){ return String(err); }
  }

  const { createApp, ref, onMounted } = Vue;

  createApp({
    setup() {
      const panels = ref([
        { id: 'nasdaq', label: 'NASDAQ', selector: '.panel-nasdaq', column: 'left', visible: true },
        { id: 'metals', label: 'Metais', selector: '.panel-metals', column: 'left', visible: true },
        { id: 'indices', label: 'Índices', selector: '.panel-indices', column: 'left', visible: true },
        { id: 'news', label: 'SEIER News', selector: '.panel-news', column: 'center', visible: true }
      ]);

      function saveLayout() {
        try {
          const state = panels.value.map(p => ({ id: p.id, visible: p.visible }));
          // capture order
          const leftOrder = Array.from(document.querySelectorAll('.left-column > .panel')).map(el => el.classList.contains('panel-nasdaq') ? 'nasdaq' : el.classList.contains('panel-metals') ? 'metals' : el.classList.contains('panel-indices') ? 'indices' : el.getAttribute('data-panel-id') || el.id);
          const centerOrder = Array.from(document.querySelectorAll('.center-column > .panel')).map(el => el.classList.contains('panel-news') ? 'news' : el.getAttribute('data-panel-id') || el.id);
          const layout = { panels: state, order: { left: leftOrder, center: centerOrder } };
          localStorage.setItem('vueDashboardLayout', JSON.stringify(layout));
          console.log('💾 Layout salvo');
        } catch (e) { console.error('Erro ao salvar layout:', serializeError(e)); }
      }

      function loadLayout() {
        try {
          const raw = localStorage.getItem('vueDashboardLayout');
          if (!raw) return;
          const layout = JSON.parse(raw);
          if (layout.panels) {
            layout.panels.forEach(p => {
              const panel = panels.value.find(x => x.id === p.id);
              if (panel) panel.visible = p.visible;
            });
          }
          if (layout.order && layout.order.left) {
            const left = document.querySelector('.left-column');
            layout.order.left.forEach(id => {
              const el = id === 'nasdaq' ? document.querySelector('.panel-nasdaq') : id === 'metals' ? document.querySelector('.panel-metals') : id === 'indices' ? document.querySelector('.panel-indices') : null;
              if (el && left) left.appendChild(el);
            });
          }
          if (layout.order && layout.order.center) {
            const center = document.querySelector('.center-column');
            layout.order.center.forEach(id => {
              const el = id === 'news' ? document.querySelector('.panel-news') : null;
              if (el && center) center.appendChild(el);
            });
          }
        } catch (e) { console.error('Erro ao carregar layout:', serializeError(e)); }
      }

      onMounted(async () => {
        // populate toggles area
        const togglesRoot = document.getElementById('panelToggles');
        if (togglesRoot) {
          togglesRoot.innerHTML = '';
          panels.value.forEach(p => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '6px 0';
            const label = document.createElement('span');
            label.textContent = p.label;
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = p.visible;
            input.addEventListener('change', () => {
              p.visible = input.checked;
              const el = document.querySelector(p.selector);
              if (el) el.style.display = p.visible ? '' : 'none';
              saveLayout();
            });
            row.appendChild(label);
            row.appendChild(input);
            togglesRoot.appendChild(row);
          });
        }

        // load saved layout
        loadLayout();

        // initialize Sortable for left and center columns
        try {
          const left = document.querySelector('.left-column');
          if (left && typeof Sortable !== 'undefined') {
            Sortable.create(left, {
              handle: '.panel-header-mini, .panel-header-news, .panel-header',
              draggable: '.panel',
              animation: 150,
              onEnd: saveLayout
            });
          }
          const center = document.querySelector('.center-column');
          if (center && typeof Sortable !== 'undefined') {
            Sortable.create(center, {
              handle: '.panel-header-news, .panel-header, .panel-header-mini',
              draggable: '.panel',
              animation: 150,
              onEnd: saveLayout
            });
          }
        } catch (e) { console.error('Erro iniciando Sortable:', serializeError(e)); }

        // hook layout button
        const layoutBtn = document.getElementById('layoutBtn');
        if (layoutBtn) layoutBtn.addEventListener('click', () => {
          const m = document.getElementById('layoutModal');
          if (m) m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
        });

        // ensure visibility states applied
        panels.value.forEach(p => {
          const el = document.querySelector(p.selector);
          if (el) el.style.display = p.visible ? '' : 'none';
        });

        // Auto-login in dev if running on localhost and no token
        async function tryAutoLogin(){
          try{
            // Require explicit opt-in for auto-login in dev to avoid accidental credential use
            if (localStorage.getItem('ENABLE_DEV_AUTOLOGIN') !== 'true') return;
              const existing = localStorage.getItem('token');
              if(existing) return;
            const creds = { email: 'admin@sieirnews.com', password: 'admin123' };
            const resp = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(creds)
            });
            if(!resp.ok) { console.warn('Auto-login falhou:', resp.status); return; }
            const body = await resp.json();
            if(body.token) localStorage.setItem('token', body.token);
          }catch(e){ console.error('Erro no auto-login', serializeError(e)); }
        }

        await tryAutoLogin();

        // helper: fetch with optional auth retry (tries to auto-login once if fetch fails)
        async function fetchWithAuthRetry(url, opts = {}, retries = 1) {
          try {
            const token = localStorage.getItem('token');
            const headers = Object.assign({}, opts.headers || {}, token ? { 'Authorization': `Bearer ${token}` } : {});
            const resp = await fetch(url, Object.assign({}, opts, { headers }));
            if (!resp.ok && resp.status === 401 && retries > 0) {
              // try auto-login and retry
              await tryAutoLogin();
              return fetchWithAuthRetry(url, opts, retries - 1);
            }
            return resp;
          } catch (err) {
            if (retries > 0) {
              try { await tryAutoLogin(); } catch(e){}
              return fetchWithAuthRetry(url, opts, retries - 1);
            }
            throw err;
          }
        }

        // Fetch and populate indices table for static HTML (if present)
        (async function populateIndices(){
          try{
            const tbody = document.getElementById('indicesTableBody');
            if(!tbody) return;
            const symbols = ['^DJI','^GSPC','RTY=F'].join(',');
            const token = localStorage.getItem('token');
            const resp = await fetchWithAuthRetry(`/api/data?symbols=${encodeURIComponent(symbols)}`);
            if(!resp || !resp.ok){
              console.warn('Não foi possível obter índices:', resp ? resp.status : 'no-response');
              // popular com placeholders quando não autenticado
              tbody.innerHTML = '';
              const placeholders = [
                { name: 'Dow Jones', price: '--', chText: '--', chClass: '', time: '--' },
                { name: 'S&P 500', price: '--', chText: '--', chClass: '', time: '--' },
                { name: 'Russell 2000', price: '--', chText: '--', chClass: '', time: '--' }
              ];
              placeholders.forEach(p=>{
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${p.name}</td><td>${p.price}</td><td class="${p.chClass}">${p.chText}</td><td>${p.time}</td><td><a href="#">Ver</a></td>`;
                tbody.appendChild(tr);
              });
              return;
            }
            const arr = await resp.json();
            tbody.innerHTML = '';
            if(Array.isArray(arr)){
              arr.forEach(it=>{
                const tr = document.createElement('tr');
                const symbolNorm = (it.ticker||it.symbol||'').toString();
                const name = symbolNorm === '^GSPC' ? 'S&P 500' : (symbolNorm === '^DJI' ? 'Dow Jones' : symbolNorm);
                const price = it.regularMarketPrice ?? '--';
                const ch = it.regularMarketChangePercent ?? 0;
                const chText = (ch>0?'+':'') + (ch!==null && ch!==undefined ? parseFloat(ch).toFixed(2) : '--') + '%';
                const time = it.regularMarketTime ? new Date(it.regularMarketTime*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--';
                tr.innerHTML = `<td>${name}</td><td>${price}</td><td class="${ch>0?'price-positive':(ch<0?'price-negative':'')}">${chText}</td><td>${time}</td><td><a href="https://finance.yahoo.com/quote/${encodeURIComponent(symbolNorm)}" target="_blank">Ver</a></td>`;
                tbody.appendChild(tr);
              });
            }
          }catch(e){ console.error('Erro ao popular índices:', serializeError(e)); }
        })();

        // Populate NASDAQ table rows for static HTML (if present)
        (function populateNasdaqStatic(){
          try{
            const tbody = document.getElementById('nasdaqTableBody');
            if(!tbody) return;
            const nasdaqStocks = ['AAPL','MSFT','NVDA','AMZN','META','GOOG','GOOGL','TSLA','INTC','AMD'];
            const stockColors = { 'AAPL':'#555','MSFT':'#0078D4','GOOGL':'#4285F4','GOOG':'#4285F4','AMZN':'#FF9900','META':'#0866FF','NVDA':'#76B900','TSLA':'#E82127','INTC':'#0071C5','AMD':'#ED1C24' };
            tbody.innerHTML = nasdaqStocks.map(symbol => {
              const color = stockColors[symbol] || '#555';
              const icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' rx='3' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='white' font-size='11' font-weight='bold'%3E${symbol[0]}%3C/text%3E%3C/svg%3E`;
              return `
                <tr id="nasdaq-${symbol}">
                  <td>
                    <div class="stock-symbol">
                      <img src="${icon}" style="width: 20px; height: 20px; margin-right: 6px;" alt="${symbol}">
                      <a href="https://finance.yahoo.com/quote/${symbol}" target="_blank" style="color: inherit; text-decoration: none;" title="Ver no Yahoo Finance">${symbol}</a>
                    </div>
                  </td>
                  <td class="nasdaq-market-price">--</td>
                  <td class="nasdaq-market-change">--</td>
                  <td class="time-col nasdaq-market-time">--</td>
                  <td class="nasdaq-extended-price">--</td>
                  <td class="nasdaq-extended-change">--</td>
                  <td class="time-col nasdaq-extended-time">--</td>
                  <td class="nasdaq-frozen">--</td>
                  <td class="nasdaq-diff">--</td>
                </tr>
              `;
            }).join('');
          }catch(e){ console.error('Erro ao popular NASDAQ estático:', serializeError(e)); }
        })();

        // Periodicamente buscar média NASDAQ do backend e atualizar cabeçalho
        (function fetchAndUpdateNasdaqAverage(){
          async function update() {
            try {
              const token = localStorage.getItem('token');
              const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const resp = await fetchWithAuthRetry('/api/data/nasdaq-average');
              if (!resp.ok) return;
              const body = await resp.json();
              if (body && body.average !== null) {
                const el = document.getElementById('nasdaqAverage');
                if (el) {
                  el.style.display = 'inline-block';
                  const strong = el.querySelector('strong');
                  strong.textContent = `${body.average > 0 ? '+' : ''}${body.average.toFixed(2)}%`;
                  el.classList.remove('buy-bg','sell-bg','neutral-bg');
                  if (body.average >= 0.25) el.classList.add('buy-bg');
                  else if (body.average <= -0.25) el.classList.add('sell-bg');
                  else el.classList.add('neutral-bg');
                }
              }
            } catch (e) { /* ignore */ }
          }
          update();
          setInterval(update, 10000);
        })();

        // Fetch and populate news feed for static HTML (if present)
        (async function populateNews(){
          try{
            const feed = document.getElementById('newsFeed');
            if(!feed) return;
            const token = localStorage.getItem('token');
            const resp = await fetchWithAuthRetry('/api/data/news');
            if(!resp.ok){
              console.warn('Não foi possível obter notícias:', resp.status);
              feed.innerHTML = '<div class="news-item"><span class="news-text">Nenhuma notícia disponível</span></div>';
              return;
            }
            const data = await resp.json();
            const list = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
            if(list.length===0){ feed.innerHTML = '<div class="news-item"><span class="news-text">Nenhuma notícia disponível</span></div>'; return; }
            // check if auto-translate is enabled
            const autoTranslate = localStorage.getItem('newsTranslated') === 'true';
            feed.innerHTML = list.slice(0,25).map(n=>{
              const time = n.time || n.fullDate || '';
              const title = n.title || 'Sem título';
              const url = n.url || '#';
              const source = n.source || '';
              return `<div class="news-item"><span class="news-time">${time}</span><span class="news-text"><a href="${url}" target="_blank" rel="noopener">${title}</a></span><span class="news-source">${source}</span></div>`;
            }).join('');

            // If auto-translate enabled, translate titles in-place (best-effort)
            if (autoTranslate) {
              try{
                const anchors = Array.from(feed.querySelectorAll('.news-text a'));
                anchors.forEach(async (a)=>{
                  try{
                    const txt = a.textContent || '';
                        try{
                          const tResp = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: txt, target: 'pt' })
                          });
                          if (tResp.ok) {
                            const tBody = await tResp.json();
                            if (tBody && tBody.translated) a.textContent = tBody.translated;
                          }
                        }catch(e){}
                  }catch(e){}
                });
              }catch(e){}
            }
          }catch(e){ console.error('Erro ao popular notícias (dashboard-vue):', serializeError(e)); }
        })();

      });

      return { panels };
    }
  }).mount('#panelToggles');

})();
