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
                console.log(`[DEBUG LOGIN] Tentando preencher email com seletor: ${selector}`);
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, LOGIN_CONFIG.email);
                console.log(`[FINANCIAL JUICE] Email preenchido com seletor: ${selector}`);
                emailFilled = true;
                break;
            } catch (error) {
                console.log(`[DEBUG LOGIN] Falha ao preencher email com seletor: ${selector} - ${error.message}`);
            }
        }
        if (!emailFilled) {
            console.error('[DEBUG LOGIN] Nenhum seletor de email funcionou!');
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
                console.log(`[DEBUG LOGIN] Tentando preencher senha com seletor: ${selector}`);
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.type(selector, LOGIN_CONFIG.password);
                console.log(`[FINANCIAL JUICE] Senha preenchida com seletor: ${selector}`);
                passwordFilled = true;
                break;
            } catch (error) {
                console.log(`[DEBUG LOGIN] Falha ao preencher senha com seletor: ${selector} - ${error.message}`);
            }
        }
        if (!passwordFilled) {
            console.error('[DEBUG LOGIN] Nenhum seletor de senha funcionou!');
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

        // DEBUG: Logar HTML da página após login para inspecionar seletores
        const pageHtml = await page.content();
        const fs = require('fs');
        fs.writeFileSync('financialjuice_debug.html', pageHtml);
        console.log('[FINANCIAL JUICE] HTML da página após login salvo em financialjuice_debug.html');

        console.log('[FINANCIAL JUICE] Buscando notícias...');
        
        // Aguardar mais um pouco para garantir que o conteúdo carregou
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extrair notícias da página usando seletores específicos do Financial Juice
        const news = await page.evaluate(() => {
            const newsItems = [];
            // Buscar todos os blocos de notícia com a estrutura headline-item
            const newsContainers = document.querySelectorAll('.headline-item');
            newsContainers.forEach((container, index) => {
                // Título
                let titleElement = container.querySelector('.headline-title-nolink');
                let title = titleElement ? titleElement.textContent.trim().replace(/\s+/g, ' ').trim() : '';
                if (!title) return;
                // Link
                let url = 'https://www.financialjuice.com/home';
                const socialNav = container.querySelector('ul.social-nav');
                if (socialNav && socialNav.getAttribute('data-link')) {
                    url = socialNav.getAttribute('data-link');
                }
                // Horário
                let timeText = '';
                let pubDate = '';
                const timeElement = container.querySelector('.time');
                if (timeElement) {
                    timeText = timeElement.textContent.trim();
                    // Tentar converter timeText para data ISO
                    // Se for formato HH:MM, usar hoje
                    const match = timeText.match(/(\d{1,2}):(\d{2})/);
                    if (match) {
                        const now = new Date();
                        now.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
                        pubDate = now.toISOString();
                    } else if (/\d+\s*(min|hour|hr|h|m|ago|atrás)/i.test(timeText)) {
                        // Se for relativo, subtrair minutos/horas
                        const now = new Date();
                        const minMatch = timeText.match(/(\d+)\s*m(in)?/i);
                        const hourMatch = timeText.match(/(\d+)\s*h(r|our)?/i);
                        if (minMatch) {
                            now.setMinutes(now.getMinutes() - parseInt(minMatch[1]));
                        } else if (hourMatch) {
                            now.setHours(now.getHours() - parseInt(hourMatch[1]));
                        }
                        pubDate = now.toISOString();
                    } else {
                        // fallback: usar data/hora atual
                        pubDate = new Date().toISOString();
                    }
                } else {
                    pubDate = new Date().toISOString();
                }
                // Categorias
                const categories = Array.from(container.querySelectorAll('.news-label')).map(e => e.textContent.trim());
                // Adicionar notícia
                newsItems.push({
                    title: title.substring(0, 250),
                    url: url,
                    timeText: timeText,
                    pubDate: pubDate,
                    categories: categories
                });
            });
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
            stocks: [],
            critical: !!item.critical
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
