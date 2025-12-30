const axios = require('axios');

const scrapeYahooFinance = async (ticker) => {
  try {
    console.log(`[SCRAPER] Iniciando busca para ${ticker}...`);
    
    // Usar a API pública do Yahoo Finance (v8) - mesma fonte usada pela página do Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    
    console.log(`[SCRAPER] URL: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        interval: '1m',
        range: '1d',
        includePrePost: true // Incluir dados de pré e pós mercado
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    console.log(`[SCRAPER] Resposta recebida para ${ticker}`);

    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      console.error(`[SCRAPER] Formato de resposta inválido para ${ticker}`);
      throw new Error('Formato de resposta inválido');
    }

    const result = response.data.chart.result[0];
    const quote = result.meta;
    const indicators = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Extrair todos os dados disponíveis (mesmos dados exibidos em finance.yahoo.com)
    const regularMarketPrice = quote.regularMarketPrice;
    const previousClose = quote.previousClose || quote.chartPreviousClose;
    const regularMarketOpen = quote.regularMarketOpen;
    const regularMarketDayHigh = quote.regularMarketDayHigh;
    const regularMarketDayLow = quote.regularMarketDayLow;
    const regularMarketVolume = quote.regularMarketVolume;
    const regularMarketTime = quote.regularMarketTime;
    
    // Detectar dados de pré-mercado e pós-mercado (como no Yahoo Finance)
    const currentTradingPeriod = quote.currentTradingPeriod;
    const preMarketData = currentTradingPeriod?.pre;
    const postMarketData = currentTradingPeriod?.post;
    const regularMarketData = currentTradingPeriod?.regular;
    
    let postMarketPrice = quote.postMarketPrice || null;
    let preMarketPrice = quote.preMarketPrice || null;
    
    // Se não estiver disponível diretamente, buscar nos timestamps
    if (!postMarketPrice && !preMarketPrice && timestamps && timestamps.length > 0 && indicators.close) {
      const closeValues = indicators.close.filter(v => v !== null);
      
      if (closeValues.length > 0) {
        const lastClose = closeValues[closeValues.length - 1];
        const lastTimestamp = timestamps[timestamps.length - 1];
        
        // Verificar se está em horário estendido
        if (regularMarketData) {
          const regularEnd = regularMarketData.end;
          const regularStart = regularMarketData.start;
          
          if (lastTimestamp > regularEnd) {
            // Após o horário regular = After Hours
            postMarketPrice = lastClose;
          } else if (lastTimestamp < regularStart) {
            // Antes do horário regular = Pre-Market
            preMarketPrice = lastClose;
          }
        }
      }
    }
    
    // Determinar qual preço estendido usar
    let extendedPrice = null;
    let extendedChange = null;
    let extendedChangePercent = null;
    let extendedLabel = '';
    let isExtendedHours = false;
    let extendedTime = null;
    
    // After Hours tem prioridade
    if (postMarketPrice && postMarketPrice > 0) {
      extendedPrice = postMarketPrice;
      extendedChange = postMarketPrice - regularMarketPrice;
      extendedChangePercent = (extendedChange / regularMarketPrice) * 100;
      extendedLabel = 'After Hours';
      isExtendedHours = true;
      extendedTime = quote.postMarketTime || null;
    } 
    // Pre-Market como segunda opção
    else if (preMarketPrice && preMarketPrice > 0) {
      extendedPrice = preMarketPrice;
      extendedChange = preMarketPrice - regularMarketPrice;
      extendedChangePercent = (extendedChange / regularMarketPrice) * 100;
      extendedLabel = 'Pre-Market';
      isExtendedHours = true;
      extendedTime = quote.preMarketTime || null;
    }
    
    console.log(`[${ticker}] Regular: $${regularMarketPrice} | Extended: $${extendedPrice} (${extendedLabel})`);
    
    // Calcular variação do mercado regular (At Close) - exatamente como no Yahoo Finance
    let regularChangeValue = regularMarketPrice - previousClose;
    let regularChangePercent = previousClose ? (regularChangeValue / previousClose) * 100 : 0;

    return {
      success: true,
      data: {
        ticker: ticker.toUpperCase(),
        // Preço atual (regular ou extended)
        regularMarketPrice: regularMarketPrice,
        regularMarketChange: regularChangeValue,
        regularMarketChangePercent: regularChangePercent,
        regularMarketTime: regularMarketTime,
        
        // Dados do dia
        regularMarketOpen: regularMarketOpen,
        regularMarketDayHigh: regularMarketDayHigh,
        regularMarketDayLow: regularMarketDayLow,
        regularMarketVolume: regularMarketVolume,
        previousClose: previousClose,
        
        // At Close (Preço de fechamento do mercado regular)
        atClose: {
          regularMarketPrice: regularMarketPrice,
          regularMarketChange: regularChangeValue,
          regularMarketChangePercent: regularChangePercent,
          price: regularMarketPrice ? regularMarketPrice.toFixed(2) : 'N/A',
          change: regularChangeValue.toFixed(2),
          changePercent: regularChangePercent.toFixed(2)
        },
        // Extended Hours (Pre-Market ou After Hours)
        extended: {
          price: extendedPrice,
          change: extendedPrice ? extendedChange : 0,
          changePercent: extendedPrice ? extendedChangePercent : 0,
          priceFormatted: extendedPrice ? extendedPrice.toFixed(2) : null,
          changeFormatted: extendedPrice ? extendedChange.toFixed(2) : null,
          changePercentFormatted: extendedPrice ? extendedChangePercent.toFixed(2) : null,
          isExtendedHours: isExtendedHours,
          label: extendedLabel || 'Extended Hours',
          time: extendedTime
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`Erro ao buscar dados de ${ticker}:`, error.message);
    return {
      success: false,
      error: 'Erro ao obter dados do Yahoo Finance',
      details: error.message
    };
  }
};

module.exports = { scrapeYahooFinance };
