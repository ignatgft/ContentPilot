-- Bot verification for Telegram channels: store the verified bot identity,
-- when it was last verified, and the last verification error (if any).
ALTER TABLE channels ADD COLUMN IF NOT EXISTS bot_username VARCHAR(255);
ALTER TABLE channels ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS verification_error TEXT;
