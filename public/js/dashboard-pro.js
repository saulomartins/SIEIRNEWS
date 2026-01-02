// Salvar traduções no localStorage
function saveTranslatedNews(newsArr) {
  try {
    localStorage.setItem('translatedNews', JSON.stringify(newsArr));
  } catch (e) { console.error('Erro ao salvar traduções:', e); }
}

// Carregar traduções do localStorage
function loadTranslatedNews() {
  try {
    const data = localStorage.getItem('translatedNews');
    if (data) return JSON.parse(data);
  } catch (e) { console.error('Erro ao carregar traduções:', e); }
  return [];
}
// Dashboard Professional JavaScript
console.log('=== DASHBOARD PROFESSIONAL INICIANDO ===');

const API_URL = 'http://localhost:3000/api';

// Sistema de redimensionamento de colunas
function initializeResizers() {
  const resizer1 = document.getElementById('resizer1');
  // const resizer2 = document.getElementById('resizer2'); // removido
  const leftColumn = document.querySelector('.left-column');
  const centerColumn = document.querySelector('.center-column');
  // const rightColumn = document.querySelector('.right-column'); // removido
  
  let isResizing = false;
  let currentResizer = null;
  
  function startResize(e, resizer) {
    isResizing = true;
    currentResizer = resizer;
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
  
  function stopResize() {
    if (isResizing) {
      isResizing = false;
      if (currentResizer) {
        currentResizer.classList.remove('active');
        currentResizer = null;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }
  
  function resize(e) {
    if (!isResizing) return;
    if (currentResizer === resizer1) {
      const containerRect = document.querySelector('.dashboard-container').getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left - 8;
      if (newWidth >= 250 && newWidth <= 600) {
        leftColumn.style.width = newWidth + 'px';
      }
    }
  }
  
  resizer1.addEventListener('mousedown', (e) => startResize(e, resizer1));
  // resizer2 removido
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
  
  console.log('✅ Sistema de redimensionamento inicializado');
}

// Listas de ativos
const metals = ['GC=F', 'SI=F', 'PL=F', 'HG=F', 'BZ=F']; // Gold, Silver, Platinum, Copper, Crude Oil
const nasdaqStocks = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOG', 'GOOGL', 'TSLA', 'INTC', 'AMD'];
const sp500Sectors = {
  'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AVGO', 'CSCO', 'ADBE', 'CRM', 'ORCL'],
  'Healthcare': ['JNJ', 'UNH', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'PFE', 'DHR', 'BMY'],
  'Financials': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'SCHW', 'AXP', 'CB'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'SBUX', 'TGT', 'BKNG', 'TJX'],
  'Communication': ['GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'EA'],
  'Industrials': ['BA', 'UNP', 'HON', 'RTX', 'UPS', 'CAT', 'DE', 'LMT', 'GE', 'MMM'],
  'Consumer Defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'PM', 'MO', 'CL', 'MDLZ', 'KMB'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PXD', 'VLO', 'PSX', 'OXY'],
  'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'ED', 'PCG'],
  'Real Estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'WELL', 'DLR', 'O', 'SPG', 'AVB'],
  'Basic Materials': ['LIN', 'APD', 'SHW', 'ECL', 'DD', 'NEM', 'FCX', 'NUE', 'DOW', 'ALB']
};

let updateInterval;
let frozenMetals = false;
let frozenNasdaq = false;

// Armazenar valores congelados
let metalsFrozenValues = {};
let nasdaqFrozenValues = {};

// Contador de atualizações
let updateCount = 0;
let lastLogTime = 0;

// Sistema de tradução de notícias
let originalNews = [];
let translatedNews = [];
let newsTranslated = false;
let isTranslating = false;

// Sistema de palavras-chave
let keywords = [];

// Carregar palavras-chave do localStorage
function loadKeywords() {
  const stored = localStorage.getItem('newsKeywords');
  if (stored) {
    try {
      keywords = JSON.parse(stored);
      console.log('✅ Palavras-chave carregadas:', keywords);
    } catch (e) {
      console.error('❌ Erro ao carregar palavras-chave:', e);
      keywords = [];
    }
  }
  return keywords;
}

// Salvar palavras-chave no localStorage
function saveKeywords() {
  localStorage.setItem('newsKeywords', JSON.stringify(keywords));
  console.log('💾 Palavras-chave salvas:', keywords);
}

// Adicionar palavra-chave
function addKeyword(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (normalized && !keywords.includes(normalized)) {
    keywords.push(normalized);
    saveKeywords();
    updateKeywordsList();
    // Atualizar notícias para aplicar o novo highlight
    if (originalNews.length > 0) {
      updateNewsPanel(newsTranslated ? translatedNews : originalNews);
    }
    return true;
  }
  return false;
}

// Remover palavra-chave
function removeKeyword(keyword) {
  keywords = keywords.filter(k => k !== keyword);
  saveKeywords();
  updateKeywordsList();
  // Atualizar notícias para remover o highlight
  if (originalNews.length > 0) {
    updateNewsPanel(newsTranslated ? translatedNews : originalNews);
  }
}

// Atualizar lista de palavras-chave no modal
function updateKeywordsList() {
  const list = document.getElementById('keywordsList');
  if (!list) return;
  
  if (keywords.length === 0) {
    list.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Nenhuma palavra-chave adicionada</p>';
    return;
  }
  
  list.innerHTML = keywords.map(keyword => `
    <div class="keyword-item">
      <span class="keyword-text">${keyword}</span>
      <button class="btn-remove-keyword" onclick="removeKeyword('${keyword}')">
        <i class="bi bi-trash"></i> Remover
      </button>
    </div>
  `).join('');
}

// Verificar se o texto contém alguma palavra-chave
function containsKeyword(text) {
  if (!text || keywords.length === 0) return false;
  
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword));
}

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀🚀🚀 DOM carregado - DASHBOARD INICIANDO 🚀🚀🚀');
  
  // Verificar elementos críticos
  console.log('Container customHeatmap:', document.getElementById('customHeatmap'));
  console.log('Token:', token ? 'EXISTS' : 'MISSING');
  
  // Inicializar sistema de redimensionamento
  initializeResizers();
  
  // Atualizar relógio
  updateClock();
  setInterval(updateClock, 1000);
  
  // Inicializar painéis
  console.log('Inicializando painéis...');
  initializeMetalsPanel();
  initializeNasdaqPanel();
  
  initializeNewsPanel();
  initializeHighlights();
  
  // Iniciar atualização de dados IMEDIATAMENTE
  console.log('🚀 Iniciando primeira busca de dados...');
  fetchAllData().then(() => {
    console.log('✅ Primeira busca de dados concluída');
  }).catch(err => {
    console.error('❌ Erro na primeira busca:', err);
  });
  
  // Continuar atualizando a cada 1 segundo
  updateInterval = setInterval(fetchAllData, 1000); // Atualizar a cada 1 segundo (Yahoo Finance)
  
  // Buscar notícias e atualizar a cada 10 segundos
  fetchNews();
  setInterval(fetchNews, 1000);
  
  // Event listeners
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Botão de tradução
  const translateBtn = document.querySelector('.btn-news-ctrl:nth-child(3)');
  if (translateBtn) {
    translateBtn.addEventListener('click', toggleTranslation);
    console.log('✅ Botão de tradução inicializado');
  }
  
  // Botão de palavras-chave
  const keywordsBtn = document.getElementById('keywordsBtn');
  if (keywordsBtn) {
    keywordsBtn.addEventListener('click', () => {
      document.getElementById('keywordsModal').style.display = 'flex';
      updateKeywordsList();
    });
    console.log('✅ Botão de palavras-chave inicializado');
  }
  
  // Botão adicionar palavra-chave
  const addKeywordBtn = document.getElementById('addKeywordBtn');
  const keywordInput = document.getElementById('keywordInput');
  if (addKeywordBtn && keywordInput) {
    addKeywordBtn.addEventListener('click', () => {
      const keyword = keywordInput.value.trim();
      if (keyword) {
        if (addKeyword(keyword)) {
          keywordInput.value = '';
        } else {
          alert('Palavra-chave já existe ou é inválida!');
        }
      }
    });
    
    keywordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addKeywordBtn.click();
      }
    });
    
    console.log('✅ Sistema de palavras-chave inicializado');
  }

  // Restaurar estado do botão Traduzir (garantido ao final do DOMContentLoaded)
  setTimeout(() => {
    const tradState = localStorage.getItem('newsTranslated');
    if (tradState === 'true') {
      // Busca botão pelo texto (Traduzir ou Original)
      const btns = document.querySelectorAll('.btn-news-ctrl');
      let translateBtn = null;
      btns.forEach(btn => {
        if (btn.textContent.trim() === 'Traduzir' || btn.textContent.trim() === 'Original') {
          translateBtn = btn;
        }
      });
      if (translateBtn && !newsTranslated) {
        translateBtn.click();
      }
    }
  }, 1200);
  
  // Fechar modal ao clicar fora
  const keywordsModal = document.getElementById('keywordsModal');
  if (keywordsModal) {
    keywordsModal.addEventListener('click', (e) => {
      if (e.target === keywordsModal) {
        keywordsModal.style.display = 'none';
      }
    });
  }
  
  // Carregar palavras-chave salvas
  loadKeywords();
  
  // Botão congelar metais
  const metalsFreezeBtn = document.querySelector('.panel-metals .btn-freeze');
  if (metalsFreezeBtn) {
    metalsFreezeBtn.addEventListener('click', () => {
      frozenMetals = !frozenMetals;
      metalsFreezeBtn.textContent = frozenMetals ? 'Descongelar' : 'Congelar';
      metalsFreezeBtn.style.background = frozenMetals ? 'var(--red-color)' : '';
      
      // Atualizar cabeçalho da coluna
      const metalsFrozenHeader = document.getElementById('metalsFrozenHeader');
      if (metalsFrozenHeader) {
        if (frozenMetals) {
          const now = new Date();
          const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          metalsFrozenHeader.textContent = `Var.% ${time}`;
        } else {
          metalsFrozenHeader.textContent = 'Var.% Congelada';
        }
      }
      
      if (frozenMetals) {
        // Congelar valores atuais
        metals.forEach(symbol => {
          const row = document.getElementById(`metal-${symbol.replace('=', '')}`);
          if (row) {
            const currentChange = row.querySelector('.metal-change').textContent;
            metalsFrozenValues[symbol] = currentChange;
          }
        });
        console.log('❄️ Metais congelados:', metalsFrozenValues);
      } else {
        // Descongelar: limpar valores e células
        metalsFrozenValues = {};
        metals.forEach(symbol => {
          const row = document.getElementById(`metal-${symbol.replace('=', '')}`);
          if (row) {
            const frozenCell = row.querySelector('.metal-frozen');
            frozenCell.textContent = '--';
            frozenCell.className = 'metal-frozen';
          }
        });
        console.log('✅ Metais descongelados');
      }
    });
  }
  
  // Botão congelar NASDAQ
  const nasdaqFreezeBtn = document.querySelector('.panel-nasdaq .btn-freeze');
  if (nasdaqFreezeBtn) {
    nasdaqFreezeBtn.addEventListener('click', () => {
      frozenNasdaq = !frozenNasdaq;
      nasdaqFreezeBtn.textContent = frozenNasdaq ? 'Descongelar' : 'Congelar';
      nasdaqFreezeBtn.style.background = frozenNasdaq ? 'var(--red-color)' : '';
      
      // Atualizar cabeçalho da coluna
      const nasdaqFrozenHeader = document.getElementById('nasdaqFrozenHeader');
      if (nasdaqFrozenHeader) {
        if (frozenNasdaq) {
          const now = new Date();
          const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          nasdaqFrozenHeader.textContent = `Var.% ${time}`;
        } else {
          nasdaqFrozenHeader.textContent = 'Var.% Congelada';
        }
      }
      
      if (frozenNasdaq) {
        // Congelar valores atuais baseado no período
        const period = getCurrentTradingPeriod();
        console.log(`❄️ Congelando NASDAQ no período: ${period}`);
        
        nasdaqStocks.forEach(symbol => {
          const row = document.getElementById(`nasdaq-${symbol}`);
          if (row) {
            let changeValue;
            if (period === 'PRE-MARKET') {
              // Usar variação do Pre-Market
              changeValue = row.querySelector('.nasdaq-extended-change').textContent;
            } else {
              // Usar variação do Mercado
              changeValue = row.querySelector('.nasdaq-market-change').textContent;
            }
            nasdaqFrozenValues[symbol] = changeValue;
          }
        });
        console.log('❄️ NASDAQ congelado:', nasdaqFrozenValues);
      } else {
        // Descongelar: limpar valores congelados
        nasdaqFrozenValues = {};
        
        // Ocultar média no cabeçalho
        const averageDisplay = document.getElementById('nasdaqAverage');
        if (averageDisplay) {
          averageDisplay.style.display = 'none';
        }
        
        console.log('✅ NASDAQ descongelado');
      }
    });
  }
  
  console.log('✅ Dashboard Professional inicializado');
});

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  document.getElementById('currentTime').textContent = timeString;
}

