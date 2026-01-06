<template>
  <div class="panel panel-metals">
    <div class="panel-header">
      <span>🔴 Metais</span>
      <div style="margin-left:auto; display:flex; gap:8px; align-items:center">
        <button class="btn-freeze" @click="toggleFreeze">{{ frozen ? 'Descongelar' : 'Congelar' }}</button>
      </div>
    </div>

    <div class="metals-table">
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Último</th>
            <th>Var.M%</th>
            <th v-if="frozen">Congelado</th>
            <th v-if="frozen">Dif</th>
            <th class="time-col">Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="metal in metals" :key="metal.ticker">
            <td class="symbol">{{ metal.ticker }}</td>
            <td>{{ metal.regularMarketPrice !== undefined ? metal.regularMarketPrice.toFixed(2) : '--' }}</td>
            <td :class="variationClass(metal.regularMarketChangePercent)">{{ formatPercent(metal.regularMarketChangePercent) }}</td>
            <td v-if="frozen">{{ metal.frozen || '--' }}</td>
            <td v-if="frozen" :class="differenceClass(metal.diff)">{{ metal.diff || '--' }}</td>
            <td class="time">{{ formatTime(metal.regularMarketTime) }}</td>
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
  name: 'MetalsPanel',
  props: {
    symbols: { type: Array, default: () => ['GC=F','SI=F','PL=F','HG=F','BZ=F'] }
  },
  setup(props) {
    const metals = ref([]);
    const frozen = ref(false);
    const frozenValues = ref({});
    const intervalId = ref(null);

    function formatTime(ts) { if (!ts) return '--:--'; try { return new Date(ts * 1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); } catch(e){ return '--:--'; } }
    function formatPercent(v) { if (v === undefined || v === null) return '--'; const n = parseFloat(v); if (isNaN(n)) return '--'; return (n>0?'+':'') + n.toFixed(2) + '%'; }
    function variationClass(v) { if (v === undefined || v === null) return ''; return parseFloat(v) >= 0 ? 'price-positive' : 'price-negative'; }
    function differenceClass(val) { if (!val || val==='--' || val==='—') return ''; const n = parseFloat(val.toString().replace('%','').replace('+','').replace('↑','').replace('↓','')); return n>0?'price-positive':(n<0?'price-negative':''); }

    async function fetchMetals() {
      try {
        const res = await dataService.getStockData(props.symbols);
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res.tickers) list = res.tickers;
        metals.value = list.map(item => ({
          ticker: item.ticker || item.symbol || '—',
          regularMarketPrice: item.regularMarketPrice,
          regularMarketChangePercent: item.regularMarketChangePercent,
          regularMarketTime: item.regularMarketTime,
          frozen: '--',
          diff: '--'
        }));
        if (frozen.value) updateDiffs();
      } catch (e) { console.error('Erro ao buscar metais:', e); }
    }

    function toggleFreeze(){
      frozen.value = !frozen.value;
      if (frozen.value) {
        metals.value.forEach(m => {
          const val = m.regularMarketChangePercent ?? 0;
          frozenValues.value[m.ticker] = val;
          m.frozen = (val>0?'+':'') + parseFloat(val || 0).toFixed(2) + '%';
          m.diff = '--';
        });
      } else {
        frozenValues.value = {};
        metals.value.forEach(m => { m.frozen='--'; m.diff='--'; });
      }
    }

    function updateDiffs(){
      metals.value.forEach(m => {
        const frozenVal = frozenValues.value[m.ticker];
        const current = m.regularMarketChangePercent ?? 0;
        const diff = current - (frozenVal ?? 0);
        if (Math.abs(diff) < 0.01) m.diff = '—'; else m.diff = (diff>0?'↑ ':'↓ ')+Math.abs(diff).toFixed(2)+'%';
      });
    }

    onMounted(()=>{ fetchMetals(); intervalId.value = setInterval(()=>{ fetchMetals(); if (frozen.value) updateDiffs(); }, 5000); });
    onBeforeUnmount(()=>{ if (intervalId.value) clearInterval(intervalId.value); });

    return { metals, frozen, toggleFreeze, formatPercent, formatTime, variationClass, differenceClass };
  }
}
</script>

