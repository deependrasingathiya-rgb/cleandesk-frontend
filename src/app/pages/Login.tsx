// src/app/pages/Login.tsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { saveToken, parseToken, ROLE_ROUTES, ROLE_LABELS } from "../auth";
import { apiFetch } from "../api";
import loginIllustration from "../../assets/login-illustration.png";
import loginDoodle from "../../assets/login-page-background-doogle.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  user_id: string;
  role_id: number;
  institute_id: string;
  full_name: string | null;
};

type Step = "phone" | "otp" | "profile";

// ─── Shared visual primitives ─────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
      style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="flex-shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ fontSize: "13px", color: "#dc2626", lineHeight: 1.45 }}>{message}</p>
    </div>
  );
}

function TealButton({
  onClick,
  loading,
  loadingLabel,
  label,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  loadingLabel: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{ backgroundColor: "#0d9488", fontSize: "14.5px", fontWeight: 600, minHeight: "48px" }}
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

function TextInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  type = "text",
  autoFocus = false,
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string;
  type?: string;
  autoFocus?: boolean;
  prefix?: string;
}) {
  return (
    <div className="flex items-center rounded-xl overflow-hidden"
      style={{ border: "1.5px solid #e5e7eb", backgroundColor: "white" }}>
      {prefix && (
        <span style={{
          padding: "0 12px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          borderRight: "1.5px solid #e5e7eb",
          lineHeight: "48px",
          whiteSpace: "nowrap",
          backgroundColor: "#f9fafb",
        }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none"
        style={{ fontSize: "14px", backgroundColor: "transparent", minHeight: "48px" }}
        onFocus={(e) => {
          const wrapper = e.currentTarget.closest(".flex") as HTMLElement | null;
          if (wrapper) wrapper.style.borderColor = "#0d9488";
        }}
        onBlur={(e) => {
          const wrapper = e.currentTarget.closest(".flex") as HTMLElement | null;
          if (wrapper) wrapper.style.borderColor = "#e5e7eb";
        }}
      />
    </div>
  );
}

// ─── Left Panel (shared across all steps) ────────────────────────────────────

function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0"
      style={{ width: "520px", backgroundColor: "#f0fdfa" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#0d9488" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>
          CleanDesk
        </span>
      </div>
      <div className="flex flex-col items-center text-center">
        <img src={loginIllustration} alt="CleanDesk"
          style={{ width: "100%", maxWidth: "440px", height: "auto", marginBottom: "32px" }}
          draggable={false} />
        <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          Everything your institute needs,<br />
          <span style={{ color: "#0d9488" }}>in one place.</span>
        </p>
        <p className="mt-3" style={{ fontSize: "13.5px", color: "#64748b",
          lineHeight: 1.65, maxWidth: "320px" }}>
          Attendance, tests, results, announcements — managed cleanly for
          admins, teachers, and students.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-full" style={{
              width: i === 1 ? "24px" : "8px", height: "8px",
              backgroundColor: i === 1 ? "#0d9488" : "#99f6e4",
            }} />
          ))}
        </div>
        <a href="/privacy" style={{ fontSize: "12px", color: "#0d9488" }}>
          Privacy Policy
        </a>
      </div>
    </div>
  );
}

function TopMobileBar() {
  return (
    <div className="flex lg:hidden items-center gap-3 px-6 py-4"
      style={{ backgroundColor: "#f0fdfa", borderBottom: "1px solid #ccfbf1" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#0d9488" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 2v14M2 6l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.02em" }}>
        CleanDesk
      </span>
    </div>
  );
}

function BottomMobileDots() {
  return (
    <div className="flex lg:hidden items-center justify-center gap-2 py-4"
      style={{ backgroundColor: "#f0fdfa", borderTop: "1px solid #ccfbf1" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-full" style={{
          width: i === 1 ? "24px" : "8px", height: "8px",
          backgroundColor: i === 1 ? "#0d9488" : "#99f6e4",
        }} />
      ))}
    </div>
  );
}

// ─── Step 1: Phone ────────────────────────────────────────────────────────────

