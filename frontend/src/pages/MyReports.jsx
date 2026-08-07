import { useEffect, useState } from "react";
import api from "../lib/api";
import ItemCard from "../components/ItemCard";
import { Link } from "react-router-dom";

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("reports");

  useEffect(() => {
    Promise.all([api.get("/items/mine"), api.get("/claims/mine")]).then(([i, c]) => {
      setItems(i.data.items);
      setClaims(c.data.claims);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-ink mb-1">My reports</h1>
      <p className="text-ink/60 mb-6">Track the items you've reported and the claims you've submitted.</p>

      <div className="flex gap-2 mb-6 border-b border-line">
        <button
          onClick={() => setTab("reports")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition ${
            tab === "reports" ? "border-forest text-forest" : "border-transparent text-ink/50"
          }`}
        >
          My reports ({items.length})
        </button>
        <button
          onClick={() => setTab("claims")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition ${
            tab === "claims" ? "border-forest text-forest" : "border-transparent text-ink/50"
          }`}
        >
          My claims ({claims.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink/50">Loading…</div>
      ) : tab === "reports" ? (
        items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {items.map((item) => <ItemCard key={item.item_id} item={item} />)}
          </div>
        )
      ) : claims.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-line rounded-sm text-ink/50">
          You haven't submitted any claims yet.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <Link to={`/items/${c.item_id}`} key={c.claim_id} className="ticket p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{c.title}</p>
                <p className="text-sm text-ink/50 mt-0.5">Submitted {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                c.status === "Approved" ? "bg-forest-50 text-forest" :
                c.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-brass-50 text-brass"
              }`}>
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border border-dashed border-line rounded-sm">
      <p className="text-ink/60">You haven't reported any items yet.</p>
      <Link to="/report" className="text-forest font-medium hover:underline text-sm mt-2 inline-block">
        Report a lost or found item →
      </Link>
    </div>
  );
}
