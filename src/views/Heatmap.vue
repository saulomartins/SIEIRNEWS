<template>
  <div class="heatmap-container">
    <header class="heatmap-header">
      <div class="header-left">
        <h1>📊 Heatmap de Mercado</h1>
      </div>
      <div class="header-right">
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          {{ loading ? '⟳ Atualizando...' : '🔄 Atualizar' }}
        </button>
        <button @click="goToDashboard" class="btn btn-primary">← Dashboard</button>
      </div>
    </header>

    <div class="heatmap-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando dados do mercado...</p>
      </div>

      <div v-else class="heatmap-grid">
        <div
          v-for="stock in stocksData"
          :key="stock.symbol"
          class="heatmap-tile"
          :class="getTileClass(stock)"
          :style="getTileStyle(stock)"
        >
          <div class="tile-symbol">{{ stock.symbol }}</div>
          <div class="tile-price">{{ stock.price }}</div>
          <div class="tile-change">{{ stock.changePercent }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dataService from '../services/dataService';

export default {
  name: 'Heatmap',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const stocksData = ref([]);
    
    // Lista de ações para o heatmap
    const symbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'JNJ', 'V',
      'WMT', 'PG', 'MA', 'HD', 'BAC', 'DIS', 'NFLX', 'INTC', 'CSCO', 'PFE',
      'XOM', 'CVX', 'KO', 'PEP', 'ABT', 'MRK', 'ORCL', 'ADBE', 'CRM', 'PYPL'
    ];
    
    const getTileClass = (stock) => {
      if (!stock.changePercent) return '';
      const change = parseFloat(stock.changePercent.replace(/[^0-9.-]/g, ''));
      
      if (change > 2) return 'tile-strong-positive';
      if (change > 0) return 'tile-positive';
      if (change < -2) return 'tile-strong-negative';
      if (change < 0) return 'tile-negative';
      return 'tile-neutral';
    };
    
    const getTileStyle = (stock) => {
      if (!stock.changePercent) return {};
      const change = parseFloat(stock.changePercent.replace(/[^0-9.-]/g, ''));
      const intensity = Math.min(Math.abs(change) / 5, 1);
      
      if (change > 0) {
        return {
          backgroundColor: `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`,
        };
      } else if (change < 0) {
        return {
          backgroundColor: `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`,
        };
      }
      
      return {
        backgroundColor: '#e5e7eb',
      };
    };
    
    const loadData = async () => {
      loading.value = true;
      try {
        const data = await dataService.getStockData(symbols);
        stocksData.value = data.tickers || [];
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const refreshData = () => {
      loadData();
    };
    
    const goToDashboard = () => {
      router.push('/dashboard');
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      stocksData,
      getTileClass,
      getTileStyle,
      refreshData,
      goToDashboard,
    };
  },
};
</script>

<style scoped>
.heatmap-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.heatmap-header {
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
  margin: 0;
}

.header-right {
  display: flex;
  gap: 10px;
}

.heatmap-content {
  padding: 30px;
  max-width: 1600px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-container p {
  margin-top: 20px;
  color: #666;
  font-size: 18px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.heatmap-tile {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  color: white;
  font-weight: 600;
}

.heatmap-tile:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.tile-symbol {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
}

.tile-price {
  font-size: 20px;
  margin: 5px 0;
}

.tile-change {
  font-size: 16px;
  margin-top: 5px;
}

.tile-strong-positive {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.tile-positive {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
}

.tile-neutral {
  background: #9ca3af;
}

.tile-negative {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.tile-strong-negative {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

@media (max-width: 768px) {
  .heatmap-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .heatmap-tile {
    padding: 15px;
  }
  
  .tile-symbol {
    font-size: 16px;
  }
  
  .tile-price {
    font-size: 18px;
  }
  
  .tile-change {
    font-size: 14px;
  }
}
</style>
