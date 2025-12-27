const fs = require('fs').promises;
const path = require('path');
const dbPath = path.join(__dirname, '..', 'src', 'db.json'); // relative to this file

async function readDB() {
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readDB, writeDB };
