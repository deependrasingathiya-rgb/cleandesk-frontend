// src/app/pages/Profile.tsx

import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import {
  Mail, Phone, MapPin, Calendar, Shield, Edit2, Key, Bell,
  Globe, X, Eye, EyeOff, Check, GraduationCap, UserCheck,
  Users as UsersIcon, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { fetchMyProfile, type MyProfile } from "../../Lib/api/profile";

// ─── Role detection (mirrors Sidebar.tsx) ──────────────────────────────────────

type RoleContext = "admin" | "teacher" | "management" | "student";

function detectRole(pathname: string): RoleContext {
  if (pathname === "/teacher"    || pathname.startsWith("/teacher/"))    return "teacher";
  if (pathname === "/management" || pathname.startsWith("/management/")) return "management";
  if (pathname === "/student"    || pathname.startsWith("/student/"))    return "student";
  return "admin";
}

// ─── Per-role static data ──────────────────────────────────────────────────────

type RoleProfile = {
  name: string;
  initials: string;
  role: string;
  roleColor: string;
  roleBg: string;
  roleIcon: React.ElementType;
  email: string;
  phone: string;
  location: string;
  institute: string;
  joined: string;
  lastLogin: string;
  activityLog: { action: string; time: string }[];
};

const ROLE_PROFILES: Record<RoleContext, RoleProfile> = {
  admin: {
    name: "Aryan Kumar",
    initials: "AK",
    role: "Super Admin",
    roleColor: "#7c3aed",
    roleBg: "#f5f3ff",
    roleIcon: Shield,
    email: "aryan.kumar@institute.edu",
    phone: "+91 98765 43200",
    location: "Mumbai, Maharashtra",
    institute: "EduAdmin Institute",
    joined: "January 2022",
    lastLogin: "Today, 9:14 AM",
    activityLog: [
      { action: "Created announcement: Annual Sports Day",             time: "Mar 5, 2026, 3:45 PM"  },
      { action: "Enrolled student: Sneha Patel in Science Batch A",    time: "Mar 5, 2026, 11:20 AM" },
      { action: "Updated batch capacity: Math – Batch D",              time: "Mar 4, 2026, 2:10 PM"  },
      { action: "Added teacher: Dr. Anita Sharma",                     time: "Mar 3, 2026, 10:05 AM" },
      { action: "Published academic year 2026–2027",                   time: "Mar 2, 2026, 4:30 PM"  },
    ],
  },
  teacher: {
    name: "Ravi Shankar",
    initials: "RS",
    role: "Teacher",
    roleColor: "#0d9488",
    roleBg: "#f0fdfa",
    roleIcon: GraduationCap,
    email: "ravi.shankar@institute.edu",
    phone: "+91 98001 11001",
    location: "Pune, Maharashtra",
    institute: "EduAdmin Institute",
    joined: "April 2024",
    lastLogin: "Today, 8:50 AM",
    activityLog: [
      { action: "Marked attendance for Science – Batch A",             time: "Mar 8, 2026, 9:05 AM"  },
      { action: "Uploaded: Physics Formula Sheet.pdf",                 time: "Mar 3, 2026, 11:00 AM" },
      { action: "Created test: Mid-Term Physics",                      time: "Mar 1, 2026, 2:30 PM"  },
      { action: "Marked attendance for Math – Batch D",                time: "Feb 28, 2026, 9:12 AM" },
      { action: "Added result for Algebra Unit Test",                  time: "Feb 20, 2026, 4:00 PM" },
    ],
  },
  management: {
    name: "Meera Joshi",
    initials: "MJ",
    role: "Management",
    roleColor: "#2563eb",
    roleBg: "#eff6ff",
    roleIcon: UserCheck,
    email: "meera.joshi@institute.edu",
    phone: "+91 98002 22002",
    location: "Nagpur, Maharashtra",
    institute: "EduAdmin Institute",
    joined: "February 2023",
    lastLogin: "Today, 10:30 AM",
    activityLog: [
      { action: "Reviewed attendance report for March 2026",           time: "Mar 8, 2026, 10:15 AM" },
      { action: "Exported student marks – Commerce Batch B",           time: "Mar 6, 2026, 3:00 PM"  },
      { action: "Viewed upcoming test schedule",                       time: "Mar 5, 2026, 2:00 PM"  },
      { action: "Checked batch occupancy report",                      time: "Mar 4, 2026, 11:45 AM" },
      { action: "Reviewed study material uploads",                     time: "Mar 3, 2026, 9:30 AM"  },
    ],
  },
  student: {
    name: "Sneha Patel",
    initials: "SP",
    role: "Student",
    roleColor: "#d97706",
    roleBg: "#fffbeb",
    roleIcon: UsersIcon,
    email: "sneha.patel@student.edu",
    phone: "+91 98003 33003",
    location: "Thane, Maharashtra",
    institute: "EduAdmin Institute",
    joined: "April 2024",
    lastLogin: "Today, 7:45 AM",
    activityLog: [
      { action: "Viewed attendance report for March 2026",             time: "Mar 8, 2026, 7:50 AM"  },
      { action: "Downloaded: Physics Formula Sheet.pdf",               time: "Mar 3, 2026, 6:30 PM"  },
      { action: "Checked result: Organic Chemistry Quiz",              time: "Feb 20, 2026, 5:00 PM" },
      { action: "Viewed announcement: Mid-Term Exam Schedule",         time: "Mar 4, 2026, 8:00 AM"  },
      { action: "Viewed upcoming test: Algebra Unit Test",             time: "Mar 2, 2026, 7:30 PM"  },
    ],
  },
};

// ─── Inline Field Editor ───────────────────────────────────────────────────────

function InlineEditor({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  function commit() {
    if (draft.trim()) onSave(draft.trim());
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-gray-500" style={{ fontSize: "12px", fontWeight: 500 }}>{label}</p>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            className="mt-1 w-full border border-teal-300 rounded-md px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all"
            style={{ fontSize: "13.5px" }}
          />
        ) : (
          <p className="text-gray-800 mt-0.5 truncate" style={{ fontSize: "14px", fontWeight: 500 }}>{value}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {editing ? (
          <>
            <button
              onClick={commit}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-teal-50"
              style={{ color: "#0d9488" }}
              title="Save"
            >
              <Check size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={cancel}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ color: "#9ca3af" }}
              title="Cancel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-teal-50 text-gray-300 hover:text-teal-600"
            title="Edit"
          >
            <Edit2 size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const lengthOk  = next.length >= 8;
  const matchOk   = next === confirm && confirm.length > 0;
  const hasUpper  = /[A-Z]/.test(next);
  const hasNum    = /[0-9]/.test(next);
  const canSubmit = current.trim() && lengthOk && matchOk && hasUpper && hasNum;

  function handleSubmit() {
    if (!canSubmit) return;
    // Simulate wrong current password for demo
    if (current !== "Password123") {
      setError("Current password is incorrect. (Hint: Password123)");
      return;
    }
    setError("");
    setDone(true);
  }

  function Rule({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: ok ? "#f0fdf4" : "#f9fafb", border: `1.5px solid ${ok ? "#16a34a" : "#e5e7eb"}` }}
        >
          {ok && <Check size={8} style={{ color: "#16a34a" }} strokeWidth={3} />}
        </div>
        <span style={{ fontSize: "11.5px", color: ok ? "#16a34a" : "#9ca3af" }}>{label}</span>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7" style={{ border: "1px solid #f3f4f6" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Change Password
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Choose a strong, unique password.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#f0fdf4" }}>
              <CheckCircle2 size={28} style={{ color: "#16a34a" }} strokeWidth={1.8} />
            </div>
            <p className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Password Updated</p>
            <p className="text-gray-400" style={{ fontSize: "13px" }}>Your password has been changed successfully.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-5">
              {/* Current Password */}
              {[
                { label: "Current Password", val: current, set: setCurrent, show: showCur, toggle: () => setShowCur(v => !v) },
                { label: "New Password",     val: next,    set: setNext,    show: showNew, toggle: () => setShowNew(v => !v) },
                { label: "Confirm Password", val: confirm, set: setConfirm, show: showCon, toggle: () => setShowCon(v => !v) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>{label}</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={val}
                      onChange={(e) => { set(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
                      style={{ fontSize: "13.5px" }}
                    />
                    <button
                      type="button"
                      onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {show ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Strength rules */}
              {next.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <Rule ok={lengthOk} label="At least 8 characters" />
                  <Rule ok={hasUpper} label="One uppercase letter" />
                  <Rule ok={hasNum}   label="One number" />
                  <Rule ok={matchOk}  label="Passwords match" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                  <AlertTriangle size={13} style={{ color: "#dc2626" }} strokeWidth={2} />
                  <p style={{ fontSize: "12.5px", color: "#dc2626" }}>{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Cancel
              </button>
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
              >
                Update Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Two-Factor Auth Modal ─────────────────────────────────────────────────────

function TwoFactorModal({ onClose, enabled: initialEnabled }: { onClose: (newState: boolean) => void; enabled: boolean }) {
  const [step,    setStep]    = useState<"overview" | "setup" | "verify" | "done" | "disable">("overview");
  const [code,    setCode]    = useState("");
  const [codeErr, setCodeErr] = useState(false);

  // Fake TOTP secret / QR stand-in
  const fakeSecret = "JBSWY3DPEHPK3PXP";
  const fakeQR     = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/CleanDesk:user@institute.edu?secret=${fakeSecret}&issuer=CleanDesk`;

  function handleVerify() {
    // Accept "123456" as the demo valid code
    if (code === "123456") {
      setCodeErr(false);
      setStep("done");
    } else {
      setCodeErr(true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(initialEnabled); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7" style={{ border: "1px solid #f3f4f6" }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Two-Factor Authentication
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              {initialEnabled ? "2FA is currently active on your account." : "Add an extra layer of security."}
            </p>
          </div>
          <button onClick={() => onClose(initialEnabled)} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Overview */}
        {step === "overview" && (
          <div>
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-5"
              style={{
                backgroundColor: initialEnabled ? "#f0fdf4" : "#f9fafb",
                border: `1px solid ${initialEnabled ? "#bbf7d0" : "#f3f4f6"}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: initialEnabled ? "#dcfce7" : "#f0fdfa" }}
              >
                <Shield size={18} style={{ color: initialEnabled ? "#16a34a" : "#0d9488" }} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: "13.5px", fontWeight: 700, color: initialEnabled ? "#15803d" : "#374151" }}>
                  {initialEnabled ? "2FA is Enabled" : "2FA is Disabled"}
                </p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>
                  {initialEnabled
                    ? "Your account is protected with an authenticator app."
                    : "Enable 2FA to protect your account with a one-time code."}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onClose(initialEnabled)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Cancel
              </button>
              {initialEnabled ? (
                <button
                  onClick={() => setStep("disable")}
                  className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#dc2626", fontSize: "13.5px", fontWeight: 600 }}
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={() => setStep("setup")}
                  className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>
        )}

        {/* Setup — show QR */}
        {step === "setup" && (
          <div>
            <ol className="space-y-3 mb-5 text-gray-600" style={{ fontSize: "13px" }}>
              <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>Scan the QR code below with your app.</li>
              <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>Enter the 6-digit code from the app to verify.</li>
            </ol>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl border border-gray-100" style={{ backgroundColor: "#f9fafb" }}>
                <img src={fakeQR} alt="QR Code" className="w-40 h-40 rounded-xl" />
              </div>
            </div>
            <p className="text-center text-gray-400 mb-5" style={{ fontSize: "11.5px" }}>
              Or enter key manually: <span className="font-mono text-gray-600 select-all">{fakeSecret}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep("overview")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Back
              </button>
              <button onClick={() => setStep("verify")} className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all" style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}>
                Next — Verify
              </button>
            </div>
          </div>
        )}

        {/* Verify code */}
        {step === "verify" && (
          <div>
            <p className="text-gray-600 mb-4" style={{ fontSize: "13px" }}>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setCodeErr(false); }}
              placeholder="000000"
              className="w-full border rounded-xl px-4 py-3 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all mb-2"
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                borderColor: codeErr ? "#fca5a5" : "#e5e7eb",
              }}
            />
            {codeErr && (
              <p className="text-center mb-3" style={{ fontSize: "12px", color: "#dc2626" }}>
                Invalid code. Try <strong>123456</strong> for this demo.
              </p>
            )}
            <p className="text-gray-400 text-center mb-5" style={{ fontSize: "11.5px" }}>
              Demo hint: enter <strong>123456</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep("setup")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Back
              </button>
              <button
                disabled={code.length !== 6}
                onClick={handleVerify}
                className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
              >
                Verify & Enable
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#f0fdf4" }}>
              <CheckCircle2 size={28} style={{ color: "#16a34a" }} strokeWidth={1.8} />
            </div>
            <p className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>2FA Enabled</p>
            <p className="text-gray-400 mb-6" style={{ fontSize: "13px" }}>Your account is now protected with two-factor authentication.</p>
            <button
              onClick={() => onClose(true)}
              className="px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        )}

        {/* Disable confirm */}
        {step === "disable" && (
          <div>
            <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <AlertTriangle size={16} style={{ color: "#dc2626", marginTop: "2px" }} strokeWidth={2} />
              <p className="text-red-700" style={{ fontSize: "13px" }}>
                Disabling 2FA will make your account less secure. You can re-enable it at any time.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("overview")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Keep 2FA On
              </button>
              <button
                onClick={() => onClose(false)}
                className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: "#dc2626", fontSize: "13.5px", fontWeight: 600 }}
              >
                Yes, Disable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notification Preferences Modal ───────────────────────────────────────────

type NotifPrefs = {
  emailAnnouncements: boolean;
  emailTests:         boolean;
  emailAttendance:    boolean;
  pushAll:            boolean;
  pushTests:          boolean;
  pushAttendance:     boolean;
  digestFrequency:    "realtime" | "daily" | "weekly";
};

function NotifToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative inline-flex items-center rounded-full transition-all duration-200 flex-shrink-0"
      style={{ width: "40px", height: "22px", backgroundColor: value ? "#0d9488" : "#e5e7eb" }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{ width: "16px", height: "16px", transform: value ? "translateX(20px)" : "translateX(3px)" }}
      />
    </button>
  );
}

function NotificationModal({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    emailAnnouncements: true,
    emailTests:         true,
    emailAttendance:    false,
    pushAll:            true,
    pushTests:          true,
    pushAttendance:     true,
    digestFrequency:    "daily",
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function Section({ title }: { title: string }) {
    return (
      <p className="text-gray-400 uppercase mt-5 mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
        {title}
      </p>
    );
  }

  function PrefRow({ label, desc, prefKey }: { label: string; desc: string; prefKey: keyof NotifPrefs }) {
    return (
      <div className="flex items-center justify-between py-2.5">
        <div className="pr-4">
          <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{label}</p>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>{desc}</p>
        </div>
        <NotifToggle value={prefs[prefKey] as boolean} onChange={() => toggle(prefKey)} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #f3f4f6" }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Notification Preferences
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Control how and when you hear from CleanDesk.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <Section title="Email Notifications" />
        <div className="divide-y divide-gray-50">
          <PrefRow label="Announcements"       desc="Receive emails for new announcements"       prefKey="emailAnnouncements" />
          <PrefRow label="Tests & Results"     desc="Be notified when tests are created or graded" prefKey="emailTests" />
          <PrefRow label="Attendance Alerts"   desc="Get alerted for attendance marked"           prefKey="emailAttendance" />
        </div>

        <Section title="Push Notifications" />
        <div className="divide-y divide-gray-50">
          <PrefRow label="All Activity"       desc="Push notifications for all platform activity"  prefKey="pushAll" />
          <PrefRow label="Tests & Results"    desc="Push when a test or result is published"        prefKey="pushTests" />
          <PrefRow label="Attendance Alerts"  desc="Push when attendance is marked for your batch"  prefKey="pushAttendance" />
        </div>

        <Section title="Email Digest Frequency" />
        <div className="flex gap-2">
          {(["realtime", "daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setPrefs((p) => ({ ...p, digestFrequency: f })); setSaved(false); }}
              className="flex-1 py-2 rounded-xl border capitalize transition-all"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                borderColor: prefs.digestFrequency === f ? "#0d9488" : "#f3f4f6",
                backgroundColor: prefs.digestFrequency === f ? "#f0fdfa" : "white",
                color: prefs.digestFrequency === f ? "#0d9488" : "#9ca3af",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: saved ? "#16a34a" : "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {saved ? <><CheckCircle2 size={15} strokeWidth={2.5} /> Saved!</> : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Component ────────────────────────────────────────────────────

export function Profile() {
  const location = useLocation();
  const role     = (() => {
    const p = location.pathname;
    if (p.startsWith("/teacher"))    return "teacher"    as RoleContext;
    if (p.startsWith("/management")) return "management" as RoleContext;
    if (p.startsWith("/student"))    return "student"    as RoleContext;
    return "admin" as RoleContext;
  })();

  const base = ROLE_PROFILES[role];

  // ── Live profile data from backend ──
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  // Editable fields — seeded from API response
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [location_, setLocation]  = useState("");
  const [institute, setInstitute] = useState("");
  const [joinedAt,  setJoinedAt]  = useState("");

  useEffect(() => {
    setProfileLoading(true);
    setProfileError(null);
    fetchMyProfile()
      .then((profile: MyProfile) => {
        setName(profile.full_name);
        setEmail(profile.email ?? "");
        setPhone(profile.mobile ?? "");
        setLocation(profile.address ?? "");
        setInstitute(profile.institute_name);
        setJoinedAt(
          new Date(profile.created_at).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })
        );
      })
      .catch((err: Error) => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  }, []);

  // Modal state
  const [showPassword, setShowPassword]     = useState(false);
  const [showTwoFactor, setShowTwoFactor]   = useState(false);
  const [showNotif, setShowNotif]           = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Recompute initials dynamically from the live name
  const initials = name.split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).join("").slice(0, 2);

  const RoleIcon = base.roleIcon;

  if (profileLoading) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400" style={{ fontSize: "13.5px" }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#dc2626" }} strokeWidth={1.5} />
          <p className="text-gray-800 mb-1" style={{ fontSize: "15px", fontWeight: 600 }}>Could not load profile</p>
          <p className="text-gray-400" style={{ fontSize: "13px" }}>{profileError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-8">
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>Profile</h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Left: Profile Card ── */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: base.roleBg }}
            >
              <span style={{ fontSize: "28px", fontWeight: 700, color: base.roleColor }}>{initials}</span>
            </div>

            {/* Name & Role */}
            <h2 className="text-gray-900 mb-1" style={{ fontSize: "18px", fontWeight: 700 }}>{name}</h2>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
              style={{ fontSize: "12px", fontWeight: 600, color: base.roleColor, backgroundColor: base.roleBg }}
            >
              <RoleIcon size={12} strokeWidth={2} />
              {base.role}
            </span>

            {/* Info list */}
            <div className="space-y-3 text-left mt-4 pt-4 border-t border-gray-100">
              {[
                { icon: Mail,     value: email      },
                { icon: Phone,    value: phone      },
                { icon: MapPin,   value: location_  },
                { icon: Calendar, value: `Joined ${joinedAt}` },
                { icon: Globe,    value: institute   },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-3 text-gray-500">
                  <Icon size={14} className="text-gray-400 flex-shrink-0" />
                  <span style={{ fontSize: "12.5px" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Last login */}
            <p className="text-gray-400 mt-4 pt-4 border-t border-gray-50" style={{ fontSize: "11.5px" }}>
              Last login: Today
            </p>

            {/* 2FA status badge */}
            <div
              className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{
                backgroundColor: twoFactorEnabled ? "#f0fdf4" : "#f9fafb",
                border: `1px solid ${twoFactorEnabled ? "#bbf7d0" : "#f3f4f6"}`,
              }}
            >
              <Shield size={12} style={{ color: twoFactorEnabled ? "#16a34a" : "#9ca3af" }} strokeWidth={2} />
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: twoFactorEnabled ? "#16a34a" : "#9ca3af" }}>
                2FA {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: Settings Panels ── */}
        <div className="col-span-2 space-y-5">

          {/* Account Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-gray-800 mb-4" style={{ fontSize: "15px", fontWeight: 650 }}>Account Settings</h3>
            <div className="space-y-0">
              {role === "student" ? (
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div>
                    <p className="text-gray-500" style={{ fontSize: "12px", fontWeight: 500 }}>Full Name</p>
                    <p className="text-gray-800 mt-0.5" style={{ fontSize: "14px", fontWeight: 500 }}>{name}</p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    title="Name can only be changed by an admin"
                    style={{ backgroundColor: "#f9fafb", cursor: "not-allowed" }}
                  >
                    <Edit2 size={13} strokeWidth={2} style={{ color: "#d1d5db" }} />
                  </div>
                </div>
              ) : (
                <InlineEditor label="Full Name" value={name} onSave={setName} />
              )}
              <InlineEditor label="Email Address" value={email}     onSave={setEmail}     />
              <InlineEditor label="Phone Number"  value={phone}     onSave={setPhone}     />
              <InlineEditor label="Location"      value={location_} onSave={setLocation}  />
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-gray-800 mb-4" style={{ fontSize: "15px", fontWeight: 650 }}>Security</h3>
            <div className="space-y-3">

              {/* Change Password */}
              <div
                onClick={() => setShowPassword(true)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                    <Key size={15} style={{ color: "#0d9488" }} />
                  </div>
                  <div>
                    <p className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Change Password</p>
                    <p className="text-gray-400" style={{ fontSize: "12px" }}>Update your account password</p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-teal-500">→</span>
              </div>

              {/* Two-Factor Auth */}
              <div
                onClick={() => setShowTwoFactor(true)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                    <Shield size={15} style={{ color: "#0d9488" }} />
                  </div>
                  <div>
                    <p className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Two-Factor Authentication</p>
                    <p className="text-gray-400" style={{ fontSize: "12px" }}>
                      {twoFactorEnabled ? "Enabled — click to manage" : "Add an extra layer of security"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: twoFactorEnabled ? "#16a34a" : "#9ca3af",
                      backgroundColor: twoFactorEnabled ? "#f0fdf4" : "#f9fafb",
                    }}
                  >
                    {twoFactorEnabled ? "On" : "Off"}
                  </span>
                  <span className="text-gray-300 group-hover:text-teal-500">→</span>
                </div>
              </div>

              {/* Notification Preferences */}
              <div
                onClick={() => setShowNotif(true)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                    <Bell size={15} style={{ color: "#0d9488" }} />
                  </div>
                  <div>
                    <p className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Notification Preferences</p>
                    <p className="text-gray-400" style={{ fontSize: "12px" }}>Manage email & push notifications</p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-teal-500">→</span>
              </div>

            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-gray-800 mb-4" style={{ fontSize: "15px", fontWeight: 650 }}>Recent Activity</h3>
            <div className="space-y-3">
              {base.activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: base.roleColor }} />
                  <div>
                    <p className="text-gray-700" style={{ fontSize: "13px" }}>{log.action}</p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "11.5px" }}>{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showPassword && (
        <ChangePasswordModal onClose={() => setShowPassword(false)} />
      )}
      {showTwoFactor && (
        <TwoFactorModal
          enabled={twoFactorEnabled}
          onClose={(newState) => { setTwoFactorEnabled(newState); setShowTwoFactor(false); }}
        />
      )}
      {showNotif && (
        <NotificationModal onClose={() => setShowNotif(false)} />
      )}
    </div>
  );
}