// Função para detectar período de negociação (horário de Brasília)
function getCurrentTradingPeriod() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // MERCADO: 11:30 - 18:00 (690 - 1080 minutos)
  const marketStart = 11 * 60 + 30; // 690
  const marketEnd = 18 * 60; // 1080

  // PRE-MARKET: 19:20 - 11:59 (cruza meia-noite)
  const preMarketStart = 19 * 60 + 20; // 1160
  const preMarketEnd = 11 * 60 + 59; // 719

  if (timeInMinutes >= marketStart && timeInMinutes <= marketEnd) {
    return 'MARKET';
  } else if (timeInMinutes >= preMarketStart || timeInMinutes <= preMarketEnd) {
    // PRE-MARKET: das 19:20 até 23:59 OU das 00:00 até 11:59
    return 'PRE-MARKET';
  } else {
    return 'CLOSED';
  }
}

// ========== PAINEL DE METAIS ==========
function initializeMetalsPanel() {
  const tbody = document.getElementById('metalsTableBody');
  
  const metalNames = {
    'GC=F': 'Ouro',
    'SI=F': 'Prata',
    'PL=F': 'Platina',
    'HG=F': 'Cobre',
    'BZ=F': 'Min. Ferro'
  };
  
  const metalIcons = {
    'GC=F': 'icon-gold',
    'SI=F': 'icon-silver',
    'PL=F': 'icon-platinum',
    'HG=F': 'icon-copper',
    'BZ=F': 'icon-iron'
  };
  
  tbody.innerHTML = metals.map(symbol => `
    <tr id="metal-${symbol.replace('=', '')}">
      <td>
        <div class="stock-symbol">
          <div class="stock-icon ${metalIcons[symbol]}">${metalNames[symbol][0]}</div>
          <a href="https://finance.yahoo.com/quote/${symbol}" target="_blank" style="color: inherit; text-decoration: none;" title="Ver no Yahoo Finance">
            ${metalNames[symbol]}
          </a>
        </div>
      </td>
      <td class="metal-price">--</td>
      <td class="metal-change">--</td>
      <td class="metal-frozen">--</td>
      <td class="metal-diff">--</td>
      <td class="time-col metal-time">--</td>
    </tr>
  `).join('');
}

