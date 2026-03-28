-- Kid-created tasks have no parent creator; allow NULL on created_by_parent_id.
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE tasks_new (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  kid_user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'approved', 'archived')),
  created_by_parent_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  approved_at TEXT
);
INSERT INTO tasks_new SELECT * FROM tasks;
DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;
CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_kid ON tasks(kid_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
COMMIT;
PRAGMA foreign_keys=ON;
