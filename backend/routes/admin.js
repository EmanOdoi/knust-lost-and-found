const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const totalLost = (await db.get("SELECT COUNT(*)::int AS n FROM items WHERE status = 'Lost'")).n;
    const totalFound = (await db.get("SELECT COUNT(*)::int AS n FROM items WHERE status = 'Found'")).n;
    const totalRecovered = (await db.get("SELECT COUNT(*)::int AS n FROM items WHERE status = 'Recovered'")).n;
    const pendingClaims = (await db.get("SELECT COUNT(*)::int AS n FROM claims WHERE status = 'Pending'")).n;
    const totalUsers = (await db.get("SELECT COUNT(*)::int AS n FROM users WHERE role = 'student'")).n;

    const byCategory = await db.all(
      `SELECT category, COUNT(*)::int AS n FROM items GROUP BY category ORDER BY n DESC`
    );

    res.json({
      totalLost,
      totalFound,
      totalRecovered,
      pendingClaims,
      totalUsers,
      byCategory,
    });
  } catch (error) { next(error); }
});

// GET /api/admin/items — all items, including recovered, for moderation
router.get("/items", async (req, res, next) => {
  try {
    const items = await db.all(
      `SELECT i.*, u.name AS owner_name, u.email AS owner_email
       FROM items i JOIN users u ON u.user_id = i.owner_id
       ORDER BY i.created_at DESC`
    );
    res.json({ items });
  } catch (error) { next(error); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const users = await db.all(
      "SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (error) { next(error); }
});

module.exports = router;
