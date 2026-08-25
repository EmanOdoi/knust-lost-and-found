import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
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
      <h1 className="text-2xl font-bold text-ink mb-1">Reset your password</h1>
      <p className="text-ink/60 mb-8">
        {step === 1
          ? "Enter your email and we'll send you a code to reset your password."
          : `Enter the code sent to ${email} and choose a new password.`}
      </p>

      {step === 1 ? (
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onSubmit={handleSendCode}
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
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onSubmit={handleResetPassword}
          className="ticket p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              {error}
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
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-ink/60 hover:underline w-full text-center"
          >
            Use a different email
          </button>
        </motion.form>
      )}

      <p className="text-sm text-ink/60 mt-6 text-center">
        Remembered your password?{" "}
        <Link to="/login" className="text-forest font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