// ========== PAINEL NASDAQ ==========
function initializeNasdaqPanel() {
  const tbody = document.getElementById('nasdaqTableBody');
  
  const stockColors = {
    'AAPL': '#555',
    'MSFT': '#0078D4',
    'GOOGL': '#4285F4',
    'GOOG': '#4285F4',
    'AMZN': '#FF9900',
    'META': '#0866FF',
    'NVDA': '#76B900',
    'TSLA': '#E82127',
    'INTC': '#0071C5',
    'AMD': '#ED1C24'
  };
  
  tbody.innerHTML = nasdaqStocks.map(symbol => {
    const color = stockColors[symbol] || '#555';
    const icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' rx='3' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='white' font-size='11' font-weight='bold'%3E${symbol[0]}%3C/text%3E%3C/svg%3E`;
    
    return `
      <tr id="nasdaq-${symbol}">
        <td>
          <div class="stock-symbol">
            <img src="${icon}" style="width: 20px; height: 20px; margin-right: 6px;" alt="${symbol}">
            <a href="https://finance.yahoo.com/quote/${symbol}" target="_blank" style="color: inherit; text-decoration: none;" title="Ver no Yahoo Finance">
              ${symbol}
            </a>
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
}


// ========== FEED DE NOTÍCIAS ==========
function initializeNewsPanel() {
  const feed = document.getElementById('newsFeed');
  feed.innerHTML = '<div class="news-item"><span class="news-text">Carregando notícias...</span></div>';
}

async function fetchNews() {
  try {
    console.log('📰 Buscando notícias...');
    
    const response = await fetch(`${API_URL}/data/news`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📰 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const newsData = await response.json();
    console.log('📰 Dados recebidos:', newsData);
    
    // O backend retorna diretamente o array de notícias
    if (Array.isArray(newsData)) {
      console.log('✅ Notícias recebidas:', newsData.length);
      originalNews = newsData;
      updateNewsPanel(newsTranslated ? translatedNews : originalNews);
    } else if (newsData.data && Array.isArray(newsData.data)) {
      console.log('✅ Notícias recebidas (objeto):', newsData.data.length);
      originalNews = newsData.data;
      updateNewsPanel(newsTranslated ? translatedNews : originalNews);
    } else {
      console.warn('⚠️ Formato inesperado de notícias:', newsData);
      updateNewsPanel([]);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar notícias:', error);
    const feed = document.getElementById('newsFeed');
    if (feed) {
      feed.innerHTML = '<div class="news-item"><span class="news-text" style="color: #ff6b6b;">Erro ao carregar notícias. Tentando novamente...</span></div>';
    }
  }
}

function updateNewsPanel(newsArray) {
  console.log('📰 Atualizando painel de notícias com', newsArray?.length, 'itens');
  const feed = document.getElementById('newsFeed');
  
  if (!feed) {
    console.error('❌ Elemento newsFeed não encontrado!');
    return;
  }
  
  if (!newsArray || newsArray.length === 0) {
    feed.innerHTML = '<div class="news-item"><span class="news-text">Carregando notícias...</span></div>';
    return;
  }
  
  // Sempre mostrar translatedNews se newsTranslated estiver ativo
  if (newsTranslated && translatedNews.length > 0) {
    newsArray = translatedNews;
  } else {
    originalNews = newsArray;
  }
  
  feed.innerHTML = newsArray.map(news => {
    const title = news.title || 'Sem título';
    const url = news.url || '#';
    const time = news.time || 'Recente';
    const fullDate = news.fullDate || '';
    const source = news.source || 'Yahoo Finance';
    const stocks = news.stocks || [];
    
    // Verificar se a notícia contém alguma palavra-chave
    const hasKeyword = containsKeyword(title);
    const itemClass = hasKeyword ? 'news-item news-item-highlighted' : 'news-item';
    
    // Se tem URL, criar link clicável
    const titleHtml = url && url !== '#' 
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" onmouseover="this.style.color='var(--red-color)'" onmouseout="this.style.color='inherit'">${title}</a>`
      : title;
    
    // Mostrar data completa se disponível, senão tempo relativo
    const displayTime = fullDate || time;
    
    // Exibir símbolos de ações se houver
    const stocksHtml = stocks.length > 0 
      ? `<div class="news-stocks" title="Ações mencionadas">${stocks.map(s => `<span class="stock-tag">${s}</span>`).join('')}</div>`
      : '';
    
    return `
      <div class="${itemClass}">
        <span class="news-time" title="${fullDate || time}">${displayTime}</span>
        <span class="news-text">${titleHtml}${stocksHtml}</span>
        <span class="news-source">${source}</span>
      </div>
    `;
  }).join('');
  
  console.log('✅ Painel de notícias atualizado com sucesso');
}

