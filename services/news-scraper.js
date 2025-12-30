const axios = require('axios');
const cheerio = require('cheerio');
const { scrapeFinancialJuiceNews } = require('./financialjuice-scraper');

// Cache para Financial Juice (evitar lentidão do Puppeteer)
let fjCache = {
  data: [],
  timestamp: 0,
  isUpdating: false
};
const FJ_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Função para verificar se uma data é de hoje
function isToday(dateString) {
  try {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  } catch (error) {
    return false;
  }
}

// Função para buscar Financial Juice com cache
async function getFinancialJuiceNews() {
  const now = Date.now();
  const cacheAge = now - fjCache.timestamp;
  
  // Se o cache é válido (menos de 10 minutos) E não está vazio, retornar dados em cache
  if (cacheAge < FJ_CACHE_DURATION && fjCache.data.length > 0 && !fjCache.isUpdating) {
    console.log('[FJ CACHE] Usando cache (idade: ' + Math.floor(cacheAge / 60000) + ' minutos)');
    return fjCache.data;
  }
  
  // Se já está atualizando, esperar 2 segundos e retornar cache se disponível
  if (fjCache.isUpdating) {
    console.log('[FJ CACHE] Atualização já em andamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return fjCache.data.length > 0 ? fjCache.data : [];
  }
  
  // Iniciar atualização
  fjCache.isUpdating = true;
  console.log('[FJ CACHE] Buscando novas notícias do Financial Juice...');
  
  try {
    const fjResult = await scrapeFinancialJuiceNews();
    
    if (fjResult.success && fjResult.data.length > 0) {
      fjCache.data = fjResult.data;
      fjCache.timestamp = now;
      console.log(`[FJ CACHE] Cache atualizado com ${fjResult.data.length} notícias`);
    } else {
      console.log('[FJ CACHE] Nenhuma notícia retornada');
    }
  } catch (error) {
    console.error('[FJ CACHE] Erro ao buscar:', error.message);
  } finally {
    fjCache.isUpdating = false;
  }
  
  return fjCache.data;
}

const scrapeInvestingNews = async () => {
  try {
    console.log('[NEWS SCRAPER] Buscando notícias do Yahoo Finance...');
    
    // Fazer scraping da página HTML do Yahoo Finance
    const response = await axios.get('https://finance.yahoo.com/news/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxHeaderSize: 32768, // Aumentar limite de headers para 32KB
      maxBodyLength: 10 * 1024 * 1024, // Limite de 10MB para o body
      maxContentLength: 10 * 1024 * 1024 // Limite de 10MB para o conteúdo
    });

    const $ = cheerio.load(response.data);
    const news = [];
    let foundTopNews = false;
    let foundYahooNetwork = false;

    console.log('[YAHOO SCRAPER] Processando página HTML...');

    // Procurar por todos os links de notícias
    $('a').each((index, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      
      // Verificar se é um link de notícia válido
      if (!href || !href.includes('/news/') || href.includes('/video/')) {
        return;
      }
      
      // Pegar o texto do título (pode estar em diferentes elementos dentro do link)
      let title = $link.find('h3').text().trim() || 
                  $link.find('h2').text().trim() || 
                  $link.find('[class*="title"]').text().trim() ||
                  $link.text().trim();
      
      if (!title || title.length < 15) {
        return;
      }
      
      // Verificar se passamos das seções "Top News" e "News from the Yahoo Finance Network"
      const titleLower = title.toLowerCase();
      if (titleLower.includes('top news') || titleLower.includes('top stories')) {
        foundTopNews = true;
        return;
      }
      if (titleLower.includes('yahoo finance network') || titleLower.includes('news from yahoo')) {
        foundYahooNetwork = true;
        return;
      }
      
      // Só começar a coletar depois de passar pelas duas seções
      if (!foundTopNews || !foundYahooNetwork) {
        return;
      }
      
      // Construir URL completa se necessário
      let fullUrl = href;
      if (href.startsWith('/')) {
        fullUrl = 'https://finance.yahoo.com' + href;
      }
      
      // Tentar encontrar a data/hora próxima ao link
      let pubDateStr = '';
      let timeText = '';
      
      // Procurar por elementos de tempo próximos
      const $parent = $link.parent();
      const $timeElement = $parent.find('time').first();
      if ($timeElement.length > 0) {
        pubDateStr = $timeElement.attr('datetime') || '';
        timeText = $timeElement.text().trim();
      }
      
      // Se não encontrou, procurar por texto de tempo no parent
      if (!pubDateStr) {
        const parentText = $parent.text();
        const timeMatch = parentText.match(/(\d+)\s*(hour|minute|day|hr|min|h|m)s?\s*ago/i);
        if (timeMatch) {
          const value = parseInt(timeMatch[1]);
          const unit = timeMatch[2].toLowerCase();
          const now = new Date();
          
          if (unit.startsWith('m')) {
            now.setMinutes(now.getMinutes() - value);
          } else if (unit.startsWith('h')) {
            now.setHours(now.getHours() - value);
          } else if (unit.startsWith('d')) {
            now.setDate(now.getDate() - value);
          }
          
          pubDateStr = now.toISOString();
          timeText = timeMatch[0];
        }
      }
      
      // Se ainda não tem data, usar data atual
      if (!pubDateStr) {
        pubDateStr = new Date().toISOString();
      }
      
      // Extrair símbolos de ações do título
      let stocks = [];
      const tickerMatch = title.match(/\(([A-Z]{2,5}(?::[A-Z]{2,5})?)\)/g);
      if (tickerMatch) {
        stocks = tickerMatch.map(t => t.replace(/[()]/g, '').split(':').pop()).slice(0, 5);
      }
      
      // Formatar data
      let time = 'Recente';
      let fullDate = '';
      try {
        const date = new Date(pubDateStr);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);
        
        if (diffMinutes < 60) {
          time = `${diffMinutes}m`;
        } else if (diffMinutes < 1440) {
          time = `${Math.floor(diffMinutes / 60)}h`;
        } else {
          time = `${Math.floor(diffMinutes / 1440)}d`;
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        fullDate = `${day}/${month}/${year} ${hours}:${minutes}`;
      } catch (e) {
        time = timeText || 'Recente';
        fullDate = pubDateStr;
      }
      
      // Adicionar notícia se ainda não existe (evitar duplicatas)
      const exists = news.some(n => n.title === title || n.url === fullUrl);
      if (!exists && news.length < 100) {
        news.push({
          title: title,
          time: time,
          fullDate: fullDate,
          pubDate: pubDateStr,
          source: 'Yahoo Finance',
          url: fullUrl,
          stocks: stocks
        });
      }
    });

    console.log(`[NEWS SCRAPER] ${news.length} notícias encontradas do Yahoo Finance`);
    
    // Buscar notícias do Financial Juice com cache inteligente
    try {
      const fjNews = await getFinancialJuiceNews();
      
      if (fjNews.length > 0) {
        console.log(`[NEWS SCRAPER] Adicionando ${fjNews.length} notícias do Financial Juice`);
        news.push(...fjNews);
      } else {
        console.log('[NEWS SCRAPER] Nenhuma notícia do Financial Juice disponível');
      }
    } catch (fjError) {
      console.error('[NEWS SCRAPER] Erro ao buscar Financial Juice:', fjError.message);
    }
    
    // Filtrar apenas notícias de hoje
    const todayNews = news.filter(item => {
      if (!item.pubDate) return false;
      const isFromToday = isToday(item.pubDate);
      if (!isFromToday) {
        console.log(`[NEWS FILTER] Removendo notícia antiga: ${item.title.substring(0, 50)}... (${item.pubDate})`);
      }
      return isFromToday;
    });
    
    console.log(`[NEWS SCRAPER] Filtrando: ${news.length} total -> ${todayNews.length} de hoje`);
    
    // Ordenar cronologicamente (mais antigas primeiro = ordem crescente)
    todayNews.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return dateA - dateB; // Ordem crescente (mais antigas primeiro)
    });
    
    console.log(`[NEWS SCRAPER] Total final: ${todayNews.length} notícias de hoje em ordem cronológica`);
    
    return {
      success: true,
      data: todayNews,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[NEWS SCRAPER] Erro ao buscar notícias:', error.message);
    return {
      success: false,
      error: 'Erro ao obter notícias',
      details: error.message,
      data: []
    };
  }
};

module.exports = { scrapeInvestingNews };