<style scoped>
.metals-table table { width:100%; border-collapse: collapse; }
.metals-table th, .metals-table td { padding:6px 8px; border-bottom:1px solid #eee; }
.price-positive { color: #16a34a; }
.price-negative { color: #ef4444; }
</style>
<template>
  <div class="panel metals-panel">
    <div class="panel-header-mini">
      <i class="bi bi-square-fill icon-red"></i>
      <span>Metais</span>
      <button class="btn-freeze" @click="toggleFreeze">{{ frozen ? 'Descongelar' : 'Congelar' }}</button>
    </div>

    <div class="metals-table">
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Último</th>
            <th>Var.%</th>
            <th>Var.% Congelada</th>
            <th>Diferença</th>
            <th class="time-col">Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in metalsData" :key="m.symbol">
            <td>
              <div class="stock-symbol">
                <div class="stock-icon" :class="m.icon">{{ m.name[0] }}</div>
                <a :href="`https://finance.yahoo.com/quote/${m.symbol}`" target="_blank">{{ m.name }}</a>
              </div>
            </td>
            <td>{{ m.price }}</td>
            <td :class="m.changeClass">{{ m.changeText }}</td>
            <td :class="m.frozenClass">{{ m.frozenText }}</td>
            <td :class="m.diffClass">{{ m.diffText }}</td>
            <td class="metal-time">{{ m.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'MetalsPanel',
  setup() {
    const API_URL = 'http://localhost:3000/api'
    const token = localStorage.getItem('token')

    const metalsList = ['GC=F','SI=F','PL=F','HG=F','BZ=F']
    const metalNames = { 'GC=F':'Ouro','SI=F':'Prata','PL=F':'Platina','HG=F':'Cobre','BZ=F':'Min. Ferro' }
    const metalsData = ref([])
    const frozen = ref(false)
    const frozenValues = {}
    let interval = null

    function buildEmpty() {
      metalsData.value = metalsList.map(s=>({ symbol: s, name: metalNames[s]||s, price: '--', changeText: '--', changeClass:'', frozenText:'--', frozenClass:'', diffText:'--', diffClass:'', time:'--', icon: '' }))
    }

    function toggleFreeze(){ frozen.value = !frozen.value; if(frozen.value){ // capture current frozen
        metalsData.value.forEach(m=>{ frozenValues[m.symbol]=m.changeText }) } }

    function applyData(map){
      metalsData.value.forEach(m=>{
        const stock = map[m.symbol]
        if(!stock) return
        let price, change
        if(stock.extended?.isExtendedHours && stock.extended.price){ price = stock.extended.price.toFixed(2); change = stock.extended.changePercent || 0 }
        else{ price = stock.regularMarketPrice?.toFixed(2) || '--'; change = stock.regularMarketChangePercent || 0 }
        const changeText = (change>0?'+':'')+change.toFixed(2)+'%'
        const changeClass = change>0 ? 'price-positive' : 'price-negative'
        const time = stock.regularMarketTime ? new Date(stock.regularMarketTime*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--'
        m.price = price
        m.changeText = changeText
        m.changeClass = changeClass
        m.time = time

        if(frozen.value && frozenValues[m.symbol]){
          const fv = frozenValues[m.symbol]
          m.frozenText = fv
          m.frozenClass = fv.includes('+') ? 'price-positive' : 'price-negative'
          const frozenValNum = parseFloat(fv.replace('%','').replace('+',''))
          const diff = change - frozenValNum
          if(Math.abs(diff)<0.01){ m.diffText = '—'; m.diffClass = '' }
          else { m.diffText = (diff>0? '↑ ':'↓ ')+Math.abs(diff).toFixed(2)+'%'; m.diffClass = diff>0? 'price-positive':'price-negative' }
        } else {
          m.frozenText = changeText
          m.frozenClass = changeClass
          m.diffText = '--'
          m.diffClass = ''
        }
      })
    }

    async function fetchData(){
      try{
        const resp = await fetch(`${API_URL}/data?symbols=${metalsList.join(',')}`, { headers:{ 'Authorization': `Bearer ${token}` } })
        if(!resp.ok) throw new Error('HTTP '+resp.status)
        const arr = await resp.json()
        const map = {}
        arr.forEach(it=>{ if(it && it.ticker) map[it.ticker]=it })
        applyData(map)
      }catch(e){ console.error('Erro metals fetch',e) }
    }

    onMounted(()=>{ buildEmpty(); fetchData(); interval = setInterval(fetchData, 1000) })
    onBeforeUnmount(()=>{ if(interval) clearInterval(interval) })

    return { metalsData, frozen, toggleFreeze }
  }
}
</script>

<style scoped>
.panel{background:#fff;padding:8px;border-radius:4px;border:1px solid #ddd}
.panel-header-mini{display:flex;align-items:center;justify-content:space-between}
.metal-time{font-size:0.9em;color:#666}
</style>
