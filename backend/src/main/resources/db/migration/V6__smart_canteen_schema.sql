-- SmartCanteen AI Core Schema Migration (V6)
-- Transforms platform into Smart School Canteen Management System

-- 1. Schools
CREATE TABLE IF NOT EXISTS schools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    currency VARCHAR(10) NOT NULL DEFAULT 'KGS',
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Bishkek',
    total_students INT NOT NULL DEFAULT 500,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Link user to school & define canteen role (ADMIN, MANAGER, STOREKEEPER, COOK, VIEWER)
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id BIGINT REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS canteen_role VARCHAR(50) DEFAULT 'MANAGER';

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- 2. Ingredients / Products Catalogue
CREATE TABLE IF NOT EXISTS ingredients (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_unit VARCHAR(20) NOT NULL,
    min_balance NUMERIC(14, 3) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingredients_school_id ON ingredients(school_id);

-- 3. Inventory Batches (Parties with expiration and unit costs for FEFO)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    received_qty NUMERIC(14, 3) NOT NULL,
    remaining_qty NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    supplier VARCHAR(255),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_batch_remaining_non_negative CHECK (remaining_qty >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_fefo ON inventory_batches(ingredient_id, remaining_qty, expires_at);

-- 4. Inventory Movements (Immutable audit log of all stock changes)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL, -- RECEIPT, CONSUMPTION, WRITE_OFF, ADJUSTMENT
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    reference_type VARCHAR(100), -- PRODUCTION, EXPIRED, SPOILED, MANUAL, INVENTORY_CHECK
    reference_id VARCHAR(100),
    note TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id, created_at);

-- 5. Dishes
CREATE TABLE IF NOT EXISTS dishes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dishes_school_id ON dishes(school_id);

-- 6. Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id BIGSERIAL PRIMARY KEY,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    yield_portions INT NOT NULL DEFAULT 1,
    instructions TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_dish_id ON recipes(dish_id);

-- 7. Recipe Ingredients (Norms per recipe)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- 8. Attendance Plans
CREATE TABLE IF NOT EXISTS attendance_plans (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    meal_period VARCHAR(50) NOT NULL DEFAULT 'LUNCH',
    expected_students INT NOT NULL,
    participation_rate NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
    source VARCHAR(50) DEFAULT 'MANUAL',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_school_attendance UNIQUE (school_id, service_date, meal_period)
);

CREATE INDEX IF NOT EXISTS idx_attendance_plans_date ON attendance_plans(school_id, service_date);

-- 9. Menu Plans
CREATE TABLE IF NOT EXISTS menu_plans (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    meal_period VARCHAR(50) NOT NULL DEFAULT 'LUNCH',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, COOKING, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_school_menu_plan UNIQUE (school_id, service_date, meal_period)
);

CREATE INDEX IF NOT EXISTS idx_menu_plans_date ON menu_plans(school_id, service_date);

-- 10. Menu Plan Items
CREATE TABLE IF NOT EXISTS menu_plan_items (
    id BIGSERIAL PRIMARY KEY,
    menu_plan_id BIGINT NOT NULL REFERENCES menu_plans(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    planned_portions INT NOT NULL,
    forecast_portions INT,
    CONSTRAINT chk_planned_portions_positive CHECK (planned_portions >= 0)
);

CREATE INDEX IF NOT EXISTS idx_menu_plan_items_plan ON menu_plan_items(menu_plan_id);

-- 11. Forecast Runs
CREATE TABLE IF NOT EXISTS forecast_runs (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    meal_period VARCHAR(50) NOT NULL DEFAULT 'LUNCH',
    model_version VARCHAR(50) NOT NULL DEFAULT 'SmartCanteen-Heuristic-v1',
    input_snapshot JSONB,
    explanation TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_school_date ON forecast_runs(school_id, service_date);

-- 12. Forecast Lines
CREATE TABLE IF NOT EXISTS forecast_lines (
    id BIGSERIAL PRIMARY KEY,
    forecast_run_id BIGINT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    predicted_portions INT NOT NULL,
    lower_bound INT NOT NULL,
    upper_bound INT NOT NULL,
    confidence_score NUMERIC(5, 2),
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_forecast_lines_run ON forecast_lines(forecast_run_id);

-- 13. Procurement Plans
CREATE TABLE IF NOT EXISTS procurement_plans (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    forecast_run_id BIGINT REFERENCES forecast_runs(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CALCULATED', -- CALCULATED, ORDERED, RECEIVED
    total_estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_procurement_plans_school_date ON procurement_plans(school_id, service_date);

-- 14. Procurement Lines
CREATE TABLE IF NOT EXISTS procurement_lines (
    id BIGSERIAL PRIMARY KEY,
    procurement_plan_id BIGINT NOT NULL REFERENCES procurement_plans(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    required_qty NUMERIC(14, 3) NOT NULL,
    stock_qty NUMERIC(14, 3) NOT NULL,
    safety_stock NUMERIC(14, 3) NOT NULL DEFAULT 0,
    purchase_qty NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    estimated_unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estimated_total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    CONSTRAINT chk_proc_purchase_non_neg CHECK (purchase_qty >= 0)
);

CREATE INDEX IF NOT EXISTS idx_procurement_lines_plan ON procurement_lines(procurement_plan_id);

-- 15. Production Records (Actual cooking & distribution fact)
CREATE TABLE IF NOT EXISTS production_records (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    prepared_portions INT NOT NULL,
    served_portions INT NOT NULL,
    usable_leftovers INT NOT NULL DEFAULT 0,
    waste_portions INT NOT NULL DEFAULT 0,
    variance_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_prod_prepared_non_neg CHECK (prepared_portions >= 0),
    CONSTRAINT chk_prod_served_non_neg CHECK (served_portions >= 0),
    CONSTRAINT chk_prod_leftovers_non_neg CHECK (usable_leftovers >= 0),
    CONSTRAINT chk_prod_waste_non_neg CHECK (waste_portions >= 0)
);

CREATE INDEX IF NOT EXISTS idx_production_records_school_date ON production_records(school_id, service_date);

-- 16. Waste Records (WasteGuard audit)
CREATE TABLE IF NOT EXISTS waste_records (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE SET NULL,
    dish_id BIGINT REFERENCES dishes(id) ON DELETE SET NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reason VARCHAR(100) NOT NULL, -- EXPIRED, SPOILED, PREPARATION_WASTE, PLATE_WASTE, OVERCOOKED, STORAGE_FAILURE
    unit_cost_snapshot NUMERIC(14, 2) NOT NULL,
    total_loss NUMERIC(14, 2) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_waste_qty_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_waste_records_school_date ON waste_records(school_id, service_date);
