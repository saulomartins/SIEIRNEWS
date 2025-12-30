const { scrapeInvestingNews } = require('./services/news-scraper.js');

scrapeInvestingNews()
  .then(result => {
    console.log('\nSucesso:', result.success);
    console.log('Total:', result.data.length);
    
    if (result.data.length > 0) {
      console.log('\nPrimeiras 3 noticias:');
      result.data.slice(0, 3).forEach((news, i) => {
        console.log(`\n${i + 1}. ${news.title.substring(0, 80)}`);
        console.log(`   Tempo: ${news.time} | Fonte: ${news.source}`);
      });
    } else {
      console.log('\nNenhuma noticia encontrada');
      if (result.error) {
        console.log('Erro:', result.error);
      }
    }
  })
  .catch(err => {
    console.error('\nERRO:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
    }
  });
