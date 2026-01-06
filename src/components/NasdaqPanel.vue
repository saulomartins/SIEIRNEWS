<template>
  <div class="panel panel-nasdaq">
    <div class="panel-header">
      <span>🔴 NASDAQ</span>
      <div style="margin-left:8px; font-size:0.9em; color:#6b7280">{{ lastUpdate }}</div>
      <div style="margin-left:auto; display:flex; gap:8px; align-items:center">
        <div id="nasdaqAverage" v-if="showAverage" :class="avgClass">Média: <strong>{{ formattedAverage }}</strong></div>
        <button class="btn-freeze" @click="toggleFreeze">{{ frozen ? 'Descongelar' : 'Congelar' }}</button>
      </div>
    </div>

    <div class="nasdaq-table">
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Preço</th>
            <th>Var.%</th>
            <th class="time-col">Hora</th>
            <th>Pre-Mkt Var.%</th>
            <th class="time-col">Hora</th>
            <th v-if="frozen">Congelado</th>
            <th v-if="frozen">Dif</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stocks" :key="stock.ticker">
            <td class="symbol">{{ stock.ticker }}</td>
            <td>{{ stock.atClose?.price || stock.regularMarketPrice || '--' }}</td>
            <td :class="variationClass(stock.atClose?.changePercent || stock.regularMarketChangePercent)">
              {{ formatPercent(stock.atClose?.changePercent || stock.regularMarketChangePercent) }}
            </td>
            <td class="time">{{ formatTime(stock.regularMarketTime) }}</td>
            <td :class="variationClass(stock.extended?.changePercent)">{{ formatPercent(stock.extended?.changePercent) }}</td>
            <td class="time">{{ formatTime(stock.extended?.time) }}</td>
            <td v-if="frozen">{{ stock.frozen || '--' }}</td>
            <td v-if="frozen" :class="differenceClass(stock.diff)">{{ stock.diff || '--' }}</td>
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
  name: 'NasdaqPanel',
  props: {
    symbols: { type: Array, default: () => ['AAPL','MSFT','NVDA','AMZN','META','GOOG','GOOGL','TSLA','INTC','AMD'] }
  },
  setup(props) {
    const stocks = ref([]);
    const frozen = ref(false);
    const frozenValues = ref({});
    const lastUpdate = ref('--:--:--');
    const intervalId = ref(null);
    const showAverage = ref(false);
    const average = ref(0);

    function formatTime(ts) {
      if (!ts) return '--:--';
      try { return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e){return '--:--';}
    }

    function formatPercent(v) {
      if (v === undefined || v === null) return '--';
      const n = parseFloat(v);
      if (isNaN(n)) return '--';
      return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    function variationClass(v) {
      if (v === undefined || v === null) return '';
      return parseFloat(v) >= 0 ? 'price-positive' : 'price-negative';
    }

    function differenceClass(val) {
      if (!val || val === '--' || val === '—') return '';
      const n = parseFloat(val.toString().replace('%','').replace('+','').replace('↑','').replace('↓',''));
      return n > 0 ? 'price-positive' : (n < 0 ? 'price-negative' : '');
    }

    async function fetchStocks() {
      try {
        const res = await dataService.getStockData(props.symbols);
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res.tickers) list = res.tickers;
        else if (res.data && Array.isArray(res.data)) list = res.data;

        // normalize
        stocks.value = list.map(item => ({
          ticker: item.ticker || item.symbol || item.SYMBOL || item.shortName || '—',
          atClose: item.atClose || { price: item.regularMarketPrice, changePercent: item.regularMarketChangePercent },
          regularMarketPrice: item.regularMarketPrice,
          regularMarketChangePercent: item.regularMarketChangePercent,
          regularMarketTime: item.regularMarketTime,
          extended: item.extended || {},
          frozen: '--',
          diff: '--'
        }));

        lastUpdate.value = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

        // update frozen diffs
        if (frozen.value) updateDiffs();
        else computeAverage();
      } catch (e) {
        console.error('Erro ao buscar NASDAQ:', e);
      }
    }

    function toggleFreeze() {
      frozen.value = !frozen.value;
      if (frozen.value) {
        // capture current percent for each
        stocks.value.forEach(s => {
          const periodVal = s.extended?.isExtendedHours ? s.extended.changePercent : s.atClose?.changePercent || s.regularMarketChangePercent || 0;
          const num = (periodVal === null || periodVal === undefined) ? 0 : parseFloat(periodVal);
          frozenValues.value[s.ticker] = num;
          s.frozen = (num !== null && num !== undefined) ? (num > 0 ? '+'+num.toFixed(2)+'%' : num.toFixed(2)+'%') : '--';
          s.diff = '--';
        });
        showAverage.value = true;
      } else {
        frozenValues.value = {};
        stocks.value.forEach(s => { s.frozen = '--'; s.diff = '--'; });
        showAverage.value = false;
        average.value = 0;
      }
    }

    function updateDiffs() {
      let total = 0; let count = 0;
      stocks.value.forEach(s => {
        const frozenVal = frozenValues.value[s.ticker];
        const period = s.extended?.isExtendedHours ? s.extended.changePercent : s.atClose?.changePercent || s.regularMarketChangePercent || 0;
        const currentVal = (period === null || period === undefined) ? 0 : parseFloat(period);
        if (typeof frozenVal === 'number') {
          const diff = currentVal - frozenVal;
          if (Math.abs(diff) < 0.01) {
            s.diff = '—';
          } else {
            s.diff = (diff > 0 ? '↑ ' : '↓ ') + Math.abs(diff).toFixed(2) + '%';
          }
          total += diff; count++;
        }
      });
      if (count>0) {
        average.value = total / count;
      }
    }

    function computeAverage() {
      // compute average of current market change across stocks
      let total=0; let count=0;
      stocks.value.forEach(s => {
        const val = s.atClose?.changePercent ?? s.regularMarketChangePercent;
        if (val !== null && val !== undefined) { total += parseFloat(val); count++; }
      });
      if (count>0) average.value = total/count;
    }

    const formattedAverage = () => (average.value >= 0 ? '+' : '') + average.value.toFixed(2) + '%';
    const avgClass = () => average.value >= 0.25 ? 'buy-bg' : (average.value <= -0.25 ? 'sell-bg' : 'neutral-bg');

    onMounted(()=>{
      fetchStocks();
      intervalId.value = setInterval(() => { fetchStocks(); if (frozen.value) updateDiffs(); }, 5000);
    });

    onBeforeUnmount(()=>{ if (intervalId.value) clearInterval(intervalId.value); });

    return {
      stocks, frozen, toggleFreeze, formatPercent, formatTime, variationClass, differenceClass,
      lastUpdate, showAverage, formattedAverage: formattedAverage(), avgClass: avgClass(), average
    };
  }
}
</script>

