const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://finance.yahoo.com/news/rssindex').then(response => {
  const $ = cheerio.load(response.data, {xmlMode: true});
  
  console.log('=== Primeira Notícia - Análise Completa ===\n');
  
  const $firstItem = $('item').first();
  const title = $firstItem.find('title').text().trim();
  const desc = $firstItem.find('description').text();
  
  console.log(`Título: ${title}`);
  console.log(`\nDescription (primeiros 800 caracteres):\n${desc.substring(0, 800)}`);
  console.log(`\n\nTamanho total da description: ${desc.length} caracteres`);
  
}).catch(err => console.error('Erro:', err.message));
