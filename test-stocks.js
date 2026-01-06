const {scrapeInvestingNews} = require('./services/news-scraper.js');

scrapeInvestingNews().then(result => {
  console.log('=== Análise de Stocks nas Notícias ===\n');
  console.log(`Total de notícias: ${result.data.length}\n`);
  
  result.data.slice(0, 10).forEach((news, index) => {
    console.log(`${index + 1}. ${news.title.substring(0, 70)}`);
    console.log(`   Stocks: ${news.stocks && news.stocks.length > 0 ? news.stocks.join(', ') : 'Nenhum'}`);
    console.log('');
  });
}).catch(err => console.error('Erro:', err.message));
// NOTE: if earlier run produced a short message, re-run to see full error with stack
