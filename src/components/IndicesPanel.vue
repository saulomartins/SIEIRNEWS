<template>
  <div class="panel panel-indices">
    <div class="panel-header-mini">
      <i class="bi bi-square-fill icon-blue"></i>
      <span>Índices Globais</span>
    </div>
    <div class="indices-table">
      <table>
        <thead>
          <tr>
            <th>Índice</th>
            <th>Último</th>
            <th>Var.%</th>
            <th>Hora</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="idx in indices" :key="idx.symbol">
            <td>{{ idx.name }}</td>
            <td>{{ idx.price }}</td>
            <td :class="idx.changeClass">{{ idx.changeText }}</td>
            <td>{{ idx.time }}</td>
            <td><a :href="idx.link" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i></a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'IndicesPanel',
  setup(){
    const API_URL = 'http://localhost:3000/api'
    const token = localStorage.getItem('token')
    const initial = [
      { symbol: '^DJI', name: 'Dow Jones', link: 'https://finance.yahoo.com/quote/%5EDJI/' },
      { symbol: '^GSPC', name: 'S&P 500', link: 'https://finance.yahoo.com/quote/%5EGSPC/' },
      { symbol: 'RTY=F', name: 'Russell 2000', link: 'https://finance.yahoo.com/quote/RTY=F/' }
    ]
    const indices = ref(initial.map(i=>({ ...i, price:'--', changeText:'--', changeClass:'', time:'--' })))
    let interval = null

    async function fetchIndices(){
      try{
        const symbols = initial.map(i=>i.symbol).join(',')
        const resp = await fetch(`${API_URL}/data?symbols=${encodeURIComponent(symbols)}`, { headers:{ 'Authorization': `Bearer ${token}` } })
        if(!resp.ok) throw new Error('HTTP '+resp.status)
        const arr = await resp.json()
        if(!Array.isArray(arr)) return
        arr.forEach(it=>{
          const idx = indices.value.find(x => {
            // compare normalized symbols
            const a = (x.symbol||'').toString().replace(/[^a-zA-Z0-9]/g,'')
            const b = (it.ticker||it.symbol||'').toString().replace(/[^a-zA-Z0-9]/g,'')
            return a === b
          })
          if(idx){
            idx.price = it.regularMarketPrice ?? '--'
            const ch = it.regularMarketChangePercent ?? 0
            idx.changeText = (ch>0?'+':'') + (ch!==null && ch !== undefined ? parseFloat(ch).toFixed(2) : '--') + '%'
            idx.changeClass = ch>0? 'price-positive' : (ch<0? 'price-negative' : '')
            idx.time = it.regularMarketTime ? new Date(it.regularMarketTime*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--'
          }
        })
      }catch(e){ console.error('Erro indices fetch',e) }
    }

    onMounted(()=>{ fetchIndices(); interval = setInterval(fetchIndices, 5000) })
    onBeforeUnmount(()=>{ if(interval) clearInterval(interval) })

    return { indices }
  }
}
</script>

