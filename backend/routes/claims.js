const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendMail, claimSubmittedEmail, claimApprovedEmail, claimRejectedEmail, itemRecoveredEmail } = require("../lib/mail");

const router = express.Router();

// POST /api/claims — submit a claim on an item
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { item_id, message } = req.body;
    if (!item_id || !message) {
      return res.status(400).json({ error: "Please describe why you believe this item is yours." });
    }

    const item = await db.get("SELECT * FROM items WHERE item_id = ?", item_id);
    if (!item) return res.status(404).json({ error: "Item not found." });
    if (item.owner_id === req.user.user_id) {
      return res.status(400).json({ error: "You cannot claim an item you reported yourself." });
    }
    if (item.status === "Recovered") {
      return res.status(400).json({ error: "This item has already been recovered." });
    }

    const existing = await db.get(
      "SELECT 1 FROM claims WHERE item_id = ? AND user_id = ? AND status = 'Pending'",
      item_id, req.user.user_id
    );
    if (existing) {
      return res.status(409).json({ error: "You already have a pending claim on this item." });
    }

    const claim = await db.get(
      "INSERT INTO claims (item_id, user_id, message) VALUES (?, ?, ?) RETURNING *",
      item_id, req.user.user_id, message.trim()
    );

    // Notify the item's reporter — never let a mail failure affect the response
    const owner = await db.get("SELECT name, email FROM users WHERE user_id = ?", item.owner_id);
    if (owner) {
      sendMail({
        to: owner.email,
        subject: `New claim on "${item.title}"`,
        html: claimSubmittedEmail({
          ownerName: owner.name,
          itemTitle: item.title,
          claimantName: req.user.name,
          message: message.trim(),
        }),
      });
    }

    res.status(201).json({ claim });
  } catch (error) { next(error); }
});

// GET /api/claims/mine — claims submitted by the logged-in user
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const claims = await db.all(
      `SELECT c.*, i.title, i.status AS item_status
       FROM claims c JOIN items i ON i.item_id = c.item_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC`,
      req.user.user_id
    );
    res.json({ claims });
  } catch (error) { next(error); }
});

// GET /api/claims/item/:itemId — claims on a given item (item owner or admin only)
router.get("/item/:itemId", requireAuth, async (req, res, next) => {
  try {
    const item = await db.get("SELECT * FROM items WHERE item_id = ?", req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found." });
    if (item.owner_id !== req.user.user_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the reporter or an admin can view claims on this item." });
    }

    const claims = await db.all(
      `SELECT c.*, u.name AS claimant_name, u.email AS claimant_email
       FROM claims c JOIN users u ON u.user_id = c.user_id
       WHERE c.item_id = ? ORDER BY c.created_at DESC`,
      req.params.itemId
    );
    res.json({ claims });
  } catch (error) { next(error); }
});

// GET /api/claims — all claims (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const claims = await db.all(
      `SELECT c.*,
              i.title AS item_title, i.status AS item_status, i.category AS item_category,
              i.description AS item_description, i.location AS item_location,
              i.date AS item_date, i.image AS item_image,
              u.name AS claimant_name, u.email AS claimant_email,
              o.name AS owner_name, o.email AS owner_email
       FROM claims c
       JOIN items i ON i.item_id = c.item_id
       JOIN users u ON u.user_id = c.user_id
       JOIN users o ON o.user_id = i.owner_id
       ORDER BY c.created_at DESC`
    );
    res.json({ claims });
  } catch (error) { next(error); }
});

// PATCH /api/claims/:id — approve or reject (admin only)
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'." });
    }

    const claim = await db.get("SELECT * FROM claims WHERE claim_id = ?", req.params.id);
    if (!claim) return res.status(404).json({ error: "Claim not found." });
    if (claim.status !== "Pending") {
      return res.status(400).json({ error: "This claim has already been reviewed." });
    }

    const updated = await db.transaction(async (tx) => {
      await tx.run("UPDATE claims SET status = ? WHERE claim_id = ?", status, req.params.id);

      if (status === "Approved") {
        await tx.run("UPDATE items SET status = 'Recovered' WHERE item_id = ?", claim.item_id);
        // auto-reject any other pending claims on the same item
        await tx.run(
          "UPDATE claims SET status = 'Rejected' WHERE item_id = ? AND claim_id != ? AND status = 'Pending'",
          claim.item_id, req.params.id
        );
      }

      return tx.get("SELECT * FROM claims WHERE claim_id = ?", req.params.id);
    });

    // Notify the claimant of the outcome — never let a mail failure affect the response
    const claimant = await db.get("SELECT name, email FROM users WHERE user_id = ?", claim.user_id);
    const item = await db.get("SELECT title, owner_id FROM items WHERE item_id = ?", claim.item_id);

    if (status === "Approved" && claimant && item) {
      // The reporter (item owner) and the claimant now need to arrange a handover,
      // so each gets the other person's name and email once the admin approves.
      const owner = await db.get("SELECT name, email FROM users WHERE user_id = ?", item.owner_id);
      if (owner) {
        sendMail({
          to: claimant.email,
          subject: `Your claim on "${item.title}" was approved`,
          html: claimApprovedEmail({
            claimantName: claimant.name,
            itemTitle: item.title,
            contactName: owner.name,
            contactEmail: owner.email,
          }),
        });
        sendMail({
          to: owner.email,
          subject: `"${item.title}" has been claimed`,
          html: itemRecoveredEmail({
            ownerName: owner.name,
            itemTitle: item.title,
            contactName: claimant.name,
            contactEmail: claimant.email,
          }),
        });
      }
    } else if (status === "Rejected" && claimant && item) {
      sendMail({
        to: claimant.email,
        subject: `Update on your claim for "${item.title}"`,
        html: claimRejectedEmail({ claimantName: claimant.name, itemTitle: item.title }),
      });
    }

    res.json({ claim: updated });
  } catch (error) { next(error); }
});

module.exports = router;
