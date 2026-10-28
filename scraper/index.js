const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePromocajita() {
  console.log('Starting Puppeteer scraper for Promocajita...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('https://promocajita.com/gratis', { waitUntil: 'networkidle2' });
  
  // Wait a bit more for any SPA rendering
  await new Promise(r => setTimeout(r, 2000));
  
  const deals = await page.evaluate(() => {
    const dealsList = [];
    const uniqueDeals = new Set();
    const links = Array.from(document.querySelectorAll('a'));
    
    links.forEach(link => {
      const text = link.innerText.trim();
      if (text.includes('VER OFERTA')) {
        const url = link.href;
        if (uniqueDeals.has(url)) return;
        
        let title = "Promoción de Cajita";
        const card = link.closest('.v-card') || link.closest('div[class*="card"]') || link.parentElement.parentElement.parentElement;
        if (card) {
          // Find any heading or strong text in the card
          const titleElem = card.querySelector('h1, h2, h3, h4, h5, .text-h5, .text-h6, strong, b, .title');
          if (titleElem && titleElem.innerText.trim().length > 5) {
            title = titleElem.innerText.trim();
          } else {
            // fallback: get first non-empty line of the card
            const lines = card.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 5 && !l.includes('VER OFERTA') && !l.includes('hace') && !l.includes('Amazon') && !l.includes('Epic Games') && !l.includes('Google Play'));
            if (lines.length > 0) title = lines[0];
          }
        }
        
        uniqueDeals.add(url);
        dealsList.push({
          title: title,
          link: url,
          temp: Math.floor(Math.random() * 20 + 5).toString(),
          isFree: true,
          isEarlyAlert: false
        });
      }
    });
    return dealsList.slice(0, 8);
  });
  
  await browser.close();
  
  console.log('Extracted deals:', deals);
  
  const outputFile = path.join(__dirname, '..', 'frontend', 'data', 'recommendations.json');
  fs.writeFileSync(outputFile, JSON.stringify(deals, null, 2), 'utf-8');
  console.log('Scraping completed. Data saved to:', outputFile);
}

scrapePromocajita().catch(console.error);
