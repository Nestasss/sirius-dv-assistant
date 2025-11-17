-- SiriusDV Assistant - PostgreSQL Schema
-- Создана для n8n + Scraping + Calculator

-- ==========================================
-- 1. Таблица объявлений автомобилей
-- ==========================================
CREATE TABLE IF NOT EXISTS car_listings (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  body_type VARCHAR(50) NOT NULL,
  price_local DECIMAL(15,2) NOT NULL,
  price_usd DECIMAL(15,2),
  mileage INT,
  steering VARCHAR(20),
  main_photo_url TEXT,
  listing_url TEXT UNIQUE NOT NULL,
  country VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Комиссии Японии
-- ==========================================
CREATE TABLE IF NOT EXISTS japan_fees (
  id SERIAL PRIMARY KEY,
  fee_type VARCHAR(100) NOT NULL,
  fee_amount_jpy DECIMAL(15,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Утильсборы
-- ==========================================
CREATE TABLE IF NOT EXISTS utilization_fees (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),
  engine_volume_from DECIMAL(5,2),
  engine_volume_to DECIMAL(5,2),
  power_hp_from INT,
  power_hp_to INT,
  condition VARCHAR(50),
  fee_rub DECIMAL(15,2) NOT NULL,
  country VARCHAR(50),
  apply_to VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. Пошлины
-- ==========================================
CREATE TABLE IF NOT EXISTS customs_duties (
  id SERIAL PRIMARY KEY,
  country VARCHAR(50) NOT NULL,
  vehicle_age VARCHAR(50) NOT NULL,
  duty_percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country, vehicle_age)
);

-- ==========================================
-- 5. Доставка по регионам
-- ==========================================
CREATE TABLE IF NOT EXISTS shipping_prices (
  id SERIAL PRIMARY KEY,
  region VARCHAR(100) NOT NULL,
  distance_km INT,
  car_type VARCHAR(50) NOT NULL,
  price_rub DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region, car_type)
);

-- ==========================================
-- 6. Курсы валют
-- ==========================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
  rate DECIMAL(15,8) NOT NULL,
  source VARCHAR(50) DEFAULT 'openexchangerates',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_currency, to_currency)
);

-- ==========================================
-- 7. Заявки пользователей
-- ==========================================
CREATE TABLE IF NOT EXISTS user_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(100),
  search_query TEXT NOT NULL,
  selected_car_id INT REFERENCES car_listings(id) ON DELETE SET NULL,
  auction_price_original DECIMAL(15,2),
  auction_price_usd DECIMAL(15,2),
  commission_fee DECIMAL(15,2),
  utility_fee DECIMAL(15,2),
  customs_duty DECIMAL(15,2),
  nds DECIMAL(15,2),
  subtotal_before_shipping DECIMAL(15,2),
  destination_region VARCHAR(100),
  shipping_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  contact_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  manager_id VARCHAR(100),
  manager_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. FAQ
-- ==========================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. История чата
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. Логирование
-- ==========================================
CREATE TABLE IF NOT EXISTS operation_logs (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(100),
  user_id VARCHAR(100),
  details JSON,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Начальные данные - FAQ
-- ==========================================
INSERT INTO knowledge_base (category, question, answer, priority) VALUES
('company', 'Как работает SiriusDV?', 'СИРИУС ДАЛЬНИЙ ВОСТОК — компания с более чем 15-летним опытом по полному комплексу услуг по привозу автомобилей.', 1),
('shipping', 'Сколько времени занимает доставка?', 'Доставка авто во Владивосток занимает до 3 недель.', 1),
('fees', 'Какие основные расходы?', 'Основные расходы: комиссия брокера (5-7%), утильсбор, таможенная пошлина (15%), НДС (18%).', 1),
('contacts', 'Как связаться с менеджером?', 'Telegram: @sirius_findcar_bot, Телефон: 8 800 101 50 86', 1);
