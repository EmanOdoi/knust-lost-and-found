import { useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import ItemCard from "../components/ItemCard";

const CATEGORIES = ["Electronics", "Documents", "Accessories", "Bags", "Books", "Keys", "Clothing", "Other"];

export default function Browse() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-ink">Browse items</h1>
      <p className="text-ink/60 mt-2">Search lost, found, and recovered reports across campus.</p>

      <form onSubmit={search} className="ticket mt-7 p-5 grid gap-4 sm:grid-cols-2">
        <input
          className="field-input sm:col-span-2"
          placeholder="Search by item name or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}
        </select>
        <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>
          <option value="Recovered">Recovered</option>
        </select>
        <button type="submit" className="btn-primary sm:col-span-2 justify-self-start" disabled={loading}>
          {loading ? "Searching..." : "Search items"}
        </button>
      </form>

      {searched && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink mb-4">Search results</h2>
          {items.length ? (
            <motion.div layout className="grid gap-4">
              {items.map((item) => <ItemCard key={item.item_id} item={item} />)}
            </motion.div>
          ) : !loading && <p className="text-ink/60 py-12 text-center border border-dashed border-line rounded-sm">No items match that search.</p>}
        </section>
      )}
    </div>
  );
}
