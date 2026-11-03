-- SmartCanteen AI Demonstration Data Seed (V7)
-- All demo records are marked with is_demo = true and clearly labeled as DEMO

DO $$
DECLARE
    v_school_id BIGINT;
    v_user_id BIGINT;
    
    -- Ingredient IDs
    v_ing_beef BIGINT;
    v_ing_rice BIGINT;
    v_ing_potato BIGINT;
    v_ing_carrot BIGINT;
    v_ing_onion BIGINT;
    v_ing_oil BIGINT;
    v_ing_milk BIGINT;
    v_ing_bread BIGINT;
    v_ing_sugar BIGINT;
    v_ing_butter BIGINT;
    v_ing_curd BIGINT;
    v_ing_pasta BIGINT;
    
    -- Dish IDs
    v_dish_plov BIGINT;
    v_dish_soup BIGINT;
    v_dish_puree BIGINT;
    v_dish_casserole BIGINT;
    v_dish_tea BIGINT;
    
    -- Recipe IDs
    v_rec_plov BIGINT;
    v_rec_soup BIGINT;
    v_rec_puree BIGINT;
    v_rec_casserole BIGINT;
    v_rec_tea BIGINT;
    
    -- Menu & Forecast IDs
    v_menu_today BIGINT;
    v_forecast_today BIGINT;
    v_proc_today BIGINT;