// Função para traduzir texto usando Google Translate (endpoint não-oficial)
async function translateText(text) {
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      return data[0][0][0];
    }
    return text;
  } catch (error) {
    console.error('Erro ao traduzir:', error);
    return text;
  }
}

// Função para alternar tradução
async function toggleTranslation() {
  if (isTranslating) {
    console.log('⏳ Tradução em andamento...');
    return;
  }

  const translateBtn = document.querySelector('.btn-news-ctrl:nth-child(3)');

  if (newsTranslated) {
    // Voltar para original
    newsTranslated = false;
    localStorage.setItem('newsTranslated', 'false');
    translateBtn.textContent = 'Traduzir';
    translateBtn.style.background = '';
    updateNewsPanel(originalNews);
    console.log('✅ Mostrando notícias originais');
  } else {
    // Traduzir
    if (originalNews.length === 0) {
      console.warn('⚠️ Nenhuma notícia para traduzir');
      return;
    }

    isTranslating = true;
    translateBtn.textContent = 'Traduzindo...';
    translateBtn.style.background = '#ffa500';

    // Carregar traduções já salvas
    let savedTranslations = loadTranslatedNews();
    // Mapear notícias já traduzidas por id ou título
    const translatedMap = {};
    savedTranslations.forEach(n => { if (n.id) translatedMap[n.id] = n; else if (n.title) translatedMap[n.title] = n; });

    try {
      // Traduzir apenas notícias novas
      const translationPromises = originalNews.map(async (news) => {
        // Identificador único: id, url ou título
        const key = news.id || news.url || news.title;
        if (translatedMap[key] && translatedMap[key].originalTitle === news.title) {
          return translatedMap[key];
        } else {
          const translatedTitle = await translateText(news.title);
          return {
            ...news,
            originalTitle: news.title,
            title: translatedTitle
          };
        }
      });
      translatedNews = await Promise.all(translationPromises);
      newsTranslated = true;
      localStorage.setItem('newsTranslated', 'true');
      saveTranslatedNews(translatedNews);
      translateBtn.textContent = 'Original';
      translateBtn.style.background = 'var(--red-color)';
      updateNewsPanel(translatedNews);
      console.log('✅ Tradução concluída!');
    } catch (error) {
      console.error('❌ Erro na tradução:', error);
      translateBtn.textContent = 'Traduzir';
      translateBtn.style.background = '';
    } finally {
      isTranslating = false;
    }
  }
}

