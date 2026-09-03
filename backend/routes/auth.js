const express = require("express");
const crypto = require("crypto");
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
  const { name, email, password, phone } = req.body;
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
    "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'student') RETURNING user_id, name, email, phone, role",
    name.trim(), normalizedEmail, hash, phone ? phone.trim() : null
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
    user: { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
  } catch (error) { next(error); }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.get("SELECT user_id, name FROM users WHERE email = ?", normalizedEmail);

  // Respond the same way whether or not the account exists, so we don't reveal which emails are registered.
  if (user) {
    const code = String(crypto.randomInt(100000, 999999));
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.run(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?",
      hashedCode, expires.toISOString(), user.user_id
    );

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "KNUST Lost & Found <onboarding@resend.dev>",
            to: normalizedEmail,
            subject: "Your password reset code",
            html: `<p>Hi ${user.name},</p><p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>`,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send reset code email:", emailError);
      }
    } else {
      // No Resend key configured yet — log the code so the flow is still testable end-to-end.
      console.log(`[DEV] Password reset code for ${normalizedEmail}: ${code}`);
    }
  }

  res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (error) { next(error); }
});

router.post("/verify-reset-code", async (req, res, next) => {
  try {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedCode = crypto.createHash("sha256").update(code.trim()).digest("hex");

  const user = await db.get(
    "SELECT reset_token, reset_token_expires FROM users WHERE email = ?",
    normalizedEmail
  );

  if (
    !user ||
    !user.reset_token ||
    user.reset_token !== hashedCode ||
    !user.reset_token_expires ||
    new Date(user.reset_token_expires) < new Date()
  ) {
    return res.status(400).json({ error: "That code is invalid or has expired." });
  }

  res.json({ valid: true });
  } catch (error) { next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res.status(400).json({ error: "Email, code, and new password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedCode = crypto.createHash("sha256").update(code.trim()).digest("hex");

  const user = await db.get(
    "SELECT user_id, reset_token, reset_token_expires FROM users WHERE email = ?",
    normalizedEmail
  );

  if (
    !user ||
    !user.reset_token ||
    user.reset_token !== hashedCode ||
    !user.reset_token_expires ||
    new Date(user.reset_token_expires) < new Date()
  ) {
    return res.status(400).json({ error: "That code is invalid or has expired." });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.run(
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?",
    hash, user.user_id
  );

  res.json({ message: "Your password has been updated. You can now log in." });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
  const user = await db.get("SELECT user_id, name, email, phone, role FROM users WHERE user_id = ?", req.user.user_id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
  } catch (error) { next(error); }
});

module.exports = router;
