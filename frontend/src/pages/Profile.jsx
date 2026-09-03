import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      notify("Profile updated", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="text-center py-20 text-ink/50">Log in to view your profile.</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-ink mb-1">Your profile</h1>
      <p className="text-ink/60 mb-8">
        Add a phone number so people you're in contact with can call or text you directly.
      </p>

      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={handleSubmit}
        className="ticket p-6 space-y-4"
      >
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="field-label">Full name</label>
          <input
            required
            className="field-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input opacity-60" value={user.email} disabled />
          <p className="text-xs text-ink/40 mt-1">Email can't be changed here.</p>
        </div>
        <div>
          <label className="field-label">Phone (optional)</label>
          <input
            type="tel"
            className="field-input"
            placeholder="e.g. 024 123 4567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </motion.form>
    </div>
  );
}