function PhoneStep({
  onOtpSent,
}: {
  onOtpSent: (phone: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(v: string) {
    if (/^\d{0,10}$/.test(v)) { setPhone(v); setError(null); }
  }

  async function handleSend() {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }
      onOtpSent(phone);
    } catch {
      setError("Unable to reach the server. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p className="mt-1.5" style={{ fontSize: "14px", color: "#94a3b8" }}>
          Enter your registered mobile number
        </p>
      </div>
      <div>
        <label className="block mb-1.5"
          style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
          Mobile Number
        </label>
        <TextInput
          value={phone}
          onChange={handlePhoneChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="10-digit mobile number"
          type="tel"
          autoFocus
          prefix="+91"
        />
      </div>
      {error && <ErrorBox message={error} />}
      <TealButton
        onClick={handleSend}
        loading={loading}
        loadingLabel="Sending OTP…"
        label="Send OTP"
      />
      <p className="text-center" style={{ fontSize: "12.5px", color: "#9ca3af" }}>
        You will receive a 6-digit OTP on WhatsApp
      </p>
    </div>
  );
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────

function OtpStep({
  phone,
  onVerified,
  onBack,
}: {
  phone: string;
  onVerified: (token: string, profiles: UserProfile[]) => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  function handleOtpChange(v: string) {
    if (/^\d{0,6}$/.test(v)) { setOtp(v); setError(null); }
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }
      onVerified(data.selection_token, data.profiles);
    } catch {
      setError("Unable to reach the server. Please check your connection.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      await apiFetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });
      setCooldown(60);
      timerRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend OTP.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button onClick={onBack} className="flex items-center gap-1 mb-3"
          style={{ fontSize: "13px", color: "#0d9488", fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          Enter OTP
        </h1>
        <p className="mt-1.5" style={{ fontSize: "14px", color: "#94a3b8" }}>
          Sent to +91-{phone} via WhatsApp
        </p>
      </div>
      <div>
        <label className="block mb-1.5"
          style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
          Verification Code
        </label>
        <TextInput
          value={otp}
          onChange={handleOtpChange}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          placeholder="6-digit code"
          type="tel"
          autoFocus
        />
      </div>
      {error && <ErrorBox message={error} />}
      <TealButton
        onClick={handleVerify}
        loading={loading}
        loadingLabel="Verifying…"
        label="Verify OTP"
      />
      <div className="text-center">
        {cooldown > 0 ? (
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            Resend in {cooldown}s
          </span>
        ) : (
          <button onClick={handleResend}
            style={{ fontSize: "13px", color: "#0d9488", fontWeight: 500 }}>
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Profile Selector ─────────────────────────────────────────────────

function ProfileStep({
  profiles,
  selectionToken,
  onBack,
}: {
  profiles: UserProfile[];
  selectionToken: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleSelect(userId: string) {
    setLoadingId(userId);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/select-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_token: selectionToken, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to select profile. Please try again.");
        setLoadingId(null);
        return;
      }
      saveToken(data.token);
      const payload = parseToken(data.token);
      if (!payload) {
        setError("Received an invalid session. Please try again.");
        setLoadingId(null);
        return;
      }
      navigate(ROLE_ROUTES[payload.role_id] ?? "/login");
    } catch {
      setError("Unable to reach the server.");
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button onClick={onBack} className="flex items-center gap-1 mb-3"
          style={{ fontSize: "13px", color: "#0d9488", fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          Select your profile
        </h1>
        <p className="mt-1.5" style={{ fontSize: "14px", color: "#94a3b8" }}>
          Multiple accounts found for this number
        </p>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="space-y-3">
        {profiles.map((profile) => {
          const roleLabel = ROLE_LABELS[profile.role_id as keyof typeof ROLE_LABELS] ?? "User";
          const initials = (profile.full_name ?? "U")
            .split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
          const isLoading = loadingId === profile.user_id;
          return (
            <button
              key={profile.user_id}
              onClick={() => handleSelect(profile.user_id)}
              disabled={loadingId !== null}
              className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:shadow-sm disabled:opacity-60"
              style={{ border: "1.5px solid #e5e7eb", backgroundColor: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#f0fdfa" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#0d9488" }}>
                  {initials}
                </span>
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>
                  {profile.full_name ?? "User"}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280" }}>{roleLabel}</p>
              </div>
              {isLoading ? (
                <svg className="animate-spin flex-shrink-0" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────


export function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [selectionToken, setSelectionToken] = useState("");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  function handleOtpSent(p: string) {
    setPhone(p);
    setStep("otp");
  }

  function handleVerified(token: string, profs: UserProfile[]) {
    if (profs.length === 1) {
      // Auto select — go straight to app
      handleAutoSelect(token, profs[0]);
    } else {
      setSelectionToken(token);
      setProfiles(profs);
      setStep("profile");
    }
  }

  async function handleAutoSelect(token: string, profile: UserProfile) {
    try {
      const res = await apiFetch("/api/auth/select-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_token: token, user_id: profile.user_id }),
      });
      const data = await res.json();
      if (!res.ok) return;
      saveToken(data.token);
      const payload = parseToken(data.token);
      if (!payload) return;
      navigate(ROLE_ROUTES[payload.role_id] ?? "/login");
    } catch {
      // fall through to profile step as fallback
      setSelectionToken(token);
      setProfiles([profile]);
      setStep("profile");
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: "#f8fafc" }}>
      <TopMobileBar />
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative"
        style={{
          backgroundImage: `url(${loginDoodle})`,
          backgroundSize: "600px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}>
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.92)" }} />
        <div className="relative z-10 w-full" style={{ maxWidth: "400px" }}>
          {step === "phone" && (
            <PhoneStep onOtpSent={handleOtpSent} />
          )}
          {step === "otp" && (
            <OtpStep
              phone={phone}
              onVerified={handleVerified}
              onBack={() => setStep("phone")}
            />
          )}
          {step === "profile" && (
            <ProfileStep
              profiles={profiles}
              selectionToken={selectionToken}
              onBack={() => setStep("otp")}
            />
          )}
        </div>
      </div>

      {/* Privacy Policy link */}
      <div className="flex lg:hidden justify-center py-2"
        style={{ backgroundColor: "#f0fdfa", borderTop: "1px solid #ccfbf1" }}>
        <a href="/privacy" style={{ fontSize: "12px", color: "#0d9488" }}>
          Privacy Policy
        </a>
      </div>

      <BottomMobileDots />
    </div>
  );
}