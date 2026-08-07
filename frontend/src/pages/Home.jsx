import { useEffect, useState } from "react";
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
      <section className="bg-forest text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h1 className="font-display font-bold text-3xl sm:text-5xl leading-tight max-w-2xl">
            Lost something on campus?
            <br />
            <span className="text-brass-50">Someone may have already found it.</span>
          </h1>
          <p className="text-white/70 mt-4 max-w-xl">
            Search reported items across KNUST, or file a report in under a minute — every listing
            here is a real claim ticket, tracked from report to recovery.
          </p>

          <form onSubmit={fetchItems} className="mt-8 bg-white rounded-sm shadow-lg p-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <input
              className="flex-1 px-4 py-3 text-ink rounded-sm focus:outline-none"
              placeholder="Search by item name or description…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary sm:w-auto">Search</button>
          </form>
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
          <button type="submit" className="btn-secondary">Apply filters</button>
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
          <div className="text-center py-20 text-ink/50">Loading reports…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-line rounded-sm">
            <p className="text-ink/60">No items match your search yet.</p>
            <p className="text-sm text-ink/40 mt-1">Try a different keyword, or check back later.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <ItemCard key={item.item_id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