<style scoped>
.panel{background:#fff;padding:10px;border-radius:6px;border:1px solid #e6e6e6;box-shadow:0 1px 2px rgba(0,0,0,0.03)}
.panel-header-mini{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px}
.icon-blue{color:#0ea5e9;font-size:0.9rem}
.indices-table { overflow:auto }
.indices-table table { width:100%; border-collapse: collapse; font-size:0.95rem }
.indices-table th, .indices-table td { padding:8px 10px; border-bottom:1px solid #f1f1f1 }
.indices-table thead th { text-align:left; color:#556; font-weight:700; font-size:0.85rem }
.indices-table tbody td { vertical-align:middle }
.indices-table tbody td:nth-child(2), .indices-table tbody td:nth-child(3), .indices-table tbody td:nth-child(4) { text-align:right }
.indices-table a { color:#0b5ed7; text-decoration:none }
.price-positive { color: #16a34a; font-weight:600 }
.price-negative { color: #ef4444; font-weight:600 }
@media (max-width: 800px){
  .panel{padding:8px}
  .indices-table thead{display:none}
  .indices-table table, .indices-table tbody, .indices-table tr, .indices-table td{display:block;width:100%}
  .indices-table tr{margin-bottom:8px;border-bottom:1px solid #eee}
  .indices-table td{padding:6px 0;text-align:left}
  .indices-table td:nth-child(2), .indices-table td:nth-child(3), .indices-table td:nth-child(4){text-align:left}
}
</style>
<template>
  <div class="panel panel-indices">
    <div class="panel-header">
      <span>🔵 Índices Globais</span>
    </div>
    <div class="indices-table">
      <table>
        <thead>
          <tr>
            <th>Índice</th>
            <th>Último</th>
            <th>Var.%</th>
            <th>Hora</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="idx in indices" :key="idx.symbol">
            <td>{{ idx.name }}</td>
            <td>{{ idx.price !== undefined ? formatPrice(idx.price) : '--' }}</td>
            <td :class="variationClass(idx.changePercent)">{{ formatPercent(idx.changePercent) }}</td>
            <td>{{ formatTime(idx.time) }}</td>
            <td><a :href="idx.link" target="_blank" rel="noopener">Ver</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import dataService from '../services/dataService';

export default {
  name: 'IndicesPanel',
  setup() {
    const indices = ref([
      { symbol: 'DOW', name: 'Dow Jones', link: 'https://finance.yahoo.com/quote/DOW/' },
      { symbol: '^GSPC', name: 'S&P 500', link: 'https://finance.yahoo.com/quote/%5EGSPC/' },
      { symbol: 'RTY=F', name: 'Russell 2000', link: 'https://finance.yahoo.com/quote/RTY=F/' }
    ]);

    const intervalId = ref(null);

    function formatPrice(p) { if (p === undefined || p === null) return '--'; try { return parseFloat(p).toFixed(2); } catch(e){ return p; } }
    function formatPercent(v) { if (v === undefined || v === null) return '--'; const n = parseFloat(v); if (isNaN(n)) return '--'; return (n>0?'+':'') + n.toFixed(2) + '%'; }
    function variationClass(v) { if (v === undefined || v === null) return ''; return parseFloat(v) >= 0 ? 'price-positive' : 'price-negative'; }
    function formatTime(ts) { if (!ts) return '--:--'; try { return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); } catch(e){ return ts; } }

    async function fetchIndices() {
      try {
        const symbols = indices.value.map(i => i.symbol);
        const res = await dataService.getStockData(symbols);
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res.tickers) list = res.tickers;
        else if (res.data && Array.isArray(res.data)) list = res.data;

        // merge data into indices
        indices.value = indices.value.map(idx => {
          const found = list.find(item => (item.ticker || item.symbol || '').toString().replace(/[^a-zA-Z0-9]/g,'') === (idx.symbol || '').toString().replace(/[^a-zA-Z0-9]/g,''));
          if (found) {
            return {
              ...idx,
              price: found.regularMarketPrice ?? found.regularMarketClose ?? found.price,
              changePercent: found.regularMarketChangePercent ?? found.regularMarketChangePercent,
              time: found.regularMarketTime ?? found.timestamp
            };
          }
          return idx;
        });
      } catch (e) { console.error('Erro ao buscar índices:', e); }
    }

    onMounted(()=>{
      fetchIndices();
      intervalId.value = setInterval(fetchIndices, 5000);
    });
    onBeforeUnmount(()=>{ if (intervalId.value) clearInterval(intervalId.value); });

    return { indices, formatPrice, formatPercent, variationClass, formatTime };
  }
}
</script>

<style scoped>
.indices-table table { width:100%; border-collapse: collapse; }
.indices-table th, .indices-table td { padding:6px 8px; border-bottom:1px solid #eee; }
.price-positive { color: #16a34a; }
.price-negative { color: #ef4444; }
</style>
<template>
  <div class="panel indices-panel">
    <div class="panel-header-mini">
      <i class="bi bi-square-fill icon-blue"></i>
      <span>Índices Globais</span>
    </div>
    <div class="indices-table">
      <table>
        <thead>
          <tr>
            <th>Índice</th>
            <th>Último</th>
            <th>Var.%</th>
            <th>Hora</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="idx in indices" :key="idx.symbol">
            <td>{{ idx.name }}</td>
            <td>{{ idx.price }}</td>
            <td :class="idx.changeClass">{{ idx.changeText }}</td>
            <td>{{ idx.time }}</td>
            <td><a :href="idx.link" target="_blank"><i class="bi bi-box-arrow-up-right"></i></a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'IndicesPanel',
  setup(){
    const API_URL = 'http://localhost:3000/api'
    const token = localStorage.getItem('token')
    const initial = [
      { symbol: 'DOW', name: 'Dow Jones', link: 'https://finance.yahoo.com/quote/DOW/' },
      { symbol: '^GSPC', name: 'S&P 500', link: 'https://finance.yahoo.com/quote/%5EGSPC/' },
      { symbol: 'RTY=F', name: 'Russell 2000', link: 'https://finance.yahoo.com/quote/RTY=F/' }
    ]
    const indices = ref(initial.map(i=>({ ...i, price:'--', changeText:'--', changeClass:'', time:'--' })))
    let interval = null

    async function fetchIndices(){
      try{
        const symbols = initial.map(i=>i.symbol).join(',')
        const resp = await fetch(`${API_URL}/data?symbols=${symbols}`, { headers:{ 'Authorization': `Bearer ${token}` } })
        if(!resp.ok) throw new Error('HTTP '+resp.status)
        const arr = await resp.json()
        arr.forEach(it=>{
          const idx = indices.value.find(x => (x.symbol === it.ticker || x.symbol === it.symbol))
          if(idx){ idx.price = it.regularMarketPrice ?? '--'; const ch = it.regularMarketChangePercent ?? 0; idx.changeText = (ch>0?'+':'')+ (ch!==null? ch.toFixed(2): '--') + '%'; idx.changeClass = ch>0? 'price-positive' : 'price-negative'; idx.time = it.regularMarketTime ? new Date(it.regularMarketTime*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--' }
        })
      }catch(e){ console.error('Erro indices fetch',e) }
    }

    onMounted(()=>{ fetchIndices(); interval = setInterval(fetchIndices, 1000) })
    onBeforeUnmount(()=>{ if(interval) clearInterval(interval) })

    return { indices }
  }
}
</script>

<style scoped>
.panel{background:#fff;padding:8px;border-radius:4px;border:1px solid #ddd}
</style>
