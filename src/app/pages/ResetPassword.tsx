// src/app/pages/ResetPassword.tsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import loginIllustration from "../../assets/login-illustration.png";
import loginDoodle from "../../assets/login-page-background-doogle.png";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: "#f8fafc" }}>
      {/* Mobile top banner */}
      <div className="flex lg:hidden items-center gap-3 px-6 py-4" style={{ backgroundColor: "#f0fdfa", borderBottom: "1px solid #ccfbf1" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0d9488" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>CleanDesk</span>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0" style={{ width: "520px", backgroundColor: "#f0fdfa" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0d9488" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>CleanDesk</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <img src={loginIllustration} alt="" style={{ width: "100%", maxWidth: "440px", height: "auto", marginBottom: "32px" }} draggable={false} />
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
            Everything your institute needs,<br />
            <span style={{ color: "#0d9488" }}>in one place.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-full" style={{ width: i === 1 ? "24px" : "8px", height: "8px", backgroundColor: i === 1 ? "#0d9488" : "#99f6e4" }} />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative" style={{ backgroundImage: `url(${loginDoodle})`, backgroundSize: "600px", backgroundRepeat: "repeat", backgroundPosition: "center" }}>
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.92)" }} />
        <div className="relative z-10 w-full" style={{ maxWidth: "400px" }}>

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#f0fdfa" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>Password reset!</h1>
              <p className="mt-2 mb-8" style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65 }}>
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: "#0d9488", fontSize: "14.5px", fontWeight: 600 }}
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em", lineHeight: 1.2 }}>Set new password</h1>
                <p className="mt-1.5" style={{ fontSize: "14px", color: "#94a3b8" }}>Must be at least 8 characters.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 transition-all focus:outline-none pr-11"
                      style={{ fontSize: "14px", border: "1.5px solid #e5e7eb", backgroundColor: "white" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPassword ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 transition-all focus:outline-none"
                    style={{ fontSize: "14px", border: "1.5px solid #e5e7eb", backgroundColor: "white" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{ fontSize: "13px", color: "#dc2626", lineHeight: 1.45 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#0d9488", fontSize: "14.5px", fontWeight: 600, marginTop: "4px", minHeight: "48px" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                      </svg>
                      Resetting…
                    </>
                  ) : "Reset Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom strip */}
      <div className="flex lg:hidden items-center justify-center gap-2 py-4" style={{ backgroundColor: "#f0fdfa", borderTop: "1px solid #ccfbf1" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-full" style={{ width: i === 1 ? "24px" : "8px", height: "8px", backgroundColor: i === 1 ? "#0d9488" : "#99f6e4" }} />
        ))}
      </div>
    </div>
  );
}