const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dbDir, 'deployments.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create deployments table
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id TEXT NOT NULL,
    contract_name TEXT NOT NULL,
    address TEXT NOT NULL,
    network_name TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    deployer_address TEXT NOT NULL,
    transaction_hash TEXT,
    constructor_params TEXT,
    deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

db.exec(createTableSQL);

// Create indexes for performance
db.exec('CREATE INDEX IF NOT EXISTS idx_contract_id ON deployments(contract_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_deployed_at ON deployments(deployed_at DESC)');
db.exec('CREATE INDEX IF NOT EXISTS idx_chain_id ON deployments(chain_id)');

console.log('✅ Database initialized successfully at:', dbPath);

module.exports = db;
