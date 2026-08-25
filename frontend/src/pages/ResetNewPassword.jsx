import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function ResetNewPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const code = location.state?.code || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!email || !code) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-ink/60">
          Please verify your reset code first.{" "}
          <Link to="/forgot-password" className="text-forest font-medium hover:underline">
            Go back
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await resetPassword(email, code, password);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-ink mb-1">Set a new password</h1>
      <p className="text-ink/60 mb-8">Choose a new password for your account.</p>

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
          <label className="field-label">New password</label>
          <input
            type="password"
            required
            minLength={6}
            className="field-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Confirm new password</label>
          <input
            type="password"
            required
            minLength={6}
            className="field-input"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Updating…" : "Reset password"}
        </button>
      </motion.form>
    </div>
  );
}
