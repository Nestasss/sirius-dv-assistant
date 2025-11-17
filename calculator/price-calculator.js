/**
 * SiriusDV - Price Calculator
 * Расчёт стоимости: инвойс + комиссии + пошлины + доставка
 */

class PriceCalculator {
  constructor(exchangeRates = {}) {
    this.rates = {
      'JPY_to_USD': 0.0065,
      'KRW_to_USD': 0.00073,
      'USD_to_RUB': 110,
      ...exchangeRates
    };

    this.japanFees = {
      prrSbkts: 45500,
      rastamozivanie: 45000,
      frakht: 250000
    };

    this.utilFees = {
      'new_1-2l': 667400, 'used_1-2l': 1174000,
      'new_2-3l': 837000, 'used_2-3l': 1240800,
      'new_3-4l': 1004200, 'used_3-4l': 1407600
    };

    this.customsDuties = { 'Japan': 15, 'Korea': 15, 'China': 48 };
  }

  convertCurrency(amount, fromCurrency, toCurrency = 'RUB') {
    if (fromCurrency === toCurrency) return amount;
    
    let amountInUsd = amount;
    if (fromCurrency === 'JPY') amountInUsd = amount * this.rates['JPY_to_USD'];
    else if (fromCurrency === 'KRW') amountInUsd = amount * this.rates['KRW_to_USD'];
    
    if (toCurrency === 'RUB') return Math.round(amountInUsd * this.rates['USD_to_RUB']);
    return amountInUsd;
  }

  calculateTotal(carData) {
    const { auctionPrice, currency = 'JPY', country = 'Japan', year, 
            engineVolume, condition = 'used', destinationRegion, shippingPrice = 0 } = carData;

    // Конвертируем в йены
    let auctionPriceJpy = auctionPrice;
    if (currency === 'KRW') {
      auctionPriceJpy = Math.round(auctionPrice * (this.rates['KRW_to_USD'] / this.rates['JPY_to_USD']));
    }

    // Инвойс
    const brokerCommission = Math.round(auctionPriceJpy * 0.06);
    const totalJapanFees = this.japanFees.prrSbkts + this.japanFees.rastamozivanie + this.japanFees.frakht;
    const invoiceJpy = auctionPriceJpy + brokerCommission + totalJapanFees;
    const invoiceRub = this.convertCurrency(invoiceJpy, 'JPY', 'RUB');
    const auctionPriceRub = this.convertCurrency(auctionPriceJpy, 'JPY', 'RUB');

    // Утильсбор
    let utilCategory = condition === 'new' ? 'new' : 'used';
    if (engineVolume <= 2) utilCategory += '_1-2l';
    else if (engineVolume <= 3) utilCategory += '_2-3l';
    else utilCategory += '_3-4l';
    const utilFee = this.utilFees[utilCategory] || 667400;

    // Пошлина
    const dutyPercent = this.customsDuties[country] || 15;
    const customsDuty = Math.round(auctionPriceRub * (dutyPercent / 100));

    // НДС
    const taxBase = invoiceRub + utilFee + customsDuty;
    const nds = Math.round(taxBase * 0.18);

    // ИТОГО
    const totalPrice = invoiceRub + utilFee + customsDuty + nds + shippingPrice;

    return {
      auctionPrice: { original: auctionPrice, jpy: auctionPriceJpy, rub: auctionPriceRub },
      invoice: { jpy: invoiceJpy, rub: invoiceRub },
      fees: { utilFee, customsDuty, customsDutyPercent: dutyPercent, nds },
      delivery: { region: destinationRegion || 'не указана', price: shippingPrice },
      total: totalPrice,
      breakdown: { invoice: invoiceRub, utilFee, customsDuty, nds, delivery: shippingPrice }
    };
  }

  updateExchangeRates(rates) {
    this.rates = { ...this.rates, ...rates };
  }
}

module.exports = PriceCalculator;
