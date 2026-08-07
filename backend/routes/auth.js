const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const existing = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')")
    .run(name.trim(), email.toLowerCase().trim(), hash);

  const user = db.prepare("SELECT user_id, name, email, role FROM users WHERE user_id = ?").get(info.lastInsertRowid);
  const token = sign(user);
  res.status(201).json({ token, user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = sign(user);
  res.json({
    token,
    user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT user_id, name, email, role FROM users WHERE user_id = ?").get(req.user.user_id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

module.exports = router;
