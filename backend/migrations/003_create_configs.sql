-- Create configs table: composite PK (user_id, name), raw JSON stored as TEXT (SQLite compatible)
CREATE TABLE IF NOT EXISTS configs (
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS configs_user_id_idx ON configs (user_id);
