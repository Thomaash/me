#!/bin/sh

# Initialize database on first startup
echo "Checking database..."

# Extract the file path from DATABASE_URL (e.g., file:/data/db.sqlite -> /data/db.sqlite)
DB_FILE=$(echo "$DATABASE_URL" | sed 's|^file:||')

if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  echo "Database not found or empty at $DB_FILE. Initializing..."
  npm run prisma:db:push --skip-generate || {
    echo "Failed to initialize database"
    exit 1
  }
  echo "Database initialized successfully"
else
  echo "Database already exists at $DB_FILE"
fi

# Start the application
echo "Starting application on port ${PORT:-4000}..."
exec node src/index.js
