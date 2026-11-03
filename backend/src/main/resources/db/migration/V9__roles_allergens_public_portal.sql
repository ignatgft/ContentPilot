-- V9: Roles, School Public Portal, Allergens and Student Preferences for SmartCanteen AI

-- 1. Update Schools table with slug and publication flags
ALTER TABLE schools ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_menu_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS allergens_visible BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE schools SET slug = 'school-24' WHERE id = 1 AND (slug IS NULL OR slug = '');

-- 2. Update Dishes table with nutritional facts and appetizing photo URLs
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS calories INT DEFAULT 350;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS proteins NUMERIC(6, 1) DEFAULT 12.0;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS fats NUMERIC(6, 1) DEFAULT 10.0;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS carbs NUMERIC(6, 1) DEFAULT 45.0;

-- Set high quality food photos and nutrition for Bishkek School #24 dishes
UPDATE dishes SET
    image_url = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    calories = 520, proteins = 18.5, fats = 16.0, carbs = 65.0
WHERE id = 1; -- Плов школьный с говядиной

UPDATE dishes SET
    image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
    calories = 240, proteins = 14.0, fats = 8.0, carbs = 22.0
WHERE id = 2; -- Суп куриный с лапшой

UPDATE dishes SET
    image_url = 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    calories = 410, proteins = 22.0, fats = 14.0, carbs = 42.0
WHERE id = 3; -- Каша гречневая с котлетой

UPDATE dishes SET
    image_url = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    calories = 85, proteins = 1.8, fats = 4.2, carbs = 9.5
WHERE id = 4; -- Салат витаминный

UPDATE dishes SET
    image_url = 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
    calories = 110, proteins = 0.5, fats = 0.1, carbs = 26.0
WHERE id = 5; -- Компот из сухофруктов

-- 3. Allergens Reference Table
CREATE TABLE IF NOT EXISTS allergens (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'shield-alert',
    description VARCHAR(255)
);

INSERT INTO allergens (code, name, icon, description) VALUES
('GLUTEN', 'Глютен (пшеница, рожь, овес)', 'wheat', 'Содержится в пшеничной муке, макаронах, выпечке'),
('LACTOSE', 'Лактоза (молочные продукты)', 'milk', 'Содержится в молоке, масле, сыре, твороге'),
('EGGS', 'Яйца куриные', 'egg', 'Содержится в выпечке, омлетах, котлетной массе'),
('FISH', 'Рыба и морепродукты', 'fish', 'Содержится в рыбных блюдах'),
('NUTS', 'Орехи и арахис', 'nut', 'Может содержаться в десертах и кондитерских изделиях'),
('SOY', 'Соя', 'bean', 'Содержится в соевых соусах и полуфабрикатах'),
('CELERY', 'Сельдерей', 'leaf', 'Содержится в суповых приправах и бульонах'),
('MUSTARD', 'Горчица', 'flame', 'Содержится в соусах и маринадах')
ON CONFLICT (code) DO NOTHING;

-- 4. Dish Allergens Junction Table
CREATE TABLE IF NOT EXISTS dish_allergens (
    id BIGSERIAL PRIMARY KEY,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    allergen_id BIGINT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    CONSTRAINT uq_dish_allergen UNIQUE (dish_id, allergen_id)
);

CREATE INDEX IF NOT EXISTS idx_dish_allergens_dish ON dish_allergens(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_allergen ON dish_allergens(allergen_id);

-- Link allergens for demo dishes:
-- Суп куриный с лапшой (id=2) contains GLUTEN (id=1)
INSERT INTO dish_allergens (dish_id, allergen_id)
SELECT 2, id FROM allergens WHERE code = 'GLUTEN'
ON CONFLICT DO NOTHING;

-- Каша гречневая с котлетой (id=3) contains EGGS (id=3) and GLUTEN (id=1)
INSERT INTO dish_allergens (dish_id, allergen_id)
SELECT 3, id FROM allergens WHERE code IN ('GLUTEN', 'EGGS')
ON CONFLICT DO NOTHING;

-- 5. Student Preferences (1-click anonymous meal voting without collecting personal data)
CREATE TABLE IF NOT EXISTS student_preferences (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_pref UNIQUE (school_id, service_date, session_id, dish_id)
);

CREATE INDEX IF NOT EXISTS idx_student_pref_lookup ON student_preferences(school_id, service_date, dish_id);

-- Initial seed for student preferences for today's menu to demonstrate live voting counters
INSERT INTO student_preferences (school_id, service_date, dish_id, session_id) VALUES
(1, '2026-10-27', 1, 'demo-session-001'),
(1, '2026-10-27', 1, 'demo-session-002'),
(1, '2026-10-27', 1, 'demo-session-003'),
(1, '2026-10-27', 3, 'demo-session-004'),
(1, '2026-10-27', 5, 'demo-session-005')
ON CONFLICT DO NOTHING;

-- 6. Ensure default Administrator user exists with BCrypt password 'demo1234'
-- BCrypt for 'demo1234' = '$2a$10$RnOPXGTIqPnzeJXHYftz9udvi0MPPD74jUyDBmzP/Hmk0Qrx9l6EC'
INSERT INTO users (email, password_hash, display_name, school_id, canteen_role)
VALUES (
    'admin@smartcanteen.kg',
    '$2a$10$RnOPXGTIqPnzeJXHYftz9udvi0MPPD74jUyDBmzP/Hmk0Qrx9l6EC',
    'Заведующий столовой (Школа №24)',
    1,
    'ADMIN'
)
ON CONFLICT (email) DO UPDATE SET
    school_id = 1,
    canteen_role = 'ADMIN',
    password_hash = '$2a$10$RnOPXGTIqPnzeJXHYftz9udvi0MPPD74jUyDBmzP/Hmk0Qrx9l6EC';
