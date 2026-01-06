const axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { scrapeFinancialJuiceNews } = require('./financialjuice-scraper');

// Cache para Financial Juice
let fjCache = {
  data: [],
  timestamp: 0,
  isUpdating: false
};
const FJ_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// --- AGENDADOR AUTOMÁTICO DE ATUALIZAÇÃO DO CACHE ---
async function updateFjCache() {
  if (fjCache.isUpdating) return;
  try {
    fjCache.isUpdating = true;
    const result = await scrapeFinancialJuiceNews();
    // Filtrar notícias indesejadas
    const filtered = result.filter(item => !item.title || !item.title.toLowerCase().includes('need to know market risk'));
    if (filtered && filtered.length > 0) {
      fjCache.data = filtered;
      fjCache.timestamp = Date.now();
      console.log(`[FJ AGENDADOR] Cache atualizado automaticamente com ${filtered.length} notícias`);
    }
  } catch (err) {
    console.error('[FJ AGENDADOR] Erro ao atualizar cache automático:', err.message);
  } finally {
    fjCache.isUpdating = false;
  }
}

// Iniciar agendador automático (a cada 10 segundos)
if (process.env.DISABLE_SCRAPER === 'true') {
  console.log('[FJ AGENDADOR] Agendador automático desabilitado por DISABLE_SCRAPER=true');
} else {
  setInterval(updateFjCache, 1000);
}

// Função para verificar se uma data é de 1 dia até hoje
function isRecent(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0); // Início do dia de ontem
    
    return date >= oneDayAgo;
  } catch (error) {
    return false;
  }
}

// Função para buscar Financial Juice com cache
async function getFinancialJuiceNews() {
  const now = Date.now();
  const cacheAge = now - fjCache.timestamp;
  // Reduzir cache para 1 segundo
  const CACHE_DURATION = 1000;
  // Se o cache é válido e não está atualizando, retorna
  if (cacheAge < CACHE_DURATION && fjCache.data.length > 0 && !fjCache.isUpdating) {
    console.log(`[FJ CACHE] Usando cache (${Math.floor(cacheAge / 1000)}s de idade)`);
    return fjCache.data;
  }
  
  // Se já está atualizando, aguarda um pouco
  if (fjCache.isUpdating) {
    console.log('[FJ CACHE] Atualização em andamento, aguardando...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return fjCache.data;
  }
  
  try {
    fjCache.isUpdating = true;
    console.log('[FJ CACHE] Cache expirado ou vazio, buscando novas notícias...');
    
    let result = await scrapeFinancialJuiceNews();
    // Filtrar notícias indesejadas
    result = result.filter(item => !item.title || !item.title.toLowerCase().includes('need to know market risk'));
    // Log detalhado das notícias capturadas
    console.log('[FJ DEBUG] Notícias capturadas do FinancialJuice:');
    result.forEach((item, idx) => {
      console.log(`[${idx + 1}] ${item.title} | ${item.time || item.timeText || ''} | ${item.url}`);
    });
    if (result && result.length > 0) {
      fjCache.data = result;
      fjCache.timestamp = now;
      console.log(`[FJ CACHE] Cache atualizado com ${result.length} notícias`);
    }
    return fjCache.data;
  } finally {
    fjCache.isUpdating = false;
  }
}

const scrapeInvestingNews = async () => {
  try {
    console.log('[NEWS SCRAPER] Buscando TODAS as notícias do Yahoo Finance - Top News (via RSS)...');
    
    // O site Yahoo tem problema de header overflow no HTML,
    // então usamos o RSS feed completo para obter todas as notícias da seção Top News
    const response = await axios.get('https://finance.yahoo.com/news/rssindex', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const news = [];
    
    console.log('[YAHOO SCRAPER] Processando RSS - Coletando TODAS as notícias do Top News...');
    
    $('item').each((index, element) => {
      // Sem limite - pegar todas as notícias disponíveis no RSS
      
      const $item = $(element);
      const title = $item.find('title').text().trim();
      const pubDate = $item.find('pubDate').text().trim();
      const link = $item.find('link').text().trim();
      
      if (!title || !link) return;
      
      // Extrair símbolos de ações do título
      const stockMatches = title.match(/\b[A-Z]{2,5}\b/g);
      const stocks = stockMatches ? stockMatches.filter(s => s.length >= 2 && s.length <= 5).slice(0, 3) : [];
      
      // Converter data para formato relativo
      let time = 'Agora';
      let fullDate = pubDate;
      
      if (pubDate) {
        const newsDate = new Date(pubDate);
        const now = new Date();
        const diffMs = now - newsDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) {
          time = 'Agora';
        } else if (diffMins < 60) {
          time = `${diffMins}m`;
        } else if (diffHours < 24) {
          time = `${diffHours}h`;
        } else {
          time = `${Math.floor(diffHours / 24)}d`;
        }
        
        fullDate = newsDate.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      news.push({
        title,
        time,
        fullDate,
        pubDate: pubDate || new Date().toISOString(),
        source: 'Yahoo Finance - Top News',
        url: link,
        stocks
      });
    });
    
    console.log(`[NEWS SCRAPER] ${news.length} notícias Top News encontradas`);
    
    // Buscar notícias do Financial Juice (com cache)
    const fjNews = await getFinancialJuiceNews();
    console.log(`[NEWS SCRAPER] ${fjNews.length} notícias encontradas do Financial Juice`);
    
    // Combinar as notícias
    const allNews = [...news, ...fjNews];
    console.log(`[NEWS SCRAPER] Total combinado: ${allNews.length} notícias`);
    // Log detalhado das notícias combinadas
    allNews.forEach((item, idx) => {
      console.log(`[ALL NEWS][${idx + 1}] ${item.title} | ${item.time || item.timeText || ''} | ${item.url}`);
    });
    
    // Filtrar notícias de 1 dia até hoje
    const recentNews = allNews.filter(item => {
      if (!item.pubDate) return false;
      const isFromLastDay = isRecent(item.pubDate);
      if (!isFromLastDay) {
        console.log(`[NEWS FILTER] Removendo notícia antiga: ${item.title.substring(0, 50)}... (${item.pubDate})`);
      }
      return isFromLastDay;
    });
    
    // Ordenar cronologicamente DECRESCENTE (mais recentes primeiro)
    recentNews.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return dateB - dateA; // Invertido para ordem decrescente
    });
    
    console.log(`[NEWS SCRAPER] Filtrando: ${allNews.length} total -> ${recentNews.length} de 1 dia até hoje`);
    console.log(`[NEWS SCRAPER] Total final: ${recentNews.length} notícias de 1 dia até hoje (mais recentes primeiro)`);
    
    return {
      success: true,
      data: recentNews
    };
  } catch (error) {
    console.error('[NEWS SCRAPER] Erro ao buscar notícias:', error.message);
    return {
      success: false,
      error: 'Erro ao obter notícias',
      data: []
    };
  }
};

module.exports = {
  scrapeInvestingNews
};
