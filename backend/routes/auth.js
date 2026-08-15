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

router.post("/register", async (req, res, next) => {
  try {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.get("SELECT 1 FROM users WHERE email = ?", normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = await db.get(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student') RETURNING user_id, name, email, role",
    name.trim(), normalizedEmail, hash
  );
  const token = sign(user);
  res.status(201).json({ token, user });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = sign(user);
  res.json({
    token,
    user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
  });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
  const user = await db.get("SELECT user_id, name, email, role FROM users WHERE user_id = ?", req.user.user_id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
  } catch (error) { next(error); }
});

module.exports = router;
