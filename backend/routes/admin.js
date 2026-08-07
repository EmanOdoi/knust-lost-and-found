const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get("/stats", (req, res) => {
  const totalLost = db.prepare("SELECT COUNT(*) AS n FROM items WHERE status = 'Lost'").get().n;
  const totalFound = db.prepare("SELECT COUNT(*) AS n FROM items WHERE status = 'Found'").get().n;
  const totalRecovered = db.prepare("SELECT COUNT(*) AS n FROM items WHERE status = 'Recovered'").get().n;
  const pendingClaims = db.prepare("SELECT COUNT(*) AS n FROM claims WHERE status = 'Pending'").get().n;
  const totalUsers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'student'").get().n;

  const byCategory = db
    .prepare(
      `SELECT category, COUNT(*) AS n FROM items GROUP BY category ORDER BY n DESC`
    )
    .all();

  res.json({
    totalLost,
    totalFound,
    totalRecovered,
    pendingClaims,
    totalUsers,
    byCategory,
  });
});

// GET /api/admin/items — all items, including recovered, for moderation
router.get("/items", (req, res) => {
  const items = db
    .prepare(
      `SELECT i.*, u.name AS owner_name, u.email AS owner_email
       FROM items i JOIN users u ON u.user_id = i.owner_id
       ORDER BY i.created_at DESC`
    )
    .all();
  res.json({ items });
});

// GET /api/admin/users
router.get("/users", (req, res) => {
  const users = db
    .prepare("SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC")
    .all();
  res.json({ users });
});

module.exports = router;
