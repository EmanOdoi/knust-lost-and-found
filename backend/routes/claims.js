const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/claims — submit a claim on an item
router.post("/", requireAuth, (req, res) => {
  const { item_id, message } = req.body;
  if (!item_id || !message) {
    return res.status(400).json({ error: "Please describe why you believe this item is yours." });
  }

  const item = db.prepare("SELECT * FROM items WHERE item_id = ?").get(item_id);
  if (!item) return res.status(404).json({ error: "Item not found." });
  if (item.owner_id === req.user.user_id) {
    return res.status(400).json({ error: "You cannot claim an item you reported yourself." });
  }
  if (item.status === "Recovered") {
    return res.status(400).json({ error: "This item has already been recovered." });
  }

  const existing = db
    .prepare("SELECT 1 FROM claims WHERE item_id = ? AND user_id = ? AND status = 'Pending'")
    .get(item_id, req.user.user_id);
  if (existing) {
    return res.status(409).json({ error: "You already have a pending claim on this item." });
  }

  const info = db
    .prepare("INSERT INTO claims (item_id, user_id, message) VALUES (?, ?, ?)")
    .run(item_id, req.user.user_id, message.trim());

  const claim = db.prepare("SELECT * FROM claims WHERE claim_id = ?").get(info.lastInsertRowid);
  res.status(201).json({ claim });
});

// GET /api/claims/mine — claims submitted by the logged-in user
router.get("/mine", requireAuth, (req, res) => {
  const claims = db
    .prepare(
      `SELECT c.*, i.title, i.status AS item_status
       FROM claims c JOIN items i ON i.item_id = c.item_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC`
    )
    .all(req.user.user_id);
  res.json({ claims });
});

// GET /api/claims/item/:itemId — claims on a given item (item owner or admin only)
router.get("/item/:itemId", requireAuth, (req, res) => {
  const item = db.prepare("SELECT * FROM items WHERE item_id = ?").get(req.params.itemId);
  if (!item) return res.status(404).json({ error: "Item not found." });
  if (item.owner_id !== req.user.user_id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only the reporter or an admin can view claims on this item." });
  }

  const claims = db
    .prepare(
      `SELECT c.*, u.name AS claimant_name, u.email AS claimant_email
       FROM claims c JOIN users u ON u.user_id = c.user_id
       WHERE c.item_id = ? ORDER BY c.created_at DESC`
    )
    .all(req.params.itemId);
  res.json({ claims });
});

// GET /api/claims — all claims (admin only)
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const claims = db
    .prepare(
      `SELECT c.*, i.title AS item_title, i.status AS item_status, u.name AS claimant_name
       FROM claims c
       JOIN items i ON i.item_id = c.item_id
       JOIN users u ON u.user_id = c.user_id
       ORDER BY c.created_at DESC`
    )
    .all();
  res.json({ claims });
});

// PATCH /api/claims/:id — approve or reject (admin only)
router.patch("/:id", requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'." });
  }

  const claim = db.prepare("SELECT * FROM claims WHERE claim_id = ?").get(req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found." });
  if (claim.status !== "Pending") {
    return res.status(400).json({ error: "This claim has already been reviewed." });
  }

  const txn = db.transaction(() => {
    db.prepare("UPDATE claims SET status = ? WHERE claim_id = ?").run(status, req.params.id);

    if (status === "Approved") {
      db.prepare("UPDATE items SET status = 'Recovered' WHERE item_id = ?").run(claim.item_id);
      // auto-reject any other pending claims on the same item
      db.prepare(
        "UPDATE claims SET status = 'Rejected' WHERE item_id = ? AND claim_id != ? AND status = 'Pending'"
      ).run(claim.item_id, req.params.id);
    }
  });
  txn();

  const updated = db.prepare("SELECT * FROM claims WHERE claim_id = ?").get(req.params.id);
  res.json({ claim: updated });
});

module.exports = router;
