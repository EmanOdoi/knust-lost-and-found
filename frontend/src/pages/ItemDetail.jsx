import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { resolveImage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusStamp from "../components/StatusStamp";

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const isOwner = user && item && user.user_id === item.owner_id;

  async function load() {
    setLoading(true);
    const res = await api.get(`/items/${id}`);
    setItem(res.data.item);
    if (user && (user.user_id === res.data.item.owner_id || user.role === "admin")) {
      const c = await api.get(`/claims/item/${id}`);
      setClaims(c.data.claims);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function submitClaim(e) {
    e.preventDefault();
    setClaimError("");
    setClaimSuccess("");
    setBusy(true);
    try {
      await api.post("/claims", { item_id: item.item_id, message });
      setClaimSuccess("Your claim was submitted. An admin will review it shortly.");
      setMessage("");
    } catch (err) {
      setClaimError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this report? This cannot be undone.")) return;
    await api.delete(`/items/${item.item_id}`);
    navigate("/");
  }

  if (loading) return <div className="text-center py-20 text-ink/50">Loading…</div>;
  if (!item) return <div className="text-center py-20 text-ink/50">Item not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="text-sm text-forest hover:underline">&larr; Back to all reports</Link>

      <div className="ticket mt-4 flex flex-col sm:flex-row">
        {item.image && (
          <img src={resolveImage(item.image)} alt={item.title} className="sm:w-64 w-full h-56 sm:h-auto object-cover" />
        )}
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">{item.title}</h1>
            <StatusStamp status={item.status} />
          </div>
          <p className="text-ink/60 mt-1">{item.category} &middot; {item.location} &middot; {item.date}</p>
          <p className="text-ink/80 mt-4 leading-relaxed">{item.description}</p>
          <p className="text-sm text-ink/40 mt-4 font-mono">
            Reported by {item.owner_name}{isOwner ? " (you)" : ""} &middot; Ticket #{String(item.item_id).padStart(4, "0")}
          </p>

          {isOwner && item.status !== "Recovered" && (
            <button onClick={handleDelete} className="btn-danger mt-4">Remove report</button>
          )}
        </div>
      </div>

      {/* Claim form — shown to logged-in non-owners while item is unresolved */}
      {item.status !== "Recovered" && !isOwner && (
        <div className="ticket mt-6 p-6">
          <h2 className="font-display font-semibold text-lg mb-1">
            {item.status === "Found" ? "Is this yours?" : "Have you found this?"}
          </h2>
          <p className="text-sm text-ink/60 mb-4">
            Submit identifying details only you (or the finder) would know. An admin reviews every claim before it's approved.
          </p>

          {!user ? (
            <p className="text-sm">
              <Link to="/login" state={{ from: `/items/${id}` }} className="text-forest font-medium hover:underline">
                Log in
              </Link>{" "}
              to submit a claim.
            </p>
          ) : (
            <form onSubmit={submitClaim} className="space-y-3">
              {claimError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{claimError}</div>
              )}
              {claimSuccess && (
                <div className="text-sm text-forest bg-forest-50 border border-forest/30 rounded-sm px-3 py-2">{claimSuccess}</div>
              )}
              <textarea
                required
                rows={3}
                className="field-input"
                placeholder="Describe identifying details (e.g. lock screen photo, engraving, contents of the bag)…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? "Submitting…" : "Submit claim"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Claims list — visible to the report owner and admins */}
      {claims.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-semibold text-lg mb-3">Claims on this report</h2>
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c.claim_id} className="ticket p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{c.claimant_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    c.status === "Approved" ? "bg-forest-50 text-forest" :
                    c.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-brass-50 text-brass"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-ink/70 mt-2">{c.message}</p>
                {c.claimant_email && <p className="text-xs text-ink/40 mt-1">{c.claimant_email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
