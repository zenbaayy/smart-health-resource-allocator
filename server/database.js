'use strict';
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'users.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const stmts = {
  createUser: db.prepare('INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  createSession: db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'),
  getSession: db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  cleanExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\')')
};

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signup(email, password) {
  if (!email || !password) return { error: 'Email and password required' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email format' };

  const existing = stmts.getUserByEmail.get(email);
  if (existing) return { error: 'Email already registered' };

  const salt = generateSalt();
  const password_hash = hashPassword(password, salt);
  try {
    const result = stmts.createUser.run(email, password_hash, salt);
    return { success: true, userId: result.lastInsertRowid };
  } catch (err) {
    return { error: 'Failed to create user' };
  }
}

function login(email, password) {
  if (!email || !password) return { error: 'Email and password required' };

  const user = stmts.getUserByEmail.get(email);
  if (!user) return { error: 'Invalid email or password' };

  const hash = hashPassword(password, user.salt);
  if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
    return { error: 'Invalid email or password' };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  stmts.createSession.run(token, user.id, expiresAt);

  return { success: true, token, expiresAt };
}

function verifySession(token) {
  if (!token) return null;
  const session = stmts.getSession.get(token);
  return session || null;
}

function logout(token) {
  if (token) stmts.deleteSession.run(token);
  return { success: true };
}

const DEMO_ACCOUNTS = [
  { email: 'admin@alkhidmat.org', password: 'Admin1234', role: 'NGO Admin' },
  { email: 'officer@alkhidmat.org', password: 'Officer1234', role: 'Program Officer' },
  { email: 'field@alkhidmat.org', password: 'Field12345', role: 'Field Officer' }
];

function seedDemoAccounts() {
  for (const acct of DEMO_ACCOUNTS) {
    if (!stmts.getUserByEmail.get(acct.email)) {
      const salt = generateSalt();
      const password_hash = hashPassword(acct.password, salt);
      stmts.createUser.run(acct.email, password_hash, salt);
    }
  }
}
seedDemoAccounts();

setInterval(() => stmts.cleanExpiredSessions.run(), 60 * 60 * 1000);

module.exports = { signup, login, verifySession, logout };
