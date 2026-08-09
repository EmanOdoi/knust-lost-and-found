import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../lib/api";
import ItemCard from "../components/ItemCard";

const CATEGORIES = ["Electronics", "Documents", "Accessories", "Bags", "Books", "Keys", "Clothing", "Other"];

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  async function fetchItems(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = {};
      if (query) params.query = query;
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await api.get("/items", { params });
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* hero */}
      <section className="relative bg-forest text-white overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display font-bold text-3xl sm:text-5xl leading-tight max-w-2xl"
          >
            Lost something on campus?
            <br />
            <span className="text-brass-50">Someone may have already found it.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/70 mt-4 max-w-xl"
          >
            Search reported items across KNUST, or file a report in under a minute — every
            listing here is a real claim ticket, tracked from report to recovery.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={fetchItems}
            className="mt-8 bg-white rounded-sm shadow-lg p-2 flex flex-col sm:flex-row gap-2 max-w-2xl"
          >
            <input
              className="flex-1 px-4 py-3 text-ink rounded-sm focus:outline-none"
              placeholder="Search by item name or description…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <motion.button whileTap={{ scale: 0.96 }} type="submit" className="btn-primary sm:w-auto">
              Search
            </motion.button>
          </motion.form>
        </div>
      </section>

      {/* filters + results */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={fetchItems} className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="field-label">Category</label>
            <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Lost &amp; Found</option>
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
              <option value="Recovered">Recovered</option>
            </select>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} type="submit" className="btn-secondary">
            Apply filters
          </motion.button>
          {(query || category || status) && (
            <button
              type="button"
              className="text-sm text-ink/50 hover:text-ink underline"
              onClick={() => { setQuery(""); setCategory(""); setStatus(""); setTimeout(fetchItems, 0); }}
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-line rounded-sm"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl mb-2"
            >
              🔍
            </motion.div>
            <p className="text-ink/60">No items match your search yet.</p>
            <p className="text-sm text-ink/40 mt-1">Try a different keyword, or check back later.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="ticket flex h-28 overflow-hidden">
          <div className="w-24 sm:w-28 shrink-0 bg-parchment border-r border-dashed border-line" />
          <div className="flex-1 p-4 space-y-3">
            <div className="h-4 bg-line/60 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-line/40 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-line/30 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Purely decorative — drifting tag/ring shapes using only the existing
// forest/brass/white palette at low opacity, echoing lost-item tags.
function FloatingShapes() {
  const shapes = [
    { size: 90, top: "10%", left: "78%", duration: 9, color: "rgba(201,138,44,0.18)" },
    { size: 50, top: "60%", left: "88%", duration: 7, color: "rgba(255,255,255,0.12)" },
    { size: 130, top: "55%", left: "70%", duration: 11, color: "rgba(255,255,255,0.06)" },
    { size: 36, top: "20%", left: "92%", duration: 6, color: "rgba(201,138,44,0.25)" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, top: s.top, left: s.left, background: s.color }}
          animate={{ y: [0, -18, 0], x: [0, 8, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
