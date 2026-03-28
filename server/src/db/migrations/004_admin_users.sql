-- Platform admin flag (separate from parent/kid role)
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
