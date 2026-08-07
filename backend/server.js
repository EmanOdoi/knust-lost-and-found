require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./db"); // initializes schema + seeds admin

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const claimRoutes = require("./routes/claims");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

// centralized error handler (e.g. multer file-type errors)
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || "Something went wrong." });
  next();
});

app.use((req, res) => res.status(404).json({ error: "Not found." }));

app.listen(PORT, () => {
  console.log(`Lost & Found API running on http://localhost:${PORT}`);
});
