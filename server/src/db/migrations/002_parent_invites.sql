-- parent_invites: one parent invites another by email; invitee accepts to join family as parent
CREATE TABLE IF NOT EXISTS parent_invites (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_parent_invites_token ON parent_invites(token);
CREATE INDEX IF NOT EXISTS idx_parent_invites_family ON parent_invites(family_id);