<style scoped>
.nasdaq-table table { width: 100%; border-collapse: collapse; }
.nasdaq-table th, .nasdaq-table td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
.time-col { width: 90px; }
.price-positive { color: #16a34a; }
.price-negative { color: #ef4444; }
.buy-bg { background: #059669; color: #fff; padding: 4px 8px; border-radius: 4px; }
.sell-bg { background: #dc2626; color: #fff; padding: 4px 8px; border-radius: 4px; }
.neutral-bg { background: #6b7280; color: #fff; padding: 4px 8px; border-radius: 4px; }
</style><template>
  <div class="panel nasdaq-panel">
    <div class="panel-header-mini">
      <i class="bi bi-square-fill icon-red"></i>
      <span>NASDAQ</span>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="nasdaqLastUpdate" class="text-muted">Atualizando...</span>
        <button class="btn-freeze" @click="toggleFreeze">{{ frozen ? 'Descongelar' : 'Congelar' }}</button>
      </div>
    </div>

    <div class="nasdaq-table">
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Preço</th>
            <th>Var.%</th>
            <th class="time-col">Hora</th>
            <th>Pre-Market Var.%</th>
            <th class="time-col">Hora</th>
            <th>Var.% Congelada</th>
            <th>Diferença</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in stocks" :key="s.symbol">
            <td>
              <div class="stock-symbol">
                <img :src="s.icon" style="width:20px;height:20px;margin-right:6px" />
                <a :href="`https://finance.yahoo.com/quote/${s.symbol}`" target="_blank">{{ s.symbol }}</a>
              </div>
            </td>
            <td>{{ s.marketPrice }}</td>
            <td :class="s.marketChangeClass">{{ s.marketChangeText }}</td>
            <td class="time-col">{{ s.marketTime }}</td>
            <td :class="s.extendedChangeClass">{{ s.extendedChangeText }}</td>
            <td class="time-col">{{ s.extendedTime }}</td>
            <td :class="s.frozenClass">{{ s.frozenText }}</td>
            <td :class="s.diffClass">{{ s.diffText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'NasdaqPanel',
  setup(){
    const API_URL = 'http://localhost:3000/api'
    const token = localStorage.getItem('token')
    const nasdaqSymbols = ['AAPL','MSFT','NVDA','AMZN','META','GOOG','GOOGL','TSLA','INTC','AMD']
    const stocks = ref([])
    const frozen = ref(false)
    const frozenValues = {}
    let interval = null

    function initStocks(){
      const stockColors = { 'AAPL':'#555','MSFT':'#0078D4','GOOGL':'#4285F4','GOOG':'#4285F4','AMZN':'#FF9900','META':'#0866FF','NVDA':'#76B900','TSLA':'#E82127','INTC':'#0071C5','AMD':'#ED1C24' }
      stocks.value = nasdaqSymbols.map(sym=>({ symbol: sym, icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' rx='3' fill='${encodeURIComponent(stockColors[sym]||'#555')}'/%3E%3C/text%3E%3C/svg%3E`, marketPrice:'--', marketChangeText:'--', marketChangeClass:'', marketTime:'--', extendedChangeText:'--', extendedChangeClass:'', extendedTime:'--', frozenText:'--', frozenClass:'', diffText:'--', diffClass:'' }))
    }

    function toggleFreeze(){ frozen.value = !frozen.value; if(frozen.value) stocks.value.forEach(s=>{ frozenValues[s.symbol]=s.frozenText }) }

    function getTradingPeriod(){ const now = new Date(); const mins = now.getHours()*60 + now.getMinutes(); const marketStart = 11*60+30; const marketEnd = 18*60; const preStart = 19*60+20; const preEnd = 11*60+59; if(mins>=marketStart && mins<=marketEnd) return 'MARKET'; if(mins>=preStart || mins<=preEnd) return 'PRE-MARKET'; return 'CLOSED' }

    async function fetchData(){
      try{
        const resp = await fetch(`${API_URL}/data?symbols=${nasdaqSymbols.join(',')}`, { headers:{ 'Authorization': `Bearer ${token}` } })
        if(!resp.ok) throw new Error('HTTP '+resp.status)
        const arr = await resp.json()
        const map = {}
        arr.forEach(it=>{ if(it && it.ticker) map[it.ticker]=it })
        let updatedCount=0
        stocks.value.forEach(s=>{
          const stock = map[s.symbol]
          if(!stock) return
          updatedCount++
          const marketPrice = stock.regularMarketPrice?.toFixed(2) || '--'
          const marketChange = stock.regularMarketChangePercent || 0
          const marketChangeText = (marketChange>0?'+':'')+marketChange.toFixed(2)+'%'
          const marketChangeClass = marketChange>0 ? 'price-positive':'price-negative'
          const marketTime = stock.regularMarketTime? new Date(stock.regularMarketTime*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--'
          let extendedChangeText='--', extendedChangeClass='', extendedTime='--'
          if(stock.extended?.isExtendedHours && stock.extended.price){ const ext = stock.extended.changePercent||0; extendedChangeText=(ext>0?'+':'')+ext.toFixed(2)+'%'; extendedChangeClass = ext>0?'price-positive':'price-negative'; extendedTime = stock.extended.time? new Date(stock.extended.time*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) }
          s.marketPrice = marketPrice; s.marketChangeText = marketChangeText; s.marketChangeClass = marketChangeClass; s.marketTime = marketTime; s.extendedChangeText = extendedChangeText; s.extendedChangeClass = extendedChangeClass; s.extendedTime = extendedTime

          if(frozen.value && frozenValues[s.symbol]){ s.frozenText = frozenValues[s.symbol]; s.frozenClass = s.frozenText.includes('+') ? 'price-positive':'price-negative'; const frozenVal = parseFloat(s.frozenText.replace('%','').replace('+','')); const period = getTradingPeriod(); const currentVal = (period==='PRE-MARKET' && stock.extended?.isExtendedHours) ? (stock.extended.changePercent||0) : (stock.regularMarketChangePercent||0); const diff = currentVal - frozenVal; if(Math.abs(diff)<0.01){ s.diffText='—'; s.diffClass=''; } else { s.diffText = (diff>0?'↑ ':'↓ ')+Math.abs(diff).toFixed(2)+'%'; s.diffClass = diff>0? 'price-positive':'price-negative' } }
          else { const period = getTradingPeriod(); const currentValue = (period==='PRE-MARKET' && stock.extended?.isExtendedHours) ? s.extendedChangeText : s.marketChangeText; s.frozenText = currentValue; s.frozenClass = currentValue.includes('+') ? 'price-positive':'price-negative'; s.diffText='--'; s.diffClass=''; }
        })
        // update last update display
        const lastUpdateEl = document.getElementById('nasdaqLastUpdate')
        if(lastUpdateEl){ const now = new Date(); lastUpdateEl.textContent = `🔄 ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` }
      }catch(e){ console.error('Erro NASDAQ fetch',e) }
    }

    onMounted(()=>{ initStocks(); fetchData(); interval = setInterval(fetchData, 1000) })
    onBeforeUnmount(()=>{ if(interval) clearInterval(interval) })

    return { stocks, frozen, toggleFreeze }
  }
}
</script>

<style scoped>
.panel{background:#fff;padding:8px;border-radius:4px;border:1px solid #ddd}
.panel-header-mini{display:flex;align-items:center;justify-content:space-between}
</style>
