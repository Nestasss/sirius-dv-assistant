/**
 * SiriusDV - iDubid Scraper
 * Парсинг объявлений с сайта iDubid.com (Корея)
 */

const { chromium } = require('playwright');

class IDubidScraper {
  constructor() {
    this.baseUrl = 'https://idubid.com';
    this.browser = null;
    this.page = null;
  }

  async launch() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }

  async search(make, model, year, maxResults = 3) {
    try {
      console.log(`Ищу на iDubid: ${make} ${model} ${year}`);
      const searchUrl = `${this.baseUrl}/search?searchWord=${make}%20${model}`;
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForSelector('[class*="item"]', { timeout: 10000 }).catch(() => null);

      const listings = await this.page.evaluate((make, model, year, maxResults) => {
        const cars = [];
        const items = document.querySelectorAll('[class*="goods"], [class*="item"]');
        
        let count = 0;
        items.forEach((item) => {
          if (count >= maxResults) return;

          try {
            const titleEl = item.querySelector('h3, h2, a[class*="name"]');
            const title = titleEl ? titleEl.textContent.trim() : '';
            
            const priceEl = item.querySelector('[class*="price"]');
            const price = parseInt((priceEl?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            
            const mileageEl = item.querySelector('[class*="mileage"]');
            const mileage = parseInt((mileageEl?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            
            const bodyEl = item.querySelector('[class*="body"]');
            const bodyType = bodyEl ? bodyEl.textContent.trim() : 'Unknown';
            
            const photoEl = item.querySelector('img');
            const photoUrl = photoEl ? (photoEl.src || photoEl.dataset.src) : '';
            
            const linkEl = item.querySelector('a[href*="/goods/"]');
            const listingUrl = linkEl ? linkEl.href : '';

            if (title && price > 0 && listingUrl) {
              cars.push({
                make, model, year, title,
                price_krw: price, mileage, body_type: bodyType,
                photo_url: photoUrl, listing_url: listingUrl,
                source: 'idubid', country: 'Korea'
              });
              count++;
            }
          } catch (e) {
            console.error('Ошибка парсинга:', e.message);
          }
        });
        return cars;
      }, make, model, year, maxResults);

      return listings;
    } catch (error) {
      console.error('Ошибка iDubid:', error.message);
      return [];
    }
  }
}

module.exports = IDubidScraper;