BEGIN
    -- Check if demo school already exists
    SELECT id INTO v_school_id FROM schools WHERE name LIKE '%(DEMO)%' LIMIT 1;
    
    IF v_school_id IS NULL THEN
        INSERT INTO schools (name, address, currency, timezone, total_students, settings)
        VALUES (
            'Школа-гимназия №24 им. А. Токомбаева (DEMO)',
            'г. Бишкек, ул. Тыныстанова, 110',
            'KGS',
            'Asia/Bishkek',
            650,
            '{"shifts": 2, "canteen_manager": "Асанова А. К.", "safety_stock_percent": 10}'::jsonb
        ) RETURNING id INTO v_school_id;
    END IF;

    -- Attach existing users to this school if unassigned
    UPDATE users SET school_id = v_school_id, canteen_role = 'ADMIN' WHERE school_id IS NULL;

    -- 1. Seed Ingredients
    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Говядина охлажденная (мякоть)', 'Мясо', 'kg', 15.000, true)
    RETURNING id INTO v_ing_beef;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Рис шлифованный круглозерный', 'Крупы', 'kg', 25.000, true)
    RETURNING id INTO v_ing_rice;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Картофель свежий отборный', 'Овощи', 'kg', 50.000, true)
    RETURNING id INTO v_ing_potato;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Морковь столовая свежая', 'Овощи', 'kg', 20.000, true)
    RETURNING id INTO v_ing_carrot;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Лук репчатый', 'Овощи', 'kg', 15.000, true)
    RETURNING id INTO v_ing_onion;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Масло растительное подсолнечное', 'Бакалея', 'l', 10.000, true)
    RETURNING id INTO v_ing_oil;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Молоко пастеризованное 3.2%', 'Молочные', 'l', 20.000, true)
    RETURNING id INTO v_ing_milk;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Хлеб пшеничный формовой', 'Хлебобулочные', 'pcs', 10.000, true)
    RETURNING id INTO v_ing_bread;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Сахар-песок', 'Бакалея', 'kg', 15.000, true)
    RETURNING id INTO v_ing_sugar;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Масло сливочное несоленое 82.5%', 'Молочные', 'kg', 8.000, true)
    RETURNING id INTO v_ing_butter;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Творог свежий 9%', 'Молочные', 'kg', 10.000, true)
    RETURNING id INTO v_ing_curd;

    INSERT INTO ingredients (school_id, name, category, base_unit, min_balance, is_demo)
    VALUES (v_school_id, 'Макароны твердых сортов', 'Бакалея', 'kg', 20.000, true)
    RETURNING id INTO v_ing_pasta;

    -- 2. Seed Inventory Batches (Stock with FEFO tracking)
    -- Beef (Batch 1: expires in 2 days - alert! Batch 2: fresh)
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_beef, 'П-ГОВ-102', 20.000, 8.500, 'kg', 540.00, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '2 days', 'ОсОО "Мясокомбинат Бишкек"', true);
    
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_beef, 'П-ГОВ-103', 30.000, 30.000, 'kg', 545.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '8 days', 'ОсОО "Мясокомбинат Бишкек"', true);

    -- Rice
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_rice, 'П-РИС-88', 50.000, 32.000, 'kg', 115.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '120 days', 'Бакалея Трейд', true);

    -- Potato
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_potato, 'П-КАРТ-41', 100.000, 45.000, 'kg', 38.00, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '25 days', 'КФХ "Урожай"', true);

    -- Carrot
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_carrot, 'П-МОРК-12', 40.000, 18.000, 'kg', 42.00, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '18 days', 'КФХ "Урожай"', true);

    -- Onion
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_onion, 'П-ЛУК-09', 30.000, 14.500, 'kg', 32.00, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '20 days', 'КФХ "Урожай"', true);

    -- Oil
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_oil, 'П-МАС-55', 25.000, 16.000, 'l', 135.00, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP + INTERVAL '180 days', 'ОсОО "Золотая Семечка"', true);

    -- Milk (Expiring in 1 day - alert!)
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_milk, 'П-МОЛ-73', 30.000, 12.000, 'l', 68.00, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '1 day', 'Бишкек Сут', true);

    -- Bread
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_bread, 'П-ХЛЕБ-01', 40.000, 22.000, 'pcs', 26.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 days', 'Хлебозавод №1', true);

    -- Sugar
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_sugar, 'П-САХ-33', 50.000, 38.000, 'kg', 75.00, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '300 days', 'Каинды-Кант', true);

    -- Butter
    INSERT INTO inventory_batches (ingredient_id, batch_number, received_qty, remaining_qty, unit, unit_cost, received_at, expires_at, supplier, is_demo)
    VALUES (v_ing_butter, 'П-СЛИВ-14', 15.000, 6.200, 'kg', 480.00, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 'Бишкек Сут', true);

    -- 3. Seed Dishes
    INSERT INTO dishes (school_id, name, category, description, is_demo)
    VALUES (v_school_id, 'Плов школьный с говядиной', 'Вторые блюда', 'Традиционный плов с отварной говядиной, рисом, желтой морковью и луком (СанПиН)', true)
    RETURNING id INTO v_dish_plov;

    INSERT INTO dishes (school_id, name, category, description, is_demo)
    VALUES (v_school_id, 'Суп домашний с вермишелью', 'Первые блюда', 'Легкий суп на мясном бульоне с вермишелью и зеленью', true)
    RETURNING id INTO v_dish_soup;

    INSERT INTO dishes (school_id, name, category, description, is_demo)
    VALUES (v_school_id, 'Пюре картофельное с котлетой', 'Вторые блюда', 'Нежное картофельное пюре на молоке с паровой мясной котлетой', true)
    RETURNING id INTO v_dish_puree;

    INSERT INTO dishes (school_id, name, category, description, is_demo)
    VALUES (v_school_id, 'Запеканка творожная со сгущенкой', 'Завтраки', 'Запеканка из свежего творога с добавлением манной крупы', true)
    RETURNING id INTO v_dish_casserole;

    INSERT INTO dishes (school_id, name, category, description, is_demo)
    VALUES (v_school_id, 'Чай с сахаром и лимоном', 'Напитки', 'Горячий витаминизированный чай', true)
    RETURNING id INTO v_dish_tea;

    -- 4. Seed Recipes & Ingredients (Technological Norms per portion)
    -- Recipe for Plov
    INSERT INTO recipes (dish_id, version, yield_portions, instructions, active)
    VALUES (v_dish_plov, 1, 1, 'Обжарка мяса и моркови с луком, закладка риса, тушение 25 минут.', true)
    RETURNING id INTO v_rec_plov;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
    (v_rec_plov, v_ing_beef, 0.075, 'kg'),
    (v_rec_plov, v_ing_rice, 0.080, 'kg'),
    (v_rec_plov, v_ing_carrot, 0.050, 'kg'),
    (v_rec_plov, v_ing_onion, 0.025, 'kg'),
    (v_rec_plov, v_ing_oil, 0.015, 'l');

    -- Recipe for Puree & Cutlet
    INSERT INTO recipes (dish_id, version, yield_portions, instructions, active)
    VALUES (v_dish_puree, 1, 1, 'Варка картофеля, добавление теплого молока и сливочного масла. Формовка котлеты на пару.', true)
    RETURNING id INTO v_rec_puree;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
    (v_rec_puree, v_ing_potato, 0.180, 'kg'),
    (v_rec_puree, v_ing_milk, 0.040, 'l'),
    (v_rec_puree, v_ing_butter, 0.010, 'kg'),
    (v_rec_puree, v_ing_beef, 0.070, 'kg'),
    (v_rec_puree, v_ing_onion, 0.015, 'kg');

    -- Recipe for Tea
    INSERT INTO recipes (dish_id, version, yield_portions, instructions, active)
    VALUES (v_dish_tea, 1, 1, 'Заваривание черного чая крутым кипятком, добавление сахара по норме.', true)
    RETURNING id INTO v_rec_tea;

    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
    (v_rec_tea, v_ing_sugar, 0.015, 'kg');

    -- 5. Seed Attendance Plan for Today
    INSERT INTO attendance_plans (school_id, service_date, meal_period, expected_students, participation_rate, source, is_demo)
    VALUES (v_school_id, CURRENT_DATE, 'LUNCH', 480, 85.00, 'DEMO_DATA', true)
    ON CONFLICT (school_id, service_date, meal_period) DO NOTHING;

    -- 6. Seed Today's Menu Plan
    INSERT INTO menu_plans (school_id, service_date, meal_period, status)
    VALUES (v_school_id, CURRENT_DATE, 'LUNCH', 'APPROVED')
    ON CONFLICT (school_id, service_date, meal_period) DO UPDATE SET status = 'APPROVED'
    RETURNING id INTO v_menu_today;

    IF v_menu_today IS NOT NULL THEN
        INSERT INTO menu_plan_items (menu_plan_id, dish_id, planned_portions, forecast_portions)
        VALUES 
        (v_menu_today, v_dish_plov, 280, 275),
        (v_menu_today, v_dish_puree, 130, 133),
        (v_menu_today, v_dish_tea, 410, 408);
    END IF;

    -- 7. Seed Forecast Run for Today
    INSERT INTO forecast_runs (school_id, service_date, meal_period, model_version, explanation, is_demo)
    VALUES (
        v_school_id,
        CURRENT_DATE,
        'LUNCH',
        'SmartCanteen-Hybrid-v1',
        'Прогноз сформирован на основе ожидаемой явки (480 уч.), коэффициента охвата питания 85.0% и структуры предпочтений вторника по истории выдачи за 4 недели.',
        true
    ) RETURNING id INTO v_forecast_today;

    INSERT INTO forecast_lines (forecast_run_id, dish_id, predicted_portions, lower_bound, upper_bound, confidence_score, explanation)
    VALUES
    (v_forecast_today, v_dish_plov, 275, 260, 290, 94.20, 'Плов традиционно выбирают 67% учащихся в дни мясных блюд. Погода прохладная, ожидается высокий спрос.'),
    (v_forecast_today, v_dish_puree, 133, 120, 145, 91.50, 'Альтернативное горячее блюдо для младших классов.'),
    (v_forecast_today, v_dish_tea, 408, 395, 420, 98.00, 'Обязательный горячий напиток в составе комплексного обеда.');

    -- 8. Seed Procurement Plan
    INSERT INTO procurement_plans (school_id, service_date, forecast_run_id, status, total_estimated_cost, is_demo)
    VALUES (v_school_id, CURRENT_DATE, v_forecast_today, 'CALCULATED', 18450.00, true)
    RETURNING id INTO v_proc_today;

    INSERT INTO procurement_lines (procurement_plan_id, ingredient_id, required_qty, stock_qty, safety_stock, purchase_qty, unit, estimated_unit_cost, estimated_total_cost)
    VALUES
    (v_proc_today, v_ing_beef, 29.935, 38.500, 2.990, 0.000, 'kg', 540.00, 0.00),
    (v_proc_today, v_ing_rice, 22.000, 32.000, 2.200, 0.000, 'kg', 115.00, 0.00),
    (v_proc_today, v_ing_potato, 23.940, 45.000, 2.400, 0.000, 'kg', 38.00, 0.00),
    (v_proc_today, v_ing_milk, 5.320, 12.000, 1.000, 0.000, 'l', 68.00, 0.00),
    (v_proc_today, v_ing_carrot, 13.750, 18.000, 1.375, 0.000, 'kg', 42.00, 0.00);

    -- 9. Seed Yesterday's Production & Waste Records (For analytics & audit)
    INSERT INTO production_records (school_id, service_date, dish_id, prepared_portions, served_portions, usable_leftovers, waste_portions, variance_note)
    VALUES
    (v_school_id, CURRENT_DATE - INTERVAL '1 day', v_dish_plov, 280, 268, 8, 4, '4 порции списаны в конце смены (бракераж/остывание)'),
    (v_school_id, CURRENT_DATE - INTERVAL '1 day', v_dish_puree, 130, 126, 0, 4, '4 порции - остаток на раздаче'),
    (v_school_id, CURRENT_DATE - INTERVAL '1 day', v_dish_tea, 400, 395, 0, 5, 'Остаток в титане к окончанию перемены');

    INSERT INTO waste_records (school_id, service_date, ingredient_id, dish_id, quantity, unit, reason, unit_cost_snapshot, total_loss, is_demo)
    VALUES
    (v_school_id, CURRENT_DATE - INTERVAL '1 day', NULL, v_dish_plov, 0.800, 'kg', 'PLATE_WASTE', 115.00, 92.00, true),
    (v_school_id, CURRENT_DATE - INTERVAL '1 day', v_ing_bread, NULL, 2.000, 'pcs', 'EXPIRED', 26.00, 52.00, true);

END $$;
