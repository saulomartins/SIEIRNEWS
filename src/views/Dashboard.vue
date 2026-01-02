<template>
  <div class="dashboard-pro">
    <!-- Header Premium -->
    <nav class="navbar-pro">
      <div class="container-fluid">
        <div class="d-flex align-items-center">
          <div class="logo-section">
            <h1 class="logo-title">SEIER<span class="logo-red">TRADER</span></h1>
            <p class="logo-subtitle">BATTLE</p>
          </div>
        </div>
        <div class="header-controls">
          <span class="time-display">{{ currentTime }}</span>
          <button class="btn-icon" @click="handleLogout" title="Sair">
            ❌
          </button>
        </div>
      </div>
    </nav>

    <!-- Modal Palavras-Chave -->
    <div v-if="showKeywordsModal" class="keywords-modal" @click.self="showKeywordsModal = false">
      <div class="keywords-modal-content">
        <div class="keywords-modal-header">
          <h3>🔑 Palavras-Chave para Destaque</h3>
          <button class="btn-close-modal" @click="showKeywordsModal = false">×</button>
        </div>
        <div class="keywords-modal-body">
          <p style="color: #999; margin-bottom: 1rem; font-size: 0.9rem;">
            Adicione palavras-chave que serão destacadas com marca-texto amarelo nas notícias.
          </p>
          <div class="keywords-input-group">
            <input 
              v-model="newKeyword" 
              @keyup.enter="addKeyword"
              type="text" 
              placeholder="Digite uma palavra-chave..." 
            />
            <button @click="addKeyword" class="btn-add-keyword">Adicionar</button>
          </div>
          <div class="keywords-list">
            <div v-if="keywords.length === 0" style="color: #666; text-align: center; padding: 2rem;">
              Nenhuma palavra-chave adicionada
            </div>
            <div v-else v-for="keyword in keywords" :key="keyword" class="keyword-item">
              <span class="keyword-text">{{ keyword }}</span>
              <button class="btn-remove-keyword" @click="removeKeyword(keyword)">
                🗑️ Remover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Coluna Esquerda: Metais -->
      <div class="left-column">
        <div class="card">
          <div class="card-header">
            <h3>⚡ Metais e Commodities</h3>
            <button @click="toggleFreeze('metals')" class="btn-icon">
              {{ frozenMetals ? '🔓' : '🔒' }}
            </button>
          </div>
          <div class="stocks-list">
            <div v-if="loading" class="loading-message">
              <div class="spinner"></div>
              <p>Carregando dados...</p>
            </div>
            <div v-else-if="metalsData.length === 0" class="no-data">
              Nenhum dado disponível
            </div>
            <div
              v-else
              v-for="stock in metalsData"
              :key="stock.symbol"
              class="stock-item"
              :class="getStockClass(stock)"
            >
              <div class="stock-symbol">{{ stock.symbol }}</div>
              <div class="stock-price">${{ formatNumber(stock.price) }}</div>
              <div class="stock-change">{{ formatChange(stock.change) }} ({{ formatPercent(stock.changePercent) }}%)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna Central: NASDAQ e Notícias -->
      <div class="center-column">
        <div class="card">
          <div class="card-header">
            <h3>📊 NASDAQ Top 10</h3>
            <button @click="toggleFreeze('nasdaq')" class="btn-icon">
              {{ frozenNasdaq ? '🔓' : '🔒' }}
            </button>
          </div>
          <div class="stocks-grid">
            <div
              v-for="stock in nasdaqData"
              :key="stock.symbol"
              class="stock-card"
              :class="getStockClass(stock)"
            >
              <div class="stock-symbol">{{ stock.symbol }}</div>
              <div class="stock-price">${{ formatNumber(stock.price) }}</div>
              <div class="stock-change">{{ formatPercent(stock.changePercent) }}%</div>
            </div>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-header">
            <h3>📰 Financial Juice News</h3>
            <button @click="loadNews" class="btn-icon">🔄</button>
          </div>
          <div class="news-list">
            <div v-if="loadingNews" class="spinner"></div>
            <div v-else-if="news.length === 0" class="no-data">
              Nenhuma notícia disponível
            </div>
            <div v-else>
              <div
                v-for="(item, index) in news"
                :key="index"
                class="news-item"
              >
                <h4>{{ item.title }}</h4>
                <p class="news-meta">{{ item.time }} | {{ item.category }}</p>
                <p class="news-description">{{ item.description }}</p>
                <a v-if="item.link" :href="item.link" target="_blank" class="news-link">
                  Ler mais →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna Direita: S&P 500 Setores -->
      <div class="right-column">
        <div class="card">
          <div class="card-header">
            <h3>🏢 S&P 500 Setores</h3>
          </div>
          <div class="sectors-accordion">
            <div
              v-for="(stocks, sector) in sp500Data"
              :key="sector"
              class="sector-item"
            >
              <div
                class="sector-header"
                @click="toggleSector(sector)"
              >
                <span>{{ sector }}</span>
                <span class="sector-arrow">{{ expandedSectors[sector] ? '▼' : '▶' }}</span>
              </div>
              <div v-show="expandedSectors[sector]" class="sector-stocks">
                <div
                  v-for="stock in stocks"
                  :key="stock.symbol"
                  class="stock-mini"
                  :class="getStockClass(stock)"
                >
                  <span class="stock-symbol">{{ stock.symbol }}</span>
                  <span class="stock-price">${{ formatNumber(stock.price) }}</span>
                  <span class="stock-change">{{ formatPercent(stock.changePercent) }}%</span>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import dataService from '../services/dataService';

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    const user = ref(authService.getCurrentUser());
    const loading = ref(false);
    const loadingNews = ref(false);
    
    // Dados
    const metalsData = ref([]);
    const nasdaqData = ref([]);
    const sp500Data = ref({});
    const news = ref([]);
    
    // Estados
    const frozenMetals = ref(false);
    const frozenNasdaq = ref(false);
    const expandedSectors = ref({});
    
    // Símbolos
    const metals = ['GC=F', 'SI=F', 'PL=F', 'HG=F', 'CL=F'];
    const nasdaq = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOG', 'GOOGL', 'TSLA', 'INTC', 'AMD'];
    const sp500Sectors = {
      'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
      'Healthcare': ['JNJ', 'UNH', 'LLY', 'ABBV', 'MRK'],
      'Financials': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      'Consumer': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
      'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    };
    
    let updateInterval = null;
    
    const getStockClass = (stock) => {
      if (!stock.change) return '';
      const change = parseFloat(stock.change);
      return change >= 0 ? 'stock-positive' : 'stock-negative';
    };
    
    const formatNumber = (value) => {
      if (!value) return '0.00';
      return parseFloat(value).toFixed(2);
    };
    
    const formatChange = (value) => {
      if (!value) return '+0.00';
      const num = parseFloat(value);
      return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    };
    
    const formatPercent = (value) => {
      if (!value) return '+0.00';
      const num = parseFloat(value);
      return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    };
    
    const toggleFreeze = (type) => {
      if (type === 'metals') {
        frozenMetals.value = !frozenMetals.value;
      } else if (type === 'nasdaq') {
        frozenNasdaq.value = !frozenNasdaq.value;
      }
    };
    
    const toggleSector = (sector) => {
      expandedSectors.value[sector] = !expandedSectors.value[sector];
    };
    
    const loadStockData = async (symbols) => {
      try {
        const data = await dataService.getStockData(symbols);
        return data.tickers || [];
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return [];
      }
    };
    
    const loadNews = async () => {
      loadingNews.value = true;
      try {
        const data = await dataService.getFinancialJuiceNews();
        news.value = data.news || [];
      } catch (error) {
        console.error('Erro ao carregar notícias:', error);
      } finally {
        loadingNews.value = false;
      }
    };
    
    const refreshAllData = async () => {
      loading.value = true;
      try {
        // Carregar metais
        if (!frozenMetals.value) {
          metalsData.value = await loadStockData(metals);
        }
        
        // Carregar NASDAQ
        if (!frozenNasdaq.value) {
          nasdaqData.value = await loadStockData(nasdaq);
        }
        
        // Carregar S&P 500 setores
        for (const [sector, symbols] of Object.entries(sp500Sectors)) {
          sp500Data.value[sector] = await loadStockData(symbols);
        }
        
        // Carregar notícias
        await loadNews();
      } catch (error) {
        console.error('Erro ao atualizar dados:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleLogout = () => {
      authService.logout();
      router.push('/');
    };
    
    onMounted(() => {
      refreshAllData();
      
      // Atualizar a cada 5 minutos
      updateInterval = setInterval(() => {
        refreshAllData();
      }, 5 * 60 * 1000);
    });
    
    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
    
    return {
      user,
      loading,
      loadingNews,
      metalsData,
      nasdaqData,
      sp500Data,
      news,
      frozenMetals,
      frozenNasdaq,
      expandedSectors,
      getStockClass,
      formatNumber,
      formatChange,
      formatPercent,
      toggleFreeze,
      toggleSector,
      loadNews,
      refreshAllData,
      handleLogout,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-header {
  background: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.user-name {
  color: #666;
  margin-left: 15px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 300px 1fr 350px;
  gap: 20px;
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.stocks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stock-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ccc;
}

.stock-item.stock-positive {
  border-left-color: #10b981;
  background: #ecfdf5;
}

.stock-item.stock-negative {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.stock-symbol {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 5px;
}

.stock-price {
  font-size: 20px;
  font-weight: 600;
  margin: 5px 0;
}

.stock-change {
  font-size: 14px;
  color: #666;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.stock-card {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #e0e0e0;
}

.stock-card.stock-positive {
  border-color: #10b981;
  background: #ecfdf5;
}

.stock-card.stock-negative {
  border-color: #ef4444;
  background: #fef2f2;
}

.news-list {
  max-height: 500px;
  overflow-y: auto;
}

.news-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.news-item h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.news-meta {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.news-description {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
}

.news-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.news-link:hover {
  text-decoration: underline;
}

.sectors-accordion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sector-header {
  padding: 12px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.sector-header:hover {
  background: #5568d3;
}

.sector-stocks {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stock-mini {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin: 5px 0;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.stock-mini.stock-positive {
  border-left: 3px solid #10b981;
}

.stock-mini.stock-negative {
  border-left: 3px solid #ef4444;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.loading-message {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-message p {
  margin-top: 15px;
  font-size: 14px;
}

.mt-3 {
  margin-top: 20px;
}

@media (max-width: 1400px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
