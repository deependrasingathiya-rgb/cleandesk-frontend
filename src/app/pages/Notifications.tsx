// src/app/pages/Notifications.tsx

import { useState, useEffect, useCallback } from "react";
import {
  fetchNotificationsApi,
  markNotificationsReadApi,
  type NotificationRecord,
} from "../../Lib/api/notifications";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  Users,
  TrendingUp,
  Megaphone,
  BookOpen,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Check,
  SlidersHorizontal,
} from "lucide-react";

// ─── Event type → display config ───────────────────────────────────────────────

type NotifStyle = {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
};

const EVENT_STYLE: Record<string, NotifStyle> = {
  STUDENT_ACCOUNT_CREATED:    { icon: Users,        color: "#0d9488", bg: "#f0fdfa", label: "Enrollment"    },
  STUDENT_ABSENT:             { icon: CheckSquare,  color: "#dc2626", bg: "#fef2f2", label: "Attendance"    },
  STUDENT_LATE:               { icon: CheckSquare,  color: "#d97706", bg: "#fffbeb", label: "Attendance"    },
  STUDENT_EARLY_LEAVE:        { icon: CheckSquare,  color: "#7c3aed", bg: "#f5f3ff", label: "Attendance"    },
  TEST_CREATED:               { icon: ClipboardList,color: "#2563eb", bg: "#eff6ff", label: "Tests"         },
  TEST_DATE_UPDATED:          { icon: ClipboardList,color: "#d97706", bg: "#fffbeb", label: "Tests"         },
  TEST_RESULT_PUBLISHED:      { icon: TrendingUp,   color: "#16a34a", bg: "#f0fdf4", label: "Results"       },
  STUDY_MATERIAL_UPLOADED:    { icon: BookOpen,     color: "#7c3aed", bg: "#f5f3ff", label: "Materials"     },
  HOLIDAY_DECLARED:           { icon: Megaphone,    color: "#d97706", bg: "#fffbeb", label: "Holiday"       },
  GENERAL_ANNOUNCEMENT:       { icon: Megaphone,    color: "#0d9488", bg: "#f0fdfa", label: "Announcement"  },
  TEST_DAY_ANNOUNCED:         { icon: ClipboardList,color: "#db2777", bg: "#fdf2f8", label: "Announcement"  },
  PARENT_TEACHER_MEETING:     { icon: Users,        color: "#2563eb", bg: "#eff6ff", label: "Announcement"  },
  FEE_PAYMENT_RECEIVED:       { icon: DollarSign,   color: "#16a34a", bg: "#f0fdf4", label: "Fee"           },
  FEE_OVERDUE:                { icon: DollarSign,   color: "#dc2626", bg: "#fef2f2", label: "Fee"           },
  STUDENT_ENROLLMENT_ACTIVATED:{ icon: UserCheck,   color: "#0d9488", bg: "#f0fdfa", label: "Enrollment"    },
};

const DEFAULT_STYLE: NotifStyle = {
  icon: Bell, color: "#6b7280", bg: "#f9fafb", label: "General",
};

function getStyle(eventType: string): NotifStyle {
  return EVENT_STYLE[eventType] ?? DEFAULT_STYLE;
}

// ─── Unique filter categories derived from EVENT_STYLE ────────────────────────

const ALL_FILTERS = [
  "All",
  ...Array.from(new Set(Object.values(EVENT_STYLE).map((s) => s.label))).sort(),
];

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: NotificationRecord;
  onRead: (id: string) => void;
}) {
  const style = getStyle(notif.event_type);
  const Icon  = style.icon;

  function handleClick() {
    if (!notif.is_read) onRead(notif.id);
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50"
      style={{ backgroundColor: notif.is_read ? "white" : "#f0fdfa22" }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: style.bg }}
      >
        <Icon size={16} style={{ color: style.color }} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className="text-gray-800 leading-snug"
            style={{ fontSize: "13.5px", fontWeight: notif.is_read ? 400 : 600 }}
          >
            {notif.message}
          </p>
          {/* Unread dot */}
          {!notif.is_read && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: "#0d9488" }}
            />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {/* Category badge */}
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              fontSize: "10.5px",
              fontWeight: 600,
              color: style.color,
              backgroundColor: style.bg,
            }}
          >
            {style.label}
          </span>
          <span className="text-gray-300" style={{ fontSize: "11px" }}>·</span>
          <span className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {relativeTime(notif.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [filter,        setFilter]        = useState("All");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [markingAll,    setMarkingAll]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotificationsApi({ limit: 100 });
      setNotifications(result.notifications);
      setUnreadCount(result.unread_count);
    } catch (err: any) {
      setError(err.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Mark a single notification read — optimistic update
  async function handleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    markNotificationsReadApi([id]).catch(() => {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      setUnreadCount((c) => c + 1);
    });
  }

  // Mark all read
  async function handleMarkAllRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markNotificationsReadApi();
    } catch {
      // revert and reload on failure
      await load();
    } finally {
      setMarkingAll(false);
    }
  }

  // Filter pipeline
  const visible = notifications.filter((n) => {
    if (showUnreadOnly && n.is_read) return false;
    if (filter !== "All" && getStyle(n.event_type).label !== filter) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-[860px] mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Notifications
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-teal-300 hover:text-teal-700 transition-all disabled:opacity-50"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <Check size={14} strokeWidth={2.5} />
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* ── Filters bar ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Unread toggle */}
        <button
          onClick={() => setShowUnreadOnly((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            backgroundColor: showUnreadOnly ? "#f0fdfa" : "white",
            borderColor:     showUnreadOnly ? "#0d9488" : "#f3f4f6",
            color:           showUnreadOnly ? "#0d9488" : "#6b7280",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: showUnreadOnly ? "#0d9488" : "#d1d5db" }}
          />
          Unread only
        </button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {ALL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-2 rounded-xl border transition-all"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                backgroundColor: filter === f ? "#0d9488" : "white",
                borderColor:     filter === f ? "#0d9488" : "#f3f4f6",
                color:           filter === f ? "white"   : "#6b7280",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notification list ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* List header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <p className="text-gray-500" style={{ fontSize: "13px", fontWeight: 600 }}>
            {filter === "All" ? "All Notifications" : filter}
          </p>
          <p className="text-gray-400" style={{ fontSize: "12.5px" }}>
            {visible.length} {visible.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* States */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
              Loading notifications…
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-400" style={{ fontSize: "14px" }}>{error}</p>
            <button
              onClick={load}
              className="mt-3 text-teal-600 underline"
              style={{ fontSize: "13px" }}
            >
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#f0fdfa" }}
            >
              <CheckCircle2 size={26} style={{ color: "#0d9488" }} strokeWidth={1.8} />
            </div>
            <p className="text-gray-700" style={{ fontSize: "15px", fontWeight: 700 }}>
              {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-gray-400 text-center" style={{ fontSize: "13px", maxWidth: "280px" }}>
              {showUnreadOnly
                ? "You're all caught up. Toggle off 'Unread only' to see past notifications."
                : "Notifications will appear here as activity happens in your institute."}
            </p>
          </div>
        ) : (
          <div>
            {visible.map((notif) => (
              <NotifRow key={notif.id} notif={notif} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}