-- V8: Student Meal Booking & Pre-order System for SmartCanteen AI

CREATE TABLE IF NOT EXISTS student_meal_bookings (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_name VARCHAR(120) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL DEFAULT 'LUNCH',
    dish_id BIGINT REFERENCES dishes(id) ON DELETE SET NULL,
    dietary_notes VARCHAR(255),
    code VARCHAR(30) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL DEFAULT 75.00,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    served_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_student_bookings_date ON student_meal_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_student_bookings_school ON student_meal_bookings(school_id);
CREATE INDEX IF NOT EXISTS idx_student_bookings_code ON student_meal_bookings(code);
CREATE INDEX IF NOT EXISTS idx_student_bookings_student ON student_meal_bookings(student_name);
CREATE INDEX IF NOT EXISTS idx_student_bookings_grade ON student_meal_bookings(grade);

-- Demo seed for Bishkek School #24 for current and next day
INSERT INTO student_meal_bookings (school_id, student_name, grade, booking_date, meal_type, dish_id, dietary_notes, code, price, status, is_demo)
VALUES
(1, 'Азамат Ибраимов', '7-Б', '2026-10-27', 'LUNCH', 1, 'Без ограничений', 'SC-7841', 75.00, 'SERVED', true),
(1, 'Айгерим Садыкова', '9-А', '2026-10-27', 'LUNCH', 1, 'Халяль', 'SC-7842', 75.00, 'SERVED', true),
(1, 'Дастан Оморов', '4-В', '2026-10-27', 'LUNCH', 3, 'Без лактозы', 'SC-7843', 70.00, 'CONFIRMED', true),
(1, 'Камила Жумабекова', '11-Б', '2026-10-27', 'LUNCH', 1, 'Без ограничений', 'SC-7844', 75.00, 'CONFIRMED', true),
(1, 'Бектур Касымов', '6-А', '2026-10-28', 'LUNCH', 2, 'Обычный', 'SC-7845', 75.00, 'CONFIRMED', true),
(1, 'Мадина Токтогулова', '8-Г', '2026-10-28', 'LUNCH', 4, 'Вегетарианское', 'SC-7846', 65.00, 'CONFIRMED', true)
ON CONFLICT (code) DO NOTHING;
