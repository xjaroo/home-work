-- parent_chat_messages: one thread per family for parents to message each other
CREATE TABLE IF NOT EXISTS parent_chat_messages (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  sender_user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_parent_chat_family ON parent_chat_messages(family_id);
