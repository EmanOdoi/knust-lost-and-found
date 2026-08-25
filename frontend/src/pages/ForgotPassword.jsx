import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email);
      navigate("/verify-reset-code", { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-ink mb-1">Reset your password</h1>
      <p className="text-ink/60 mb-8">
        Enter your email and we'll send you a code to reset your password.
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
          <label className="field-label">Email</label>
          <input
            type="email"
            required
            className="field-input"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Sending…" : "Send reset code"}
        </button>
      </motion.form>

      <p className="text-sm text-ink/60 mt-6 text-center">
        Remembered your password?{" "}
        <Link to="/login" className="text-forest font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
