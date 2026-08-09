import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["Electronics", "Documents", "Accessories", "Bags", "Books", "Keys", "Clothing", "Other"];

export default function ReportItem() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [status, setStatus] = useState("Lost");
  const [form, setForm] = useState({
    title: "",
    category: "Electronics",
    description: "",
    location: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      data.append("status", status);
      if (image) data.append("image", image);

      const res = await api.post("/items", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notify(`${status} report submitted`, "success");
      navigate(`/items/${res.data.item.item_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      <h1 className="text-2xl font-bold text-ink mb-1">Report an item</h1>
      <p className="text-ink/60 mb-8">
        Fill in as much detail as you can — specific, identifying details help the right person find this report.
      </p>

      {/* Lost / Found toggle */}
      <div className="flex gap-2 mb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setStatus("Lost")}
          className={`flex-1 py-3 rounded-sm border font-display font-semibold transition ${
            status === "Lost" ? "bg-brass-50 border-brass text-brass" : "bg-white border-line text-ink/50"
          }`}
        >
          I lost something
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setStatus("Found")}
          className={`flex-1 py-3 rounded-sm border font-display font-semibold transition ${
            status === "Found" ? "bg-forest-50 border-forest text-forest" : "bg-white border-line text-ink/50"
          }`}
        >
          I found something
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="ticket p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="field-label">Item name</label>
          <input
            required
            className="field-input"
            placeholder="e.g. Black iPhone 13"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Category</label>
            <select
              className="field-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Date {status === "Lost" ? "lost" : "found"}</label>
            <input
              type="date"
              required
              className="field-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Location {status === "Lost" ? "last seen" : "found"}</label>
          <input
            required
            className="field-input"
            placeholder="e.g. KNUST Library, Unity Hall"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            required
            rows={4}
            className="field-input"
            placeholder="Color, brand, distinguishing marks, contents, anything that helps confirm ownership…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="text-sm text-ink/70"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Submitting…" : `Submit ${status.toLowerCase()} report`}
        </button>
      </form>
    </motion.div>
  );
}
