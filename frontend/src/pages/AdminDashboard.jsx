import { useEffect, useState } from "react";
import api from "../lib/api";
import StatusStamp from "../components/StatusStamp";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [s, c, i] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/claims"),
      api.get("/admin/items"),
    ]);
    setStats(s.data);
    setClaims(c.data.claims);
    setItems(i.data.items);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function reviewClaim(claim_id, status) {
    await api.patch(`/claims/${claim_id}`, { status });
    loadAll();
  }

  async function removeItem(item_id) {
    if (!confirm("Remove this report permanently?")) return;
    await api.delete(`/items/${item_id}`);
    loadAll();
  }

  if (loading) return <div className="text-center py-20 text-ink/50">Loading dashboard…</div>;

  const pending = claims.filter((c) => c.status === "Pending");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-ink mb-1">Admin dashboard</h1>
      <p className="text-ink/60 mb-6">Review claims, moderate reports, and monitor recovery activity.</p>

      <div className="flex gap-2 mb-6 border-b border-line">
        {[
          ["overview", "Overview"],
          ["claims", `Claims (${pending.length} pending)`],
          ["items", `All reports (${items.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition ${
              tab === key ? "border-forest text-forest" : "border-transparent text-ink/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <StatCard label="Lost" value={stats.totalLost} accent="brass" />
            <StatCard label="Found" value={stats.totalFound} accent="forest" />
            <StatCard label="Recovered" value={stats.totalRecovered} accent="ink" />
            <StatCard label="Pending claims" value={stats.pendingClaims} accent="brass" />
            <StatCard label="Students" value={stats.totalUsers} accent="ink" />
          </div>

          <h2 className="font-display font-semibold text-lg mb-3">Reports by category</h2>
          <div className="ticket p-4 space-y-2">
            {stats.byCategory.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-28 text-sm text-ink/70">{c.category}</span>
                <div className="flex-1 bg-parchment rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-forest"
                    style={{ width: `${(c.n / Math.max(...stats.byCategory.map((x) => x.n))) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-ink/50 w-6 text-right">{c.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "claims" && (
        <div className="space-y-3">
          {claims.length === 0 && <p className="text-ink/50">No claims submitted yet.</p>}
          {claims.map((c) => (
            <div key={c.claim_id} className="ticket p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{c.item_title}</p>
                  <p className="text-sm text-ink/60">Claimed by {c.claimant_name}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  c.status === "Approved" ? "bg-forest-50 text-forest" :
                  c.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-brass-50 text-brass"
                }`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-ink/70 mt-2">{c.message}</p>
              {c.status === "Pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => reviewClaim(c.claim_id, "Approved")} className="btn-primary text-sm px-3 py-1.5">
                    Approve
                  </button>
                  <button onClick={() => reviewClaim(c.claim_id, "Rejected")} className="btn-danger">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "items" && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.item_id} className="ticket p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink truncate">{item.title}</p>
                  <StatusStamp status={item.status} />
                </div>
                <p className="text-sm text-ink/50 mt-1">
                  {item.owner_name} &middot; {item.location} &middot; {item.date}
                </p>
              </div>
              <button onClick={() => removeItem(item.item_id)} className="btn-danger shrink-0">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentCls = accent === "brass" ? "text-brass" : accent === "forest" ? "text-forest" : "text-ink";
  return (
    <div className="ticket p-4 text-center">
      <p className={`font-display font-bold text-3xl ${accentCls}`}>{value}</p>
      <p className="text-xs text-ink/50 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}
