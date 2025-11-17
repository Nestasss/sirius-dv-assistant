/**
 * SiriusDV - Encar Scraper
 * Парсинг объявлений с сайта Encar.com (Корея)
 * Используется Playwright для запуска браузера
 */

const { chromium } = require('playwright');

class EncarScraper {
  constructor() {
    this.baseUrl = 'https://www.encar.com';
    this.browser = null;
    this.page = null;
  }

  /**
   * Запустить браузер
   */
  async launch() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    this.page = await this.browser.newPage();
    // Скрыть, что это автоматизация
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
  }

  /**
   * Закрыть браузер
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Поиск на Encar
   * @param {string} make - Марка (Toyota, Honda и т.д.)
   * @param {string} model - Модель (CR-V, Camry и т.д.)
   * @param {number} year - Год выпуска
   * @param {number} maxResults - Максимум результатов (по умолчанию 3)
   */
  async search(make, model, year, maxResults = 3) {
    try {
      console.log(`Ищу на Encar: ${make} ${model} ${year}`);

      // Построить URL поиска
      const searchUrl = `${this.baseUrl}/dc/search?keyword=${make}%20${model}&ofd_cd=&inc_main_cpc_ad=true&list_order=date`;
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // Ждём загрузки результатов
      await this.page.waitForSelector('.carItem', { timeout: 10000 }).catch(() => {
        console.log('Элементы не найдены, попробуем альтернативный селектор');
      });

      // Парсим объявления
      const listings = await this.page.evaluate((make, model, year, maxResults) => {
        const cars = [];
        const items = document.querySelectorAll('.carItem, .list_item');
        
        let count = 0;
        items.forEach((item) => {
          if (count >= maxResults) return;

          try {
            // Название авто
            const titleEl = item.querySelector('.car_info_main h2, .car_title, a[class*="title"]');
            const title = titleEl ? titleEl.textContent.trim() : '';

            // Цена
            const priceEl = item.querySelector('.price, .car_price, [class*="price"]');
            const priceText = priceEl ? priceEl.textContent.trim() : '0';
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

            // Пробег
            const mileageEl = item.querySelector('[class*="mileage"], [class*="km"]');
            const mileageText = mileageEl ? mileageEl.textContent.trim() : '0';
            const mileage = parseInt(mileageText.replace(/[^0-9]/g, '')) || 0;

            // Тип кузова
            const bodyEl = item.querySelector('[class*="body"], [class*="type"]');
            const bodyType = bodyEl ? bodyEl.textContent.trim() : 'Unknown';

            // Руль
            const steeringEl = item.querySelector('[class*="steering"], [class*="steer"]');
            const steering = steeringEl ? (steeringEl.textContent.includes('좌') ? '왼쪽' : '오른쪽') : 'Unknown';

            // Фото
            const photoEl = item.querySelector('img');
            const photoUrl = photoEl ? photoEl.src : '';

            // Ссылка на объявление
            const linkEl = item.querySelector('a[href*="/dc/"]');
            const listingUrl = linkEl ? linkEl.href : '';

            if (title && price > 0) {
              cars.push({
                make: make,
                model: model,
                year: year,
                title: title,
                price_krw: price,
                mileage: mileage,
                body_type: bodyType,
                steering: steering,
                photo_url: photoUrl,
                listing_url: listingUrl,
                source: 'encar',
                country: 'Korea'
              });
              count++;
            }
          } catch (e) {
            console.error('Ошибка при парсинге элемента:', e.message);
          }
        });

        return cars;
      }, make, model, year, maxResults);

      return listings;
    } catch (error) {
      console.error('Ошибка Encar scraper:', error.message);
      return [];
    }
  }

  /**
   * Получить детали объявления
   * @param {string} listingUrl - URL объявления
   */
  async getDetails(listingUrl) {
    try {
      await this.page.goto(listingUrl, { waitUntil: 'networkidle' });
      
      const details = await this.page.evaluate(() => {
        return {
          allPhotos: Array.from(document.querySelectorAll('img[class*="photo"]')).map(el => el.src),
          specifications: {}
        };
      });

      return details;
    } catch (error) {
      console.error('Ошибка при получении деталей:', error.message);
      return null;
    }
  }
}

module.exports = EncarScraper;
