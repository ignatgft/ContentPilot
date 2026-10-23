-- ContentPilot Schema V2: AI Creative Studio

CREATE TABLE IF NOT EXISTS creative_tasks (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    prompt TEXT NOT NULL,
    aspect_ratio VARCHAR(20) DEFAULT '1:1' NOT NULL,
    style VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    progress INT DEFAULT 0 NOT NULL,
    result_url TEXT,
    error_message TEXT,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    task_id BIGINT REFERENCES creative_tasks(id) ON DELETE SET NULL,
    media_type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    prompt TEXT,
    style VARCHAR(100),
    aspect_ratio VARCHAR(20) DEFAULT '1:1' NOT NULL,
    overlay_data JSONB,
    width INT,
    height INT,
    duration_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_tasks_brand_id ON creative_tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_creative_tasks_status ON creative_tasks(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_brand_id ON media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);
