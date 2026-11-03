-- VARCHAR vs CHAR mismatch: Hibernate maps String tokens as varchar, migration V4
-- created CHAR(64) columns (bpchar in Postgres), which fails schema validation.
ALTER TABLE user_sessions ALTER COLUMN refresh_token_hash TYPE varchar(64);
ALTER TABLE password_reset_tokens ALTER COLUMN token_hash TYPE varchar(64);
