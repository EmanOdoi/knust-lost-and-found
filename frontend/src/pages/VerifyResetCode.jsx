import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function VerifyResetCode() {
  const { verifyResetCode, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  if (!email) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-ink/60">
          Please request a reset code first.{" "}
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
    setBusy(true);
    try {
      await verifyResetCode(email, code);
      navigate("/reset-new-password", { state: { email, code } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMessage("");
    setResending(true);
    try {
      await forgotPassword(email);
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-ink mb-1">Enter your code</h1>
      <p className="text-ink/60 mb-8">
        We sent a 6-digit code to {email}. Enter it below to continue.
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
        {resendMessage && (
          <div className="text-sm text-forest bg-forest/10 border border-forest/20 rounded-sm px-3 py-2">
            {resendMessage}
          </div>
        )}
        <div>
          <label className="field-label">Reset code</label>
          <input
            required
            className="field-input"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Verifying…" : "Verify code"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-ink/60 hover:underline w-full text-center"
        >
          {resending ? "Resending…" : "Didn't get a code? Resend it"}
        </button>
      </motion.form>

      <p className="text-sm text-ink/60 mt-6 text-center">
        Wrong email?{" "}
        <Link to="/forgot-password" className="text-forest font-medium hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}
