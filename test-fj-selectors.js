const puppeteer = require('puppeteer');

async function testFinancialJuiceSelectors() {
    let browser = null;
    
    try {
        console.log('🔍 Iniciando teste de seletores do Financial Juice...');
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('📄 Acessando página...');
        await page.goto('https://www.financialjuice.com/home', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Login
        console.log('🔐 Fazendo login...');
        await page.type('input[type="email"]', 'saulo.costa@yahoo.com.br');
        await page.type('input[type="password"]', 'Sa@159753');
        
        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
                loginButton.click()
            ]);
        }
        
        console.log('✅ Login realizado, aguardando conteúdo...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Pegar estrutura detalhada dos containers de notícias
        const newsStructure = await page.evaluate(() => {
            const containers = document.querySelectorAll('.feedWrap, .media');
            const results = [];
            
            containers.forEach((container, i) => {
                if (i < 5) { // Apenas os 5 primeiros para análise
                    const info = {
                        index: i,
                        classes: container.className,
                        innerHTML: container.innerHTML.substring(0, 800),
                        links: []
                    };
                    
                    // Pegar todos os links dentro do container
                    container.querySelectorAll('a').forEach(a => {
                        if (a.href && !a.href.includes('javascript:')) {
                            info.links.push({
                                href: a.href,
                                text: a.textContent.trim().substring(0, 100),
                                classes: a.className
                            });
                        }
                    });
                    
                    results.push(info);
                }
            });
            
            return results;
        });
        
        console.log('\n📦 ESTRUTURA DOS CONTAINERS DE NOTÍCIAS:\n');
        newsStructure.forEach(item => {
            console.log(`\n=== CONTAINER ${item.index} ===`);
            console.log(`Classes: ${item.classes}`);
            console.log(`\nLinks encontrados (${item.links.length}):`);
            item.links.forEach((link, i) => {
                console.log(`  ${i + 1}. [${link.classes}] ${link.text}`);
                console.log(`     ${link.href}`);
            });
            console.log(`\nHTML (primeiros 400 chars):`);
            console.log(item.innerHTML.substring(0, 400));
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (browser) await browser.close();
    }
}

testFinancialJuiceSelectors();
