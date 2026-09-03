const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// --- image upload config ---
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed."), ok);
  },
});

function itemWithOwner(row) {
  return row;
}

// GET /api/items?query=&category=&status=&location=
router.get("/", async (req, res, next) => {
  try {
  const { query, category, status, location } = req.query;
  let sql = `
    SELECT i.*, u.name AS owner_name
    FROM items i JOIN users u ON u.user_id = i.owner_id
    WHERE 1=1
  `;
  const params = [];

  if (query) {
    sql += ` AND (i.title ILIKE ? OR i.description ILIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }
  if (category) {
    sql += ` AND i.category = ?`;
    params.push(category);
  }
  if (status) {
    sql += ` AND i.status = ?`;
    params.push(status);
  }
  if (location) {
    sql += ` AND i.location ILIKE ?`;
    params.push(`%${location}%`);
  }
  sql += ` ORDER BY i.created_at DESC`;

  const items = await db.all(sql, ...params);
  res.json({ items });
  } catch (error) { next(error); }
});

// GET /api/items/mine — items reported by the logged-in user
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
  const items = await db.all(`SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC`, req.user.user_id);
  res.json({ items });
  } catch (error) { next(error); }
});

// GET /api/items/:id
router.get("/:id", async (req, res, next) => {
  try {
  const item = await db.get(
      `SELECT i.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
       FROM items i JOIN users u ON u.user_id = i.owner_id
       WHERE i.item_id = ?`
    , req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found." });
  res.json({ item });
  } catch (error) { next(error); }
});

// POST /api/items — report a lost or found item
router.post("/", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
  const { title, category, description, location, date, status } = req.body;
  if (!title || !category || !description || !location || !date || !status) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!["Lost", "Found"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Lost' or 'Found'." });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const item = await db.get(
      `INSERT INTO items (title, category, description, location, date, status, image, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    title.trim(), category, description.trim(), location.trim(), date, status, imagePath, req.user.user_id
  );
  res.status(201).json({ item });
  } catch (error) { next(error); }
});

// PATCH /api/items/:id — owner can edit their own report (before recovery)
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
  const item = await db.get("SELECT * FROM items WHERE item_id = ?", req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found." });
  if (item.owner_id !== req.user.user_id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only edit your own reports." });
  }
  if (item.status === "Recovered") {
    return res.status(400).json({ error: "This item has already been recovered and can no longer be edited." });
  }

  const fields = ["title", "category", "description", "location", "date"];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: "No fields to update." });
  params.push(req.params.id);
  await db.run(`UPDATE items SET ${updates.join(", ")} WHERE item_id = ?`, ...params);

  const updated = await db.get("SELECT * FROM items WHERE item_id = ?", req.params.id);
  res.json({ item: updated });
  } catch (error) { next(error); }
});

// DELETE /api/items/:id — owner or admin can remove a report
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
  const item = await db.get("SELECT * FROM items WHERE item_id = ?", req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found." });
  if (item.owner_id !== req.user.user_id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only remove your own reports." });
  }
  await db.run("DELETE FROM items WHERE item_id = ?", req.params.id);
  res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
