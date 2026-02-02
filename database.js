const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'jee_tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    name TEXT,
    created_at TEXT,
    current_streak INTEGER DEFAULT 0,
    total_study_minutes INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    last_active_date TEXT
  )`);

  // Tasks Table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    subject TEXT,
    estimated_minutes INTEGER,
    actual_minutes INTEGER DEFAULT 0,
    status TEXT,
    started_at INTEGER,
    last_paused_at INTEGER,
    elapsed_seconds INTEGER DEFAULT 0,
    task_date TEXT,
    created_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Summaries Table
  db.run(`CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    date TEXT,
    maths_problems INTEGER,
    physics_problems INTEGER,
    chemistry_problems INTEGER,
    topics_covered TEXT,
    notes TEXT,
    self_rating INTEGER,
    total_study_hours REAL,
    tasks_completed INTEGER,
    success_rate INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

module.exports = db;