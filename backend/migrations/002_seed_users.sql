INSERT INTO users (email, password_hash, name)
VALUES ('test@example.com', '<bcrypt-hash>', 'Dev User')
ON CONFLICT (email) DO NOTHING;
