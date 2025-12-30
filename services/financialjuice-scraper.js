const puppeteer = require('puppeteer');

// Configuração de login
const LOGIN_CONFIG = {
    url: 'https://www.financialjuice.com/home',
    email: 'saulo.costa@yahoo.com.br',
    password: 'Sa@159753'
};

// Função para formatar data relativa
function formatRelativeTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    } catch (error) {
        return 'N/A';
    }
}

// Função para formatar data completa
function formatFullDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        return 'N/A';
    }
}

// Função principal de scraping com autenticação
async function scrapeFinancialJuiceNews() {
    let browser = null;
    
    try {
        console.log('[FINANCIAL JUICE] Iniciando navegador...');
        
        // Lançar navegador
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Configurar user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('[FINANCIAL JUICE] Acessando página de login...');
        await page.goto(LOGIN_CONFIG.url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Aguardar um pouco para garantir que o modal de login apareça
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('[FINANCIAL JUICE] Preenchendo formulário de login...');
        
        // Tentar encontrar e preencher o campo de email com múltiplos seletores
        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="mail" i]',
            'input[placeholder*="Email" i]',
            '#email',
            '.email-input'
        ];
        
        let emailFilled = false;
        for (const selector of emailSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, LOGIN_CONFIG.email);
                console.log(`[FINANCIAL JUICE] Email preenchido com seletor: ${selector}`);
                emailFilled = true;
                break;
            } catch (error) {
                // Tentar próximo seletor
            }
        }
        
        if (!emailFilled) {
            throw new Error('Campo de email não encontrado com nenhum seletor');
        }

        // Tentar preencher senha com múltiplos seletores
        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password" i]',
            'input[placeholder*="senha" i]',
            '#password',
            '.password-input'
        ];
        
        let passwordFilled = false;
        for (const selector of passwordSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, LOGIN_CONFIG.password);
                console.log(`[FINANCIAL JUICE] Senha preenchida com seletor: ${selector}`);
                passwordFilled = true;
                break;
            } catch (error) {
                // Tentar próximo seletor
            }
        }
        
        if (!passwordFilled) {
            throw new Error('Campo de senha não encontrado com nenhum seletor');
        }

        // Clicar no botão de login usando múltiplos métodos
        console.log('[FINANCIAL JUICE] Procurando botão de login...');
        
        try {
            // Procurar por todos os botões e inputs submit
            const loginButton = await page.evaluateHandle(() => {
                // Procurar botões com texto "LOGIN" ou "SIGN IN"
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, .button'));
                const loginBtn = buttons.find(btn => {
                    const text = btn.textContent.toLowerCase().trim();
                    return text === 'login' || text === 'sign in' || text === 'entrar' || text.includes('log in');
                });
                
                return loginBtn;
            });
            
            if (loginButton) {
                console.log('[FINANCIAL JUICE] Botão de login encontrado, clicando...');
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log('Navegação timeout - continuando...')),
                    loginButton.click()
                ]);
                console.log('[FINANCIAL JUICE] Login clicado');
            } else {
                // Tentar pressionar Enter no campo de senha
                console.log('[FINANCIAL JUICE] Botão não encontrado, tentando Enter...');
                await page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            console.log('[FINANCIAL JUICE] Login realizado');
            
        } catch (error) {
            console.error('[FINANCIAL JUICE] Erro ao clicar login:', error.message);
            // Tentar Enter como fallback
            try {
                await page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (e) {
                throw new Error('Não foi possível fazer login');
            }
        }

        // Aguardar a página carregar após o login
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('[FINANCIAL JUICE] Buscando notícias...');
        
        // Aguardar mais um pouco para garantir que o conteúdo carregou
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extrair notícias da página usando seletores específicos do Financial Juice
        const news = await page.evaluate(() => {
            const newsItems = [];
            
            // Buscar todos os containers de notícias
            const newsContainers = document.querySelectorAll('.feedWrap');
            
            console.log(`[FJ SCRAPER] Encontrados ${newsContainers.length} containers de notícias`);

            newsContainers.forEach((container, index) => {
                if (index >= 30) return; // Limitar a 30 notícias

                // Buscar o título - pode estar em span.headline-title-nolink ou a.headline-title-nolink
                let titleElement = container.querySelector('.headline-title-nolink');
                
                if (!titleElement) {
                    console.log(`[FJ SCRAPER] Container ${index}: Sem título`);
                    return;
                }

                // Pegar o texto do título
                let title = titleElement.textContent.trim();
                
                // Limpar título
                title = title.replace(/\s+/g, ' ').trim();

                // Filtrar títulos indesejados ou muito curtos
                const excludedPhrases = [
                    'Need to know market risk',
                    'Join us and Go Real-time',
                    'Track all markets'
                ];
                
                const shouldExclude = excludedPhrases.some(phrase => 
                    title.toLowerCase().includes(phrase.toLowerCase())
                );
                
                if (shouldExclude || title.length < 15) {
                    console.log(`[FJ SCRAPER] Container ${index}: Título excluído ou muito curto - "${title}"`);
                    return;
                }

                // Buscar a URL se o elemento for um link, senão usar URL base
                let url = 'https://www.financialjuice.com/home';
                if (titleElement.tagName === 'A' && titleElement.href) {
                    url = titleElement.href;
                }
                
                // Buscar data/hora na classe news-label ou timestamp
                let timeText = '';
                const timeElement = container.querySelector('.news-label, .timestamp, [class*="time"]');
                if (timeElement) {
                    timeText = timeElement.textContent.trim();
                }
                
                // Buscar data/hora - tentar vários seletores
                const timeElements = container.querySelectorAll('small, .time, [class*="time"], [class*="date"], span, time');
                for (const timeEl of timeElements) {
                    const text = timeEl.textContent.trim();
                    // Procurar por padrões de hora (HH:MM) ou tempo relativo
                    if (text.match(/\d{1,2}:\d{2}/) || text.match(/\d+\s*(min|hour|hr|h|m|ago|atrás)/i)) {
                        dateString = text;
                        break;
                    }
                }
                
                // Se encontrou hora, criar data de hoje com essa hora
                let pubDate = new Date().toISOString();
                if (timeText) {
                    // Tentar extrair hora no formato HH:MM
                    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        const today = new Date();
                        today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
                        pubDate = today.toISOString();
                    }
                }

                console.log(`[FJ SCRAPER] Container ${index}: OK - "${title.substring(0, 50)}..."`);

                // Adicionar notícia válida
                newsItems.push({
                    title: title.substring(0, 250),
                    url: url,
                    pubDate: pubDate,
                    timeText: timeText
                });
            });

            console.log(`[FJ SCRAPER] Total de notícias válidas: ${newsItems.length}`);
            return newsItems;
        });

        console.log(`[FINANCIAL JUICE] ${news.length} notícias encontradas`);

        // Formatar notícias
        const formattedNews = news.map(item => ({
            title: item.title,
            time: formatRelativeTime(item.pubDate),
            fullDate: formatFullDate(item.pubDate),
            pubDate: item.pubDate,
            source: 'Financial Juice',
            url: item.url,
            stocks: []
        }));

        await browser.close();

        return formattedNews;

    } catch (error) {
        console.error('[FINANCIAL JUICE] Erro ao fazer scraping:', error.message);
        
        if (browser) {
            await browser.close();
        }

        return [];
    }
}

module.exports = {
    scrapeFinancialJuiceNews
};