// ========== DESTAQUES ==========
function initializeHighlights() {
  // Será atualizado com dados reais
}

// ========== BUSCAR DADOS DA API ==========
async function fetchAllData() {
  try {
    updateCount++;
    const now = Date.now();
    
    // Log apenas a cada 10 segundos para não entupir o console
    if (now - lastLogTime > 10000) {
      console.log(`✅ Sistema ativo - ${updateCount} atualizações realizadas`);
      lastLogTime = now;
    }
    
    // Buscar todos os símbolos
    const allSymbols = [...new Set([...metals, ...nasdaqStocks, ...Object.values(sp500Sectors).flat()])];
    
    const response = await fetch(`${API_URL}/data?symbols=${allSymbols.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const dataArray = await response.json();
    
    // Converter array para objeto indexado por ticker
    const data = {};
    dataArray.forEach(item => {
      if (item && item.ticker) {
        data[item.ticker] = item;
      }
    });
    
    // Atualizar painéis
    updateMetalsPanel(data);
    updateNasdaqPanel(data);
    // updateSP500Map(data); // Comentado - heatmap atualiza independentemente
    // updateHighlights(data); // Comentado - função com erro
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
  }
}

function updateMetalsPanel(data) {
  console.log('📊 Atualizando painel de metais...', metals);
  
  metals.forEach(symbol => {
    const stock = data[symbol];
    if (!stock) {
      console.warn(`⚠️ Dados não encontrados para ${symbol}`);
      return;
    }
    
    console.log(`✓ ${symbol}:`, stock);
    
    const row = document.getElementById(`metal-${symbol.replace('=', '')}`);
    if (!row) {
      console.error(`❌ Linha não encontrada: metal-${symbol.replace('=', '')}`);
      return;
    }
    
    // Usar dados extended se disponível (After Hours ou Pre-Market), senão regular - como no Yahoo Finance
    let price, change;
    
    if (stock.extended?.isExtendedHours && stock.extended.price) {
      // Mostrar preço de horário estendido
      price = stock.extended.price.toFixed(2);
      change = stock.extended.changePercent;
      console.log(`  → ${symbol} usando Extended Hours: $${price} (${change}%)`);
    } else {
      // Mostrar preço regular
      price = stock.regularMarketPrice?.toFixed(2) || '--';
      change = stock.regularMarketChangePercent || 0;
      console.log(`  → ${symbol} usando Regular Market: $${price} (${change}%)`);
    }
      
    const changeText = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    const changeClass = change > 0 ? 'price-positive' : 'price-negative';
    
    const time = stock.regularMarketTime 
      ? new Date(stock.regularMarketTime * 1000).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })
      : '--';
    
    row.querySelector('.metal-price').textContent = price;
    row.querySelector('.metal-change').className = `metal-change ${changeClass}`;
    row.querySelector('.metal-change').textContent = changeText;
    row.querySelector('.metal-time').textContent = time;
    
    // Atualizar coluna congelada
    const frozenCell = row.querySelector('.metal-frozen');
    if (frozenMetals && metalsFrozenValues[symbol]) {
      // Manter valor congelado
      const frozenValue = metalsFrozenValues[symbol];
      const frozenClass = frozenValue.includes('+') ? 'price-positive' : 'price-negative';
      frozenCell.className = `metal-frozen ${frozenClass}`;
      frozenCell.textContent = frozenValue;
    } else {
      // Copiar valor atual quando não congelado
      frozenCell.className = `metal-frozen ${changeClass}`;
      frozenCell.textContent = changeText;
    }
    
    // Calcular e exibir diferença
    const diffCell = row.querySelector('.metal-diff');
    if (frozenMetals && metalsFrozenValues[symbol]) {
      const frozenVal = parseFloat(metalsFrozenValues[symbol].replace('%', '').replace('+', ''));
      const currentVal = change;
      const diff = currentVal - frozenVal;
      
      if (Math.abs(diff) < 0.01) {
        diffCell.textContent = '—';
        diffCell.className = 'metal-diff';
      } else {
        const arrow = diff > 0 ? '↑' : '↓';
        const diffClass = diff > 0 ? 'price-positive' : 'price-negative';
        diffCell.textContent = `${arrow} ${Math.abs(diff).toFixed(2)}%`;
        diffCell.className = `metal-diff ${diffClass}`;
      }
    } else {
      diffCell.textContent = '--';
      diffCell.className = 'metal-diff';
    }
  });
}

function updateNasdaqPanel(data) {
  console.log('📊 Atualizando painel NASDAQ...', nasdaqStocks);
  console.log('📊 Dados recebidos para NASDAQ:', Object.keys(data).length, 'símbolos');
  
  // Atualizar indicador de última atualização
  const lastUpdateEl = document.getElementById('nasdaqLastUpdate');
  if (lastUpdateEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastUpdateEl.textContent = `🔄 ${timeStr}`;
    lastUpdateEl.style.color = '#4ade80';
    setTimeout(() => {
      lastUpdateEl.style.color = '#9ca3af';
    }, 500);
  }
  
  let updatedCount = 0;
  nasdaqStocks.forEach(symbol => {
    const stock = data[symbol];
    if (!stock) {
      console.warn(`⚠️ Dados não encontrados para ${symbol}`);
      return;
    }
    
    updatedCount++;
    console.log(`✓ ${symbol}: Preço=${stock.regularMarketPrice}, Var=${stock.regularMarketChangePercent}%`);
    
    const row = document.getElementById(`nasdaq-${symbol}`);
    if (!row) {
      console.error(`❌ Linha não encontrada: nasdaq-${symbol}`);
      return;
    }
    
    // MERCADO REGULAR (At Close)
    const marketPrice = stock.regularMarketPrice?.toFixed(2) || '--';
    const marketChange = stock.regularMarketChangePercent || 0;
    const marketChangeText = `${marketChange > 0 ? '+' : ''}${marketChange.toFixed(2)}%`;
    const marketChangeClass = marketChange > 0 ? 'price-positive' : 'price-negative';
    
    // Declarar variável de extended hours no escopo superior para evitar ReferenceError
    let extendedChangeText = '--';
    
    const marketTime = stock.regularMarketTime 
      ? new Date(stock.regularMarketTime * 1000).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })
      : '--';
    
    row.querySelector('.nasdaq-market-price').textContent = marketPrice;
    row.querySelector('.nasdaq-market-change').className = `nasdaq-market-change ${marketChangeClass}`;
    row.querySelector('.nasdaq-market-change').textContent = marketChangeText;
    row.querySelector('.nasdaq-market-time').textContent = marketTime;

    // PRE-MARKET / AFTER HOURS (sem coluna de preço)
    if (stock.extended?.isExtendedHours && stock.extended.price) {
      const extendedChange = stock.extended.changePercent;
      extendedChangeText = `${extendedChange > 0 ? '+' : ''}${extendedChange.toFixed(2)}%`;
      const extendedChangeClass = extendedChange > 0 ? 'price-positive' : 'price-negative';
      const extendedTime = stock.extended.time
        ? new Date(stock.extended.time * 1000).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })
        : new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
      row.querySelector('.nasdaq-extended-change').className = `nasdaq-extended-change ${extendedChangeClass}`;
      row.querySelector('.nasdaq-extended-change').textContent = extendedChangeText;
      row.querySelector('.nasdaq-extended-time').textContent = extendedTime;
      // Remove/preenche célula de preço se existir
      const priceCell = row.querySelector('.nasdaq-extended-price');
      if (priceCell) priceCell.remove();
      console.log(`  → ${symbol} Extended: (${extendedChange}%) às ${extendedTime}`);
    } else {
      // Sem dados de horário estendido
      const priceCell = row.querySelector('.nasdaq-extended-price');
      if (priceCell) priceCell.remove();
      row.querySelector('.nasdaq-extended-change').textContent = '--';
      row.querySelector('.nasdaq-extended-time').textContent = '--';
    }
    
    console.log(`  → ${symbol} Market: $${marketPrice} (${marketChange}%) às ${marketTime}`);
    
    // Atualizar valor congelado se modo congelar estiver ativo
    if (frozenNasdaq && nasdaqFrozenValues[symbol]) {
      const frozenCell = row.querySelector('.nasdaq-frozen');
      const frozenValue = nasdaqFrozenValues[symbol];
      const frozenClass = frozenValue.includes('+') ? 'price-positive' : 'price-negative';
      frozenCell.className = `nasdaq-frozen ${frozenClass}`;
      frozenCell.textContent = frozenValue;
    } else if (!frozenNasdaq) {
      // Atualizar automaticamente baseado no período quando não congelado
      const frozenCell = row.querySelector('.nasdaq-frozen');
      const period = getCurrentTradingPeriod();
      
      // Log do período atual (apenas para o primeiro símbolo)
      if (symbol === nasdaqStocks[0]) {
        console.log(`📅 Período atual: ${period} (${new Date().toLocaleTimeString('pt-BR')})`);
      }
      
      let currentValue;
      if (period === 'PRE-MARKET' && stock.extended?.isExtendedHours) {
        currentValue = extendedChangeText;
      } else {
        currentValue = marketChangeText;
      }
      
      const frozenClass = currentValue.includes('+') ? 'price-positive' : 'price-negative';
      frozenCell.className = `nasdaq-frozen ${frozenClass}`;
      frozenCell.textContent = currentValue;
    }
    
    // Calcular e exibir diferença
    const diffCell = row.querySelector('.nasdaq-diff');
    if (frozenNasdaq && nasdaqFrozenValues[symbol]) {
      const frozenVal = parseFloat(nasdaqFrozenValues[symbol].replace('%', '').replace('+', ''));
      
      const period = getCurrentTradingPeriod();
      let currentVal;
      if (period === 'PRE-MARKET' && stock.extended?.isExtendedHours) {
        currentVal = stock.extended.changePercent;
      } else {
        currentVal = marketChange;
      }
      
      const diff = currentVal - frozenVal;
      
      if (Math.abs(diff) < 0.01) {
        diffCell.textContent = '—';
        diffCell.className = 'nasdaq-diff';
      } else {
        const arrow = diff > 0 ? '↑' : '↓';
        const diffClass = diff > 0 ? 'price-positive' : 'price-negative';
        diffCell.textContent = `${arrow} ${Math.abs(diff).toFixed(2)}%`;
        diffCell.className = `nasdaq-diff ${diffClass}`;
      }
    } else {
      diffCell.textContent = '--';
      diffCell.className = 'nasdaq-diff';
    }
  });
  
  console.log(`✅ NASDAQ: ${updatedCount} de ${nasdaqStocks.length} ativos atualizados`);
  
  // Calcular média das diferenças e mostrar alertas
  calculateNasdaqAverageAndAlert();
}

function calculateNasdaqAverageAndAlert() {
  if (!frozenNasdaq) return; // Só calcula quando está congelado
  
  let totalDiff = 0;
  let count = 0;
  
  nasdaqStocks.forEach(symbol => {
    if (nasdaqFrozenValues[symbol]) {
      const row = document.getElementById(`nasdaq-${symbol}`);
      if (row) {
        const diffCell = row.querySelector('.nasdaq-diff');
        const diffText = diffCell.textContent;
        
        if (diffText !== '--' && diffText !== '—') {
          // Extrair valor numérico (remover seta e %)
          const value = parseFloat(diffText.replace('↑', '').replace('↓', '').replace('%', '').trim());
          // Se for seta para baixo, tornar negativo
          const finalValue = diffText.includes('↓') ? -value : value;
          totalDiff += finalValue;
          count++;
        }
      }
    }
  });
  
  if (count > 0) {
    const average = totalDiff / count;
    console.log(`📊 Média NASDAQ: ${average.toFixed(2)}% (${count} ativos)`);
    
    // Atualizar display da média no cabeçalho
    const averageDisplay = document.getElementById('nasdaqAverage');
    if (averageDisplay) {
      averageDisplay.style.display = 'inline-block';
      const strongElement = averageDisplay.querySelector('strong');
      strongElement.textContent = `${average > 0 ? '+' : ''}${average.toFixed(2)}%`;
      
      // Aplicar classe de cor (verde se positivo, vermelho se negativo)
      averageDisplay.classList.remove('positive', 'negative', 'neutral');
      if (average > 0) {
        averageDisplay.classList.add('positive');
      } else if (average < 0) {
        averageDisplay.classList.add('negative');
      } else {
        averageDisplay.classList.add('neutral');
      }
    }
    
    const alertDiv = document.getElementById('tradingAlert');
    const alertMessage = document.getElementById('alertMessage');
    
    // Verificar se deve mostrar alerta (limite de 0.03%)
    const shouldShowBuyAlert = average >= 0.03;
    const shouldShowSellAlert = average <= -0.03;
    const wasVisible = alertDiv.style.display === 'block';
    
    if (shouldShowBuyAlert) {
      // SINAL DE VOLUME DE COMPRA
      alertDiv.className = 'trading-alert buy';
      alertMessage.innerHTML = `<strong>SINAL DE VOLUME DE COMPRA, ANALISE MAIS DADOS!!!</strong><br>Média: <strong>+${average.toFixed(2)}%</strong>`;
      if (!wasVisible) {
        playAlertSound();
      }
      alertDiv.style.display = 'block';
    } else if (shouldShowSellAlert) {
      // SINAL DE VOLUME DE VENDA
      alertDiv.className = 'trading-alert sell';
      alertMessage.innerHTML = `<strong>SINAL DE VOLUME DE VENDA, ANALISE MAIS DADOS!!!</strong><br>Média: <strong>${average.toFixed(2)}%</strong>`;
      if (!wasVisible) {
        playAlertSound();
      }
      alertDiv.style.display = 'block';
    } else {
      alertDiv.style.display = 'none';
    }
  }
}

// Função para tocar som de alerta
function playAlertSound() {
  // Criar contexto de áudio
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Criar oscilador para o som
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configurar som (frequência e tipo)
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequência alta
  
  // Envelope de volume
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  // Tocar o som
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  // Som duplo (bipe-bipe)
  setTimeout(() => {
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
    
    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.5);
  }, 200);
  
  console.log('🔊 Alerta sonoro tocado!');
}

function updateSP500Map(data) {
  // Mapa carregado via iframe do TradingView - atualização automática
  // Não precisa de atualização manual
}

function updateHighlights(data) {
  // Atualizar AAPL
  const aapl = data['AAPL'];
  if (aapl) {
    const aaplCard = document.getElementById('highlightAAPL');
    const change = aapl.extended?.isExtendedHours && aapl.extended.changePercent 
      ? aapl.extended.changePercent
      : aapl.regularMarketChangePercent || 0;
    aaplCard.querySelector('.highlight-price').textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    aaplCard.querySelector('.highlight-price').className = `highlight-price ${change > 0 ? 'price-positive' : 'price-negative'}`;
  }
  
  // Atualizar MSFT
  const msft = data['MSFT'];
  if (msft) {
    const msftCard = document.getElementById('highlightMSFT');
    const change = msft.extended?.isExtendedHours && msft.extended.changePercent 
      ? msft.extended.changePercent
      : msft.regularMarketChangePercent || 0;
    msftCard.querySelector('.highlight-price').textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    msftCard.querySelector('.highlight-price').className = `highlight-price ${change > 0 ? 'price-positive' : 'price-negative'}`;
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

console.log('✅ Dashboard Professional script carregado');
