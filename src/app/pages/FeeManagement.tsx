// src/app/pages/FeeManagement.tsx

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  getFeeOverviewApi,
  getBatchDrillDownApi,
  type FeeOverviewData,
  type BatchFeeRow,
  type BatchDrillDownData,
  type BatchDrillDownStudent,
} from "../../Lib/api/fee-management";
import { useNavigate } from "react-router";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

// ─── Fee Status Badge (mirrors StudentProfilePage.tsx — local copy avoids cross-page import) ──

function FeeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    UNPAID:         { color: "#dc2626", bg: "#fef2f2",  label: "Unpaid"         },
    PARTIALLY_PAID: { color: "#d97706", bg: "#fffbeb",  label: "Partially Paid" },
    PAID:           { color: "#16a34a", bg: "#f0fdf4",  label: "Paid"           },
    OVERDUE:        { color: "#9333ea", bg: "#fdf4ff",  label: "Overdue"        },
  };
  const c = config[status] ?? { color: "#6b7280", bg: "#f9fafb", label: status };
  return (
    <span
      className="px-2.5 py-0.5 rounded-full"
      style={{ fontSize: "12px", fontWeight: 700, color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

// ─── Batch Drill-Down View ──────────────────────────────────────────────────────

function BatchDrillDown({
  batchId,
  batchName,
  onBack,
}: {
  batchId: string;
  batchName: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [data, setData]       = useState<BatchDrillDownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getBatchDrillDownApi(batchId)
      .then(setData)
      .catch((e: any) => setError(e.message ?? "Failed to load batch fee data"))
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Loading students…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-teal-600 transition-colors mb-6"
          style={{ fontSize: "13.5px", fontWeight: 600 }}
        >
          <ChevronRight size={15} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
          Back to Overview
        </button>
        <p className="text-red-400" style={{ fontSize: "14px" }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const students = data.students;
  const paid     = students.filter((s) => s.fee_status === "PAID").length;
  const partial  = students.filter((s) => s.fee_status === "PARTIALLY_PAID").length;
  const unpaid   = students.filter((s) => s.fee_status === "UNPAID").length;
  const overdue  = students.filter((s) => s.fee_status === "OVERDUE").length;

  return (
    <div className="p-8 max-w-[1200px] mx-auto">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-teal-600 transition-colors mb-6"
        style={{ fontSize: "13.5px", fontWeight: 600 }}
      >
        <ChevronRight size={15} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        Back to Overview
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          {data.batch_name}
        </h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
          {students.length} student{students.length !== 1 ? "s" : ""} · fee breakdown
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Paid",          value: paid,    color: "#16a34a", bg: "#f0fdf4" },
          { label: "Partially Paid",value: partial, color: "#d97706", bg: "#fffbeb" },
          { label: "Unpaid",        value: unpaid,  color: "#dc2626", bg: "#fef2f2" },
          { label: "Overdue",       value: overdue, color: "#9333ea", bg: "#fdf4ff" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{label}</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: "4px" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Student table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Student", "Status", "Total Payable", "Collected", "Outstanding", "Last Payment"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-gray-300" style={{ fontSize: "14px" }}>No fee records for this batch.</p>
                </td>
              </tr>
            ) : students.map((s) => {
              const initials = s.student_name
                .split(" ")
                .filter(Boolean)
                .map((w: string) => w[0].toUpperCase())
                .join("")
                .slice(0, 2);

              return (
                <tr
                  key={s.student_user_id}
                  onClick={() => navigate(`/students/${s.student_user_id}`)}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  {/* Student name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#f0fdfa" }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488" }}>{initials}</span>
                      </div>
                      <div>
                        <p className="text-gray-800 group-hover:text-teal-700 transition-colors" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                          {s.student_name}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{s.login_identifier}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-3.5">
                    <FeeStatusBadge status={s.fee_status} />
                  </td>

                  {/* Total payable */}
                  <td className="px-5 py-3.5">
                    <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                      {inr(s.total_payable)}
                    </span>
                  </td>

                  {/* Collected */}
                  <td className="px-5 py-3.5">
                    <span style={{ fontSize: "13px", fontWeight: 600, color: s.total_collected > 0 ? "#16a34a" : "#9ca3af" }}>
                      {s.total_collected > 0 ? inr(s.total_collected) : "—"}
                    </span>
                  </td>

                  {/* Outstanding */}
                  <td className="px-5 py-3.5">
                    <span style={{ fontSize: "13px", fontWeight: 600, color: s.outstanding_balance > 0 ? "#dc2626" : "#16a34a" }}>
                      {s.outstanding_balance > 0 ? inr(s.outstanding_balance) : "—"}
                    </span>
                  </td>

                  {/* Last payment date */}
                  <td className="px-5 py-3.5">
                    <span className="text-gray-500" style={{ fontSize: "13px" }}>
                      {s.last_payment_date
                        ? new Date(s.last_payment_date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : <span className="text-gray-300">No payments</span>
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  bg,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>{label}</p>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={16} style={{ color }} strokeWidth={2} />
        </div>
      </div>
      <p className="text-gray-900" style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p className="text-gray-400 mt-2" style={{ fontSize: "11.5px" }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function FeeManagement() {
  const [data, setData]       = useState<FeeOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<{ batchId: string; batchName: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFeeOverviewApi()
      .then(setData)
      .catch((e: any) => setError(e.message ?? "Failed to load fee data"))
      .finally(() => setLoading(false));
  }, []);

  if (drillDown) {
    return (
      <BatchDrillDown
        batchId={drillDown.batchId}
        batchName={drillDown.batchName}
        onBack={() => setDrillDown(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Loading fee data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-red-300" strokeWidth={1.5} />
          <p className="text-red-400" style={{ fontSize: "14px" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const collectionPct = data.collection_pct ?? 0;
  const pctColor =
    collectionPct >= 80 ? "#16a34a" :
    collectionPct >= 50 ? "#d97706" : "#dc2626";

  const totalStudents = data.batches.reduce((s, b) => s + b.student_count, 0);
  const totalPaid     = data.batches.reduce((s, b) => s + b.paid_count,    0);

  return (
    <div className="p-8 max-w-[1200px] mx-auto">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Fee Management
        </h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
          Collection overview for <span className="font-semibold text-gray-600">{data.academic_year_label}</span>
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <StatCard
          label="Total Expected"
          value={inr(data.total_expected)}
          sub={`${totalStudents} student${totalStudents !== 1 ? "s" : ""} enrolled`}
          color="#2563eb"
          bg="#eff6ff"
          icon={DollarSign}
        />
        <StatCard
          label="Total Collected"
          value={inr(data.total_collected)}
          sub={`${totalPaid} fully paid`}
          color="#16a34a"
          bg="#f0fdf4"
          icon={CheckCircle2}
        />
        <StatCard
          label="Outstanding"
          value={inr(data.outstanding)}
          sub={data.outstanding > 0 ? "Pending collection" : "All cleared"}
          color={data.outstanding > 0 ? "#dc2626" : "#16a34a"}
          bg={data.outstanding > 0 ? "#fef2f2" : "#f0fdf4"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Collection Rate"
          value={data.collection_pct !== null ? `${collectionPct}%` : "—"}
          sub="Of total expected"
          color={pctColor}
          bg={collectionPct >= 80 ? "#f0fdf4" : collectionPct >= 50 ? "#fffbeb" : "#fef2f2"}
          icon={TrendingUp}
        />
      </div>

      {/* ── Collection progress bar ── */}
      {data.collection_pct !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Overall Collection Progress
            </p>
            <span style={{ fontSize: "14px", fontWeight: 800, color: pctColor }}>
              {collectionPct}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${collectionPct}%`, backgroundColor: pctColor }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-gray-400" style={{ fontSize: "11.5px" }}>
              {inr(data.total_collected)} collected
            </span>
            <span className="text-gray-400" style={{ fontSize: "11.5px" }}>
              {inr(data.outstanding)} outstanding
            </span>
          </div>
        </div>
      )}

      {/* ── Batch-wise table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
          <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
            Batch-wise Breakdown
          </h2>
          <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
            {data.batches.length} batch{data.batches.length !== 1 ? "es" : ""}
          </span>
        </div>

        {data.batches.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <DollarSign size={32} className="text-gray-200" strokeWidth={1.5} />
            <p className="text-gray-400" style={{ fontSize: "14px" }}>
              No batches found for the active academic year.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {[
                  "Batch",
                  "Students",
                  "Expected",
                  "Collected",
                  "Outstanding",
                  "Paid",
                  "Partial",
                  "Unpaid",
                  "Rate",
                ].map((col) => (
                  <th
                    key={col}
                    className="text-left px-5 py-3 text-gray-400"
                    style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
                  >
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.batches.map((batch) => {
                const batchPct =
                  batch.total_expected > 0
                    ? Math.min(100, Math.round((batch.total_collected / batch.total_expected) * 100))
                    : null;
                const batchPctColor =
                  batchPct === null ? "#9ca3af" :
                  batchPct >= 80    ? "#16a34a" :
                  batchPct >= 50    ? "#d97706" : "#dc2626";

                return (
                  <tr
                    key={batch.batch_id}
                    onClick={() => setDrillDown({ batchId: batch.batch_id, batchName: batch.batch_name })}
                    className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                  >
                    {/* Batch name */}
                    <td className="px-5 py-4">
                      <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 650 }}>
                        {batch.batch_name}
                      </p>
                      {batch.overdue_count > 0 && (
                        <p style={{ fontSize: "11px", color: "#9333ea", fontWeight: 600, marginTop: "2px" }}>
                          {batch.overdue_count} overdue
                        </p>
                      )}
                    </td>

                    {/* Students */}
                    <td className="px-5 py-4">
                      <span className="text-gray-500" style={{ fontSize: "13px" }}>
                        {batch.student_count}
                      </span>
                    </td>

                    {/* Expected */}
                    <td className="px-5 py-4">
                      <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {batch.total_expected > 0 ? inr(batch.total_expected) : "—"}
                      </span>
                    </td>

                    {/* Collected */}
                    <td className="px-5 py-4">
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>
                        {batch.total_collected > 0 ? inr(batch.total_collected) : "—"}
                      </span>
                    </td>

                    {/* Outstanding */}
                    <td className="px-5 py-4">
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: batch.outstanding > 0 ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {batch.outstanding > 0 ? inr(batch.outstanding) : "—"}
                      </span>
                    </td>

                    {/* Paid count */}
                    <td className="px-5 py-4">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "11.5px", fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4" }}
                      >
                        {batch.paid_count}
                      </span>
                    </td>

                    {/* Partially paid count */}
                    <td className="px-5 py-4">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "11.5px", fontWeight: 600, color: "#d97706", backgroundColor: "#fffbeb" }}
                      >
                        {batch.partially_paid_count}
                      </span>
                    </td>

                    {/* Unpaid count */}
                    <td className="px-5 py-4">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "11.5px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2" }}
                      >
                        {batch.unpaid_count}
                      </span>
                    </td>

                    {/* Collection rate bar */}
                    <td className="px-5 py-4">
                      {batchPct !== null ? (
                        <div className="flex items-center gap-2" style={{ minWidth: "90px" }}>
                          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${batchPct}%`, backgroundColor: batchPctColor }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: batchPctColor, minWidth: "32px" }}>
                            {batchPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300" style={{ fontSize: "12.5px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}