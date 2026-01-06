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
const FJ_CACHE_DURATION = 1000; // 1 segundo

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

// ...restante do código existente...
