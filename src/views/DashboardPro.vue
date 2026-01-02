<template>
  <div class="dashboard-pro">
    <!-- Header Premium -->
    <nav class="navbar-pro">
      <div class="header-container">
        <div class="logo-section">
          <h1 class="logo-title">SEIER<span class="logo-red">TRADER</span></h1>
          <p class="logo-subtitle">BATTLE</p>
        </div>
        <div class="header-controls">
          <span class="time-display">{{ currentTime }}</span>
          <button class="btn-icon" @click="handleLogout" title="Sair">❌</button>
        </div>
      </div>
    </nav>

    <!-- Modal Palavras-Chave -->
    <div v-if="showKeywordsModal" class="modal-overlay" @click.self="showKeywordsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔑 Palavras-Chave</h3>
          <button @click="showKeywordsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <input v-model="newKeyword" @keyup.enter="addKeyword" placeholder="Palavra-chave..." />
            <button @click="addKeyword">Adicionar</button>
          </div>
          <div class="keywords-list">
            <div v-for="kw in keywords" :key="kw" class="keyword-item">
              <span>{{ kw }}</span>
              <button @click="removeKeyword(kw)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Container -->
    <div class="dashboard-container">
      <!-- COLUNA ESQUERDA -->
      <div class="left-column" :style="{width: leftWidth + 'px'}">
        <!-- NASDAQ -->
        <div class="panel">
          <div class="panel-header">
            <span>🔴 NASDAQ</span>
            <button @click="toggleFreeze('nasdaq')">{{ nasdaqFrozen ? '🔓' : '🔒' }}</button>
          </div>
          <div class="table-container">
            <table class="nasdaq-table">
              <thead>
                <tr>
                  <th rowspan="2">Ativo</th>
                  <th colspan="3">MERCADO</th>
                  <th colspan="3">PRE-MARKET</th>
                  <th rowspan="2" v-if="nasdaqFrozen">Congelado</th>
                  <th rowspan="2" v-if="nasdaqFrozen">Dif</th>
                </tr>
                <tr>
                  <th>Preço</th>
                  <th>Var.M%</th>
                  <th>Hora</th>
                  <th>Preço</th>
                  <th>Var.P%</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stock in nasdaqData" :key="stock.ticker">
                  <td class="symbol">{{ stock.ticker }}</td>
                  <td>{{ stock.atClose?.price || '--' }}</td>
                  <td :class="getVariationClass(stock.atClose?.changePercent)">
                    {{ formatPercent(stock.atClose?.changePercent) }}%
                  </td>
                  <td class="time">{{ formatTime(stock.regularMarketTime) }}</td>
                  <td>{{ stock.extended?.priceFormatted || '--' }}</td>
                  <td :class="getVariationClass(stock.extended?.changePercent)">
                    {{ formatPercent(stock.extended?.changePercent) }}%
                  </td>
                  <td class="time">{{ stock.extended?.label || '--' }}</td>
                  <td v-if="nasdaqFrozen">{{ stock.frozen || '--' }}</td>
                  <td v-if="nasdaqFrozen" :class="getDifferenceClass(stock.diff)">
                    {{ stock.diff || '--' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- METAIS -->
        <div class="panel" style="margin-top: 10px;">
          <div class="panel-header">
            <span>🔴 Metais</span>
            <button @click="toggleFreeze('metals')">{{ metalsFrozen ? '🔓' : '🔒' }}</button>
          </div>
          <div class="table-container">
            <table class="metals-table">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Último</th>
                  <th>Var.M%</th>
                  <th v-if="metalsFrozen">Congelado</th>
                  <th v-if="metalsFrozen">Dif</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="metal in metalsData" :key="metal.ticker">
                  <td class="symbol">{{ metal.ticker }}</td>
                  <td>{{ metal.regularMarketPrice || '--' }}</td>
                  <td :class="getVariationClass(metal.regularMarketChangePercent)">
                    {{ formatPercent(metal.regularMarketChangePercent) }}%
                  </td>
                  <td v-if="metalsFrozen">{{ metal.frozen || '--' }}</td>
                  <td v-if="metalsFrozen" :class="getDifferenceClass(metal.diff)">
                    {{ metal.diff || '--' }}
                  </td>
                  <td class="time">{{ formatTime(metal.regularMarketTime) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Resizer 1 -->
      <div class="resizer" @mousedown="startResize($event, 'left')"></div>

      <!-- COLUNA CENTRO -->
      <div class="center-column">
        <div class="panel">
          <div class="panel-header">
            <span>🔴 SEIER News</span>
            <div class="news-controls">
              <button>🔔</button>
              <button>🔊</button>
            </div>
          </div>
          <div class="news-controls-bar">
            <button @click="decreaseFontSize">-</button>
            <button @click="increaseFontSize">+</button>
            <button @click="translateNews">{{ newsTranslated ? 'Original' : 'Traduzir' }}</button>
            <button @click="showKeywordsModal = true" title="Palavras-chave">🔑</button>
          </div>
          <div class="news-feed" :style="{fontSize: newsFontSize + 'px'}">
            <div v-if="loadingNews" class="loading">Carregando notícias...</div>
            <div v-else-if="news.length === 0" class="no-news">Nenhuma notícia disponível</div>
            <div v-else v-for="(item, index) in news" :key="index" class="news-item">
              <div class="news-time">{{ item.time }}</div>
              <div class="news-category">{{ item.category }}</div>
              <h4 class="news-title" v-html="highlightKeywords(item.title)"></h4>
              <p class="news-description" v-html="highlightKeywords(item.description)"></p>
              <a v-if="item.link" :href="item.link" target="_blank" class="news-link">Ler mais →</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Resizer 2 -->
      <div class="resizer" @mousedown="startResize($event, 'right')"></div>

      <!-- COLUNA DIREITA -->
      <div class="right-column" :style="{width: rightWidth + 'px'}">
        <div class="panel">
          <div class="panel-header">
            <span>🔴 S&P 500 Setores</span>
          </div>
          <div class="sectors-container">
            <div v-for="(stocks, sector) in sp500Data" :key="sector" class="sector">
              <div class="sector-header" @click="toggleSector(sector)">
                <span>{{ sector }}</span>
                <span>{{ expandedSectors[sector] ? '▼' : '▶' }}</span>
              </div>
              <div v-show="expandedSectors[sector]" class="sector-stocks">
                <div v-for="stock in stocks" :key="stock.ticker" class="stock-mini">
                  <span>{{ stock.ticker }}</span>
                  <span>{{ stock.atClose?.price || stock.regularMarketPrice }}</span>
                  <span :class="getVariationClass(stock.atClose?.changePercent || stock.regularMarketChangePercent)">
                    {{ formatPercent(stock.atClose?.changePercent || stock.regularMarketChangePercent) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import dataService from '../services/dataService';
import '../assets/dashboard-pro.css';

export default {
  name: 'DashboardPro',
  setup() {
    const router = useRouter();
    
    // Estado
    const currentTime = ref('00:00:00');
    const nasdaqData = ref([]);
    const metalsData = ref([]);
    const news = ref([]);
    const sp500Data = ref({});
    const nasdaqFrozen = ref(false);
    const metalsFrozen = ref(false);
    const nasdaqFrozenValues = ref({});
    const metalsFrozenValues = ref({});
    const newsTranslated = ref(false);
    const originalNews = ref([]);
    const loadingNews = ref(false);
    const newsFontSize = ref(14);
    const showKeywordsModal = ref(false);
    const keywords = ref([]);
    const newKeyword = ref('');
    const expandedSectors = ref({});
    const leftWidth = ref(400);
    const rightWidth = ref(350);
    
    // Símbolos
    const nasdaqSymbols = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOG', 'GOOGL', 'TSLA', 'INTC', 'AMD'];
    const metalsSymbols = ['GC=F', 'SI=F', 'PL=F', 'HG=F', 'CL=F'];
    const sp500Sectors = {
      'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
      'Healthcare': ['JNJ', 'UNH', 'LLY', 'ABBV', 'MRK'],
      'Financials': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      'Consumer': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
      'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    };
    
    // Carregar palavras-chave
    const loadKeywords = () => {
      const stored = localStorage.getItem('newsKeywords');
      if (stored) {
        keywords.value = JSON.parse(stored);
      }
    };
    
    // Salvar palavras-chave
    const saveKeywords = () => {
      localStorage.setItem('newsKeywords', JSON.stringify(keywords.value));
    };
    
    // Adicionar palavra-chave
    const addKeyword = () => {
      const kw = newKeyword.value.trim().toLowerCase();
      if (kw && !keywords.value.includes(kw)) {
        keywords.value.push(kw);
        saveKeywords();
        newKeyword.value = '';
      }
    };
    
    // Remover palavra-chave
    const removeKeyword = (keyword) => {
      keywords.value = keywords.value.filter(k => k !== keyword);
      saveKeywords();
    };
    
    // Destacar palavras-chave
    const highlightKeywords = (text) => {
      if (!text || keywords.value.length === 0) return text;
      
      let highlighted = text;
      keywords.value.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      });
      return highlighted;
    };
    
    // Formatar tempo
    const formatTime = (timestamp) => {
      if (!timestamp) return '--:--';
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };
    
    // Formatar porcentagem
    const formatPercent = (value) => {
      if (!value && value !== 0) return '--';
      const num = parseFloat(value);
      return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    };
    
    // Classe de variação
    const getVariationClass = (value) => {
      if (!value) return '';
      return parseFloat(value) >= 0 ? 'positive' : 'negative';
    };
    
    // Classe de diferença
    const getDifferenceClass = (value) => {
      if (!value) return '';
      const num = parseFloat(value);
      if (num > 0) return 'positive';
      if (num < 0) return 'negative';
      return '';
    };
    
    // Verificar período de mercado baseado no horário
    const getCurrentMarketPeriod = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeInMinutes = hour * 60 + minute;
      // MERCADO: 11:30 às 18:00 (690 a 1080 minutos)
      if (timeInMinutes >= 690 && timeInMinutes <= 1080) {
        return 'market';
      } else {
        return 'premarket';
      }
    };
    
    // Congelar/Descongelar
    const toggleFreeze = (type) => {
      if (type === 'nasdaq') {
        nasdaqFrozen.value = !nasdaqFrozen.value;
        if (nasdaqFrozen.value) {
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          const timeInMinutes = hour * 60 + minute;
          nasdaqData.value.forEach(stock => {
            let currentVar = null;
            // 11:30 (690) até 18:00 (1080) pega MERCADO, fora disso pega PRE-MARKET
            if (timeInMinutes >= 690 && timeInMinutes <= 1080) {
              currentVar = (typeof stock.atClose?.changePercent === 'number') ? stock.atClose.changePercent : null;
            } else {
              currentVar = (typeof stock.extended?.changePercent === 'number') ? stock.extended.changePercent : null;
            }
            nasdaqFrozenValues.value[stock.ticker] = currentVar;
            stock.frozen = (currentVar !== null) ? (formatPercent(currentVar) + '%') : '--';
            stock.diff = '--';
          });
        } else {
          Object.keys(nasdaqFrozenValues.value).forEach(ticker => {
            nasdaqFrozenValues.value[ticker] = null;
          });
          nasdaqData.value.forEach(stock => {
            stock.frozen = '--';
            stock.diff = '--';
          });
        }
      } else if (type === 'metals') {
        metalsFrozen.value = !metalsFrozen.value;
        if (metalsFrozen.value) {
          metalsData.value.forEach(metal => {
            const currentVar = (typeof metal.regularMarketChangePercent === 'number') ? metal.regularMarketChangePercent : null;
            metalsFrozenValues.value[metal.ticker] = currentVar;
            metal.frozen = (currentVar !== null) ? (formatPercent(currentVar) + '%') : '--';
            metal.diff = '--';
          });
        } else {
          Object.keys(metalsFrozenValues.value).forEach(ticker => {
            metalsFrozenValues.value[ticker] = null;
          });
          metalsData.value.forEach(metal => {
            metal.frozen = '--';
            metal.diff = '--';
          });
        }
      }
    };
    
    // Calcular diferença
    const calculateDifference = (current, frozen) => {
      const diff = parseFloat(current) - parseFloat(frozen);
      return formatPercent(diff) + '%';
    };
    
    // Carregar dados
    const loadStockData = async (symbols) => {
      try {
        console.log('[DEBUG] Carregando dados para:', symbols);
        const response = await dataService.getStockData(symbols);
        console.log('[DEBUG] Resposta recebida:', response);
        console.log('[DEBUG] Tickers:', response.tickers);
        return response.tickers || [];
      } catch (error) {
        console.error('[ERRO] Erro ao carregar dados:', error);
        return [];
      }
    };
    
    // Carregar notícias
    const loadNews = async () => {
      loadingNews.value = true;
      try {
        const response = await dataService.getFinancialJuiceNews();
        originalNews.value = response.news || [];
        news.value = originalNews.value;
      } catch (error) {
        console.error('Erro ao carregar notícias:', error);
      } finally {
        loadingNews.value = false;
      }
    };
    
    // Traduzir notícias (placeholder - implementar API de tradução)
    const translateNews = () => {
      newsTranslated.value = !newsTranslated.value;
      // TODO: Implementar tradução real
      alert(newsTranslated.value ? 'Tradução ativada' : 'Original');
    };
    
    // Controle de fonte
    const increaseFontSize = () => {
      if (newsFontSize.value < 20) newsFontSize.value++;
    };
    
    const decreaseFontSize = () => {
      if (newsFontSize.value > 10) newsFontSize.value--;
    };
    
    // Toggle setor
    const toggleSector = (sector) => {
      expandedSectors.value[sector] = !expandedSectors.value[sector];
    };
    
    // Resize columns
    const startResize = (e, side) => {
      e.preventDefault();
      const startX = e.clientX;
      const startLeft = leftWidth.value;
      const startRight = rightWidth.value;
      
      const onMouseMove = (e) => {
        if (side === 'left') {
          const delta = e.clientX - startX;
          leftWidth.value = Math.max(250, Math.min(600, startLeft + delta));
        } else {
          const delta = startX - e.clientX;
          rightWidth.value = Math.max(250, Math.min(600, startRight + delta));
        }
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    // Atualizar relógio
    const updateClock = () => {
      const now = new Date();
      currentTime.value = now.toLocaleTimeString('pt-BR');
    };
    
    // Refresh all
    const refreshAll = async () => {
      console.log('[DEBUG] Iniciando refreshAll...');
      console.log('[DEBUG] NASDAQ symbols:', nasdaqSymbols);
      console.log('[DEBUG] Metals symbols:', metalsSymbols);
      
      const [nasdaq, metals] = await Promise.all([
        loadStockData(nasdaqSymbols),
        loadStockData(metalsSymbols)
      ]);
      
      console.log('[DEBUG] NASDAQ dados recebidos:', nasdaq.length, 'itens');
      console.log('[DEBUG] Metals dados recebidos:', metals.length, 'itens');
      
      nasdaqData.value = nasdaq;
      metalsData.value = metals;
      
      console.log('[DEBUG] nasdaqData.value:', nasdaqData.value);
      console.log('[DEBUG] metalsData.value:', metalsData.value);
      
      // Atualizar diferenças se congelado
      if (nasdaqFrozen.value) {
        nasdaqData.value.forEach(stock => {
          const frozen = nasdaqFrozenValues.value[stock.ticker];
          let current = null;
          // O valor congelado nunca muda até novo congelamento
          // A diferença é sempre entre o valor atual do período e o congelado
          const period = getCurrentMarketPeriod();
          if (period === 'market') {
            current = (typeof stock.atClose?.changePercent === 'number') ? stock.atClose.changePercent : null;
          } else {
            current = (typeof stock.extended?.changePercent === 'number') ? stock.extended.changePercent : null;
          }
          if (current !== null && typeof frozen === 'number') {
            stock.diff = calculateDifference(current, frozen);
          } else {
            stock.diff = '--';
          }
        });
      }
      
      if (metalsFrozen.value) {
        metalsData.value.forEach(metal => {
          const current = metal.regularMarketChangePercent || 0;
          const frozen = metalsFrozenValues.value[metal.ticker] || 0;
          metal.diff = calculateDifference(current, frozen);
        });
      }
      
      // Carregar setores
      for (const [sector, symbols] of Object.entries(sp500Sectors)) {
        sp500Data.value[sector] = await loadStockData(symbols);
      }
      
      await loadNews();
    };
    
    const handleLogout = () => {
      authService.logout();
      router.push('/');
    };
    
    // Lifecycle
    onMounted(() => {
      loadKeywords();
      updateClock();
      setInterval(updateClock, 1000);
      refreshAll();
      setInterval(refreshAll, 5 * 60 * 1000); // 5 minutos
    });
    
    return {
      currentTime,
      nasdaqData,
      metalsData,
      news,
      sp500Data,
      nasdaqFrozen,
      metalsFrozen,
      newsTranslated,
      loadingNews,
      newsFontSize,
      showKeywordsModal,
      keywords,
      newKeyword,
      expandedSectors,
      leftWidth,
      rightWidth,
      addKeyword,
      removeKeyword,
      highlightKeywords,
      formatTime,
      formatPercent,
      getVariationClass,
      getDifferenceClass,
      toggleFreeze,
      translateNews,
      increaseFontSize,
      decreaseFontSize,
      toggleSector,
      startResize,
      handleLogout,
    };
  },
};
</script>

<style scoped>
/* Continua no próximo arquivo... */
</style>
