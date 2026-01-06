// Minimal Vue integration for dashboard layout (uses Vue 3 global build + SortableJS)
(function(){
  if (typeof Vue === 'undefined') {
    console.warn('Vue not loaded; dashboard-vue will not initialize.');
    return;
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
        } catch (e) { console.error('Erro ao salvar layout:', e); }
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
        } catch (e) { console.error('Erro ao carregar layout:', e); }
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
        } catch (e) { console.error('Erro iniciando Sortable:', e); }

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
          }catch(e){ console.error('Erro no auto-login', e); }
        }

        await tryAutoLogin();

        // Fetch and populate indices table for static HTML (if present)
        (async function populateIndices(){
          try{
            const tbody = document.getElementById('indicesTableBody');
            if(!tbody) return;
            const symbols = ['^DJI','^GSPC','RTY=F'].join(',');
            const token = localStorage.getItem('token');
            const resp = await fetch(`/api/data?symbols=${encodeURIComponent(symbols)}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if(!resp.ok){
              console.warn('Não foi possível obter índices:', resp.status);
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
          }catch(e){ console.error('Erro ao popular índices:', e); }
        })();

      });

      return { panels };
    }
  }).mount('#panelToggles');

})();
