-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);

-- Create registrations table (many-to-many)
CREATE TABLE IF NOT EXISTS registrations (
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events (datetime);
CREATE INDEX IF NOT EXISTS idx_events_location ON events (location);
CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_reg_user ON registrations (user_id);
