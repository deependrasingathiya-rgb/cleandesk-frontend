// src/app/pages/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router";

import { saveToken, parseToken, ROLE_ROUTES } from "../auth";
import loginIllustration from "../../assets/login-illustration.png";
import loginDoodle from "../../assets/login-page-background-doogle.png";

// ─── Login Page ───────────────────────────────────────────────────────────────

export function Login() {
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!loginIdentifier.trim() || !password.trim()) {
      setError("Please enter both your login ID and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login_identifier: loginIdentifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      const token: string = data.token;
      saveToken(token);

      const payload = parseToken(token);
      if (!payload) {
        setError("Received an invalid session token. Please try again.");
        setLoading(false);
        return;
      }

      const route = ROLE_ROUTES[payload.role_id];
      if (!route) {
        setError("Your account role is not recognized. Contact your administrator.");
        setLoading(false);
        return;
      }

      navigate(route);
    } catch {
      setError("Unable to reach the server. Please check your connection.");
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* ── Top Banner — Mobile/Tablet only ── */}
      <div
        className="flex lg:hidden items-center gap-3 px-6 py-4"
        style={{ backgroundColor: "#f0fdfa", borderBottom: "1px solid #ccfbf1" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#0d9488" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>
          CleanDesk
        </span>
      </div>

      {/* ── Left Panel — Illustration (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0"
        style={{ width: "520px", backgroundColor: "#f0fdfa" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#0d9488" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L2 6v6l7 4 7-4V6L9 2z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0d9488",
              letterSpacing: "-0.02em",
            }}
          >
            CleanDesk
          </span>
        </div>

        {/* Illustration + tagline */}
        <div className="flex flex-col items-center text-center">
          <img
            src={loginIllustration}
            alt="Teachers and admins managing their institute"
            style={{ width: "100%", maxWidth: "440px", height: "auto", marginBottom: "32px" }}
            draggable={false}
          />
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            Everything your institute needs,
            <br />
            <span style={{ color: "#0d9488" }}>in one place.</span>
          </p>
          <p
            className="mt-3"
            style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.65, maxWidth: "320px" }}
          >
            Attendance, tests, results, announcements — managed cleanly for
            admins, teachers, and students.
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? "24px" : "8px",
                height: "8px",
                backgroundColor: i === 1 ? "#0d9488" : "#99f6e4",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 relative"
        style={{
          backgroundImage: `url(${loginDoodle})`,
          backgroundSize: "600px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.92)" }} />
        <div className="relative z-10 w-full" style={{ maxWidth: "400px" }}>
        <div className="w-full" style={{ maxWidth: "400px" }}>

          {/* Heading */}
          <div className="mb-8">
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </h1>
            <p className="mt-1.5" style={{ fontSize: "14px", color: "#94a3b8" }}>
              Sign in to your CleanDesk account
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Login Identifier */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}
              >
                Login ID
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => { setLoginIdentifier(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. adm-abc12345"
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 transition-all focus:outline-none"
                style={{
                  fontSize: "14px",
                  border: "1.5px solid #e5e7eb",
                  backgroundColor: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 transition-all focus:outline-none pr-11"
                  style={{
                    fontSize: "14px",
                    border: "1.5px solid #e5e7eb",
                    backgroundColor: "white",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // Eye-off
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Eye
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: "13px", color: "#dc2626", lineHeight: 1.45 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#0d9488",
              fontSize: "14.5px",
              fontWeight: 600,
              marginTop: "4px",
              minHeight: "48px",
            }}
          >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Footer note */}
          <p
            className="text-center mt-8"
            style={{ fontSize: "12.5px", color: "#9ca3af", lineHeight: 1.6 }}
          >
            Your login ID was assigned by your institute administrator.
            <br />
            Contact them if you've lost access.
          </p>
        </div>
        </div>
      </div>

      {/* ── Bottom strip — Mobile only (mirrors left panel's dots) ── */}
      <div
        className="flex lg:hidden items-center justify-center gap-2 py-4"
        style={{ backgroundColor: "#f0fdfa", borderTop: "1px solid #ccfbf1" }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === 1 ? "24px" : "8px",
              height: "8px",
              backgroundColor: i === 1 ? "#0d9488" : "#99f6e4",
            }}
          />
        ))}
      </div>
    </div>
  );
}
