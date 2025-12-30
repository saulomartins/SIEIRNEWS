const express = require('express');
const authMiddleware = require('../middleware/auth');
const { scrapeYahooFinance } = require('../services/scraper');
const { scrapeInvestingNews } = require('../services/news-scraper-simple');

const router = express.Router();

// Lista de ativos padrão para monitoramento
const defaultTickers = ['TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN'];

// Rota para obter dados de um ticker específico
router.get('/ticker/:symbol', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await scrapeYahooFinance(symbol.toUpperCase());
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        message: 'Erro ao obter dados',
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Erro na rota /ticker/${req.params.symbol}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter dados de múltiplos tickers (GET com query string)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({ message: 'Parâmetro symbols é obrigatório' });
    }

    const symbolsArray = symbols.split(',').map(s => s.trim());
    
    console.log('Buscando dados para:', symbolsArray);

    // Buscar dados de todos os tickers em paralelo
    const promises = symbolsArray.map(ticker => scrapeYahooFinance(ticker.toUpperCase()));
    const results = await Promise.all(promises);

    // Criar array com dados válidos
    const tickersData = results
      .filter(result => result.success)
      .map(result => result.data);

    console.log('Dados retornados:', tickersData.map(d => d.ticker));
    res.json(tickersData);
  } catch (error) {
    console.error('Erro na rota GET /data:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter dados de múltiplos tickers (POST - mantida para compatibilidade)
router.post('/multiple', authMiddleware, async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ message: 'Lista de symbols inválida' });
    }

    console.log('Buscando dados para:', symbols);

    // Buscar dados de todos os tickers em paralelo
    const promises = symbols.map(ticker => scrapeYahooFinance(ticker.toUpperCase()));
    const results = await Promise.all(promises);

    // Criar objeto com os tickers como chaves
    const tickersData = {};
    results.forEach(result => {
      if (result.success) {
        tickersData[result.data.ticker] = result.data;
      }
    });

    console.log('Dados retornados:', Object.keys(tickersData));
    res.json(tickersData);
  } catch (error) {
    console.error('Erro na rota /multiple:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter lista de tickers padrão
router.get('/default-tickers', authMiddleware, (req, res) => {
  res.json({ tickers: defaultTickers });
});

// Rota legada (mantida para compatibilidade)
router.get('/tsla', authMiddleware, async (req, res) => {
  try {
    const result = await scrapeYahooFinance('TSLA');
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        message: 'Erro ao obter dados',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro na rota /tsla:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter notícias do Investing.com
router.get('/news', authMiddleware, async (req, res) => {
  try {
    console.log('📰 Requisição de notícias recebida');
    const result = await scrapeInvestingNews();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        message: 'Erro ao obter notícias',
        error: result.error,
        data: []
      });
    }
  } catch (error) {
    console.error('Erro na rota /news:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      data: []
    });
  }
});

module.exports = router;
