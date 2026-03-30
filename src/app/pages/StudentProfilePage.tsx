// src/app/pages/StudentProfilePage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  fetchStudentsApi,
  type StudentRow,
} from "../../Lib/api/students";
import {
  fetchStudentResultsById,
  type StudentResultsData,
  type ResultRow as ApiResultRow,
} from "../../Lib/api/student-results";
import {
  ArrowLeft,
  Award,
  ClipboardList,
  Calendar,
  BookOpen,
  TrendingUp,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  SlidersHorizontal,
  BarChart2,
  Phone,
  School,
  Users2,
  CalendarDays,
  DollarSign,
  Plus,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Pencil,
  Printer,
} from "lucide-react";
import {
  getStudentFeeTabApi,
  recordStudentPaymentApi,
  cancelStudentPaymentApi,
  overrideInstallmentPlanApi,
  type FeeTabData,
  type PaymentRow,
  type InstallmentRow,
} from "../../Lib/api/student-fee";
import { updateStudentFeeRecordApi } from "../../Lib/api/student-fee-record-update";
import { getSession, ROLES } from "../../app/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type StudentResult = {
  testId:     string;
  testName:   string;
  subject:    string;
  batch:      string;
  date:       string;
  score:      number | null;
  totalMarks: number;
  syllabus:   string;
};

function mapApiResult(r: ApiResultRow): StudentResult {
  return {
    testId:     r.test_id,
    testName:   r.test_name,
    subject:    r.subject,
    batch:      r.batch_name,
    date:       r.test_date,
    score:      r.score,
    totalMarks: r.total_marks,
    syllabus:   r.syllabus_text ?? "",
  };
}

// ─── Subject colour map (mirrors StudentMarks exactly) ─────────────────────────

const subjectColors: Record<string, { color: string; bg: string }> = {
  Physics:            { color: "#db2777", bg: "#fdf2f8" },
  Mathematics:        { color: "#2563eb", bg: "#eff6ff" },
  Chemistry:          { color: "#ea580c", bg: "#fff7ed" },
  English:            { color: "#6b7280", bg: "#f9fafb" },
  Business:           { color: "#7c3aed", bg: "#f5f3ff" },
  Biology:            { color: "#16a34a", bg: "#f0fdf4" },
  Accounts:           { color: "#0d9488", bg: "#f0fdfa" },
  History:            { color: "#b45309", bg: "#fffbeb" },
  Geography:          { color: "#0369a1", bg: "#f0f9ff" },
  "Computer Science": { color: "#4f46e5", bg: "#eef2ff" },
  Economics:          { color: "#be185d", bg: "#fdf2f8" },
};

// ─── Helpers (mirrors StudentMarks exactly) ────────────────────────────────────

function pct(score: number, total: number) {
  return Math.round((score / total) * 100);
}

function gradeLabel(p: number): { label: string; color: string; bg: string } {
  if (p >= 90) return { label: "A+", color: "#16a34a", bg: "#f0fdf4" };
  if (p >= 75) return { label: "A",  color: "#0d9488", bg: "#f0fdfa" };
  if (p >= 60) return { label: "B",  color: "#2563eb", bg: "#eff6ff" };
  if (p >= 45) return { label: "C",  color: "#d97706", bg: "#fffbeb" };
  if (p >= 35) return { label: "D",  color: "#ea580c", bg: "#fff7ed" };
  return       { label: "F",  color: "#dc2626", bg: "#fef2f2" };
}

function barColor(p: number): string {
  if (p >= 75) return "#16a34a";
  if (p >= 50) return "#0d9488";
  if (p >= 35) return "#d97706";
  return "#dc2626";
}

function fmtDate(iso: string, short = false): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  });
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getBoardColor(board: string) {
  if (board === "CBSE")  return { color: "#2563eb", bg: "#eff6ff" };
  if (board === "ICSE")  return { color: "#7c3aed", bg: "#f5f3ff" };
  return { color: "#d97706", bg: "#fffbeb" };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Trend tooltip (mirrors StudentMarks exactly) ─────────────────────────────

function TrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const g = gradeLabel(d.percentage);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-3" style={{ minWidth: "160px" }}>
      <p className="text-gray-800 mb-1" style={{ fontSize: "13px", fontWeight: 700 }}>{d.testName}</p>
      <p className="text-gray-400 mb-2" style={{ fontSize: "11px" }}>{fmtDate(d.date, true)}</p>
      <div className="flex items-center justify-between gap-4">
        <span style={{ fontSize: "13px", fontWeight: 700, color: barColor(d.percentage) }}>{d.percentage}%</span>
        <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 700, color: g.color, backgroundColor: g.bg }}>
          {g.label}
        </span>
      </div>
      <p className="text-gray-400 mt-1" style={{ fontSize: "11px" }}>{d.score} / {d.totalMarks} marks</p>
    </div>
  );
}

// ─── Trend dot (mirrors StudentMarks exactly) ─────────────────────────────────

function TrendDot(props: any) {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={5} fill={barColor(payload.percentage)} stroke="white" strokeWidth={2} />;
}

// ─── Subject Detail (mirrors StudentMarks — "Back" label adjusted) ─────────────

function SubjectDetail({
  subject,
  results,
  studentName,
  onBack,
}: {
  subject:     string;
  results:     StudentResult[];
  studentName: string;
  onBack:      () => void;
}) {
  const sc       = subjectColors[subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const attempted = results.filter((r) => r.score !== null);
  const sortedAsc  = [...attempted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedDesc = [...results].sort((a, b)   => new Date(b.date).getTime() - new Date(a.date).getTime());

  const avgPct = attempted.length > 0
    ? Math.round(attempted.reduce((s, r) => s + pct(r.score!, r.totalMarks), 0) / attempted.length)
    : 0;

  const highestEntry = [...attempted].sort((a, b) => pct(b.score!, b.totalMarks) - pct(a.score!, a.totalMarks))[0];
  const highestPct   = highestEntry ? pct(highestEntry.score!, highestEntry.totalMarks) : null;
  const lastAttempted = sortedDesc.find((r) => r.score !== null);
  const lastPct       = lastAttempted ? pct(lastAttempted.score!, lastAttempted.totalMarks) : null;
  const passedCount   = attempted.filter((r) => pct(r.score!, r.totalMarks) >= 35).length;

  const chartData = sortedAsc.map((r) => ({
    label: fmtShortDate(r.date),
    percentage: pct(r.score!, r.totalMarks),
    testName: r.testName,
    score: r.score,
    totalMarks: r.totalMarks,
    date: r.date,
  }));

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to {studentName}'s Profile
      </button>

      {/* Subject hero */}
      <div className="rounded-2xl border shadow-sm p-7 mb-6 flex items-center justify-between"
        style={{ backgroundColor: sc.bg, borderColor: `${sc.color}22` }}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <BookOpen size={26} style={{ color: sc.color }} strokeWidth={1.8} />
          </div>
          <div>
            <p className="uppercase mb-1" style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", color: sc.color, opacity: 0.7 }}>
              Subject Performance
            </p>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: sc.color, letterSpacing: "-0.02em" }}>{subject}</h1>
            <p style={{ fontSize: "13px", color: sc.color, opacity: 0.65, marginTop: "2px" }}>
              {results.length} test{results.length !== 1 ? "s" : ""} · {attempted.length} attempted
            </p>
          </div>
        </div>
        {avgPct > 0 && (
          <div className="text-right">
            <p style={{ fontSize: "44px", fontWeight: 800, color: sc.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{avgPct}%</p>
            <p style={{ fontSize: "12px", color: sc.color, opacity: 0.65, marginTop: "4px" }}>Overall Average</p>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Star,         label: "Highest Score", value: highestPct !== null ? `${highestPct}%` : "—",     color: "#f59e0b" },
          { icon: TrendingUp,   label: "Last Score",    value: lastPct    !== null ? `${lastPct}%`    : "—",     color: barColor(lastPct ?? 0) },
          { icon: CheckCircle2, label: "Passed",        value: `${passedCount} / ${attempted.length}`,           color: "#16a34a" },
          { icon: Award,        label: "Average",       value: avgPct > 0 ? `${avgPct}%` : "—",                  color: barColor(avgPct) },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Icon size={13} style={{ color }} />
              <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>{label}</p>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-gray-800 mb-5" style={{ fontSize: "15px", fontWeight: 700 }}>Score Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<TrendTooltip />} />
              <ReferenceLine y={35} stroke="#fca5a5" strokeDasharray="4 4"
                label={{ value: "Pass 35%", position: "right", fontSize: 10, fill: "#fca5a5" }} />
              <Line type="monotone" dataKey="percentage" stroke={sc.color} strokeWidth={2.5}
                dot={<TrendDot />} activeDot={{ r: 6, fill: sc.color, stroke: "white", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Results table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Test", "Date", "Score", "%", "Grade", "Result"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDesc.map((r) => {
              const absent = r.score === null;
              const p2     = absent ? null : pct(r.score!, r.totalMarks);
              const grade  = p2 !== null ? gradeLabel(p2) : null;
              const passed = p2 !== null && p2 >= 35;
              return (
                <tr key={r.testId} className="border-t border-gray-50">
                  <td className="px-5 py-3 text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{r.testName}</td>
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12.5px" }}>{fmtDate(r.date, true)}</td>
                  <td className="px-5 py-3">
                    {absent ? <span className="text-gray-400">—</span>
                      : <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                          {r.score}<span className="text-gray-400" style={{ fontWeight: 400 }}> / {r.totalMarks}</span>
                        </span>}
                  </td>
                  <td className="px-5 py-3">
                    {absent ? <span className="text-gray-400">—</span>
                      : <span style={{ fontSize: "13px", fontWeight: 700, color: barColor(p2!) }}>{p2}%</span>}
                  </td>
                  <td className="px-5 py-3">
                    {grade && <span className="px-2.5 py-0.5 rounded-full"
                      style={{ fontSize: "12px", fontWeight: 700, color: grade.color, backgroundColor: grade.bg }}>
                      {grade.label}
                    </span>}
                  </td>
                  <td className="px-5 py-3">
                    {absent
                      ? <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f3f4f6" }}>Absent</span>
                      : <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}>
                          {passed ? "Pass" : "Fail"}
                        </span>}
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

// ─── Result Detail (mirrors StudentMarks — "Back" label adjusted) ──────────────

function ResultDetail({ result, studentName, onBack }: {
  result:      StudentResult;
  studentName: string;
  onBack:      () => void;
}) {
  const sc        = subjectColors[result.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const isAbsent  = result.score === null;
  const percentage = isAbsent ? null : pct(result.score!, result.totalMarks);
  const grade      = percentage !== null ? gradeLabel(percentage) : null;
  const passed     = percentage !== null && percentage >= 35;

  return (
    <div className="p-8 max-w-[760px] mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to {studentName}'s Profile
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
              <ClipboardList size={24} style={{ color: sc.color }} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-gray-900 mb-1" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>{result.testName}</h1>
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>{result.batch} · {fmtDate(result.date)}</p>
            </div>
          </div>
          {!isAbsent && grade && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ backgroundColor: grade.bg }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: grade.color }}>{grade.label}</span>
              </div>
              <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600 }}>GRADE</p>
            </div>
          )}
          {isAbsent && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ backgroundColor: "#fee2e2" }}>
                <XCircle size={28} color="#dc2626" strokeWidth={1.5} />
              </div>
              <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600 }}>ABSENT</p>
            </div>
          )}
        </div>

        {!isAbsent && percentage !== null && (
          <div className="mt-8 pt-6 border-t border-gray-50">
            <div className="flex items-end gap-6 mb-5">
              <div>
                <p className="text-gray-400 mb-1" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-900" style={{ fontSize: "48px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{result.score}</span>
                  <span className="text-gray-400" style={{ fontSize: "20px", fontWeight: 400 }}>/ {result.totalMarks}</span>
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: "12px", fontWeight: 600, color: barColor(percentage) }}>{percentage}%</span>
                  <span className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}>
                    {passed ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, backgroundColor: barColor(percentage) }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-300" style={{ fontSize: "10px" }}>0</span>
                  <span className="text-gray-300" style={{ fontSize: "10px" }}>Pass mark: 35%</span>
                  <span className="text-gray-300" style={{ fontSize: "10px" }}>{result.totalMarks}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {isAbsent && (
          <div className="mt-6 pt-6 border-t border-gray-50">
            <p className="text-gray-400" style={{ fontSize: "13.5px" }}>This student was absent for this test. No marks have been recorded.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Syllabus Covered</h2>
          </div>
          {result.syllabus
            ? <p className="text-gray-600" style={{ fontSize: "13.5px", lineHeight: 1.7 }}>{result.syllabus}</p>
            : <p className="text-gray-300" style={{ fontSize: "13.5px" }}>No syllabus specified.</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Test Details</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Subject",     value: result.subject,          isSubject: true  },
              { label: "Batch",       value: result.batch,            isSubject: false },
              { label: "Date",        value: fmtDate(result.date),    isSubject: false },
              { label: "Total Marks", value: String(result.totalMarks), isSubject: false },
            ].map(({ label, value, isSubject }) => {
              const sc2 = subjectColors[value] ?? null;
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>{label}</span>
                  {isSubject && sc2
                    ? <span className="px-2.5 py-0.5 rounded-full"
                        style={{ fontSize: "12px", fontWeight: 600, color: sc2.color, backgroundColor: sc2.bg }}>{value}</span>
                    : <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Receipt Modal ─────────────────────────────────────────────────────────────

type ReceiptData = {
  receiptNumber: string;
  date: string;
  amount: number;
  paymentMode: string;
  paymentReference: string | null;
  note: string | null;
  collectedBy: string | null;
  studentName: string;
  loginIdentifier: string;
  batchName: string;
  instituteName: string;
};

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const printId = "cleandesk-receipt-printable";

  function handlePrint() {
    const content = document.getElementById(printId);
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=700,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
            .receipt { max-width: 480px; margin: 40px auto; padding: 36px; border: 1px solid #e5e7eb; border-radius: 12px; }
            .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #0d9488; padding-bottom: 20px; }
            .institute { font-size: 20px; font-weight: 800; color: #0d9488; letter-spacing: -0.02em; }
            .receipt-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 6px; }
            .receipt-number { font-size: 15px; font-weight: 700; color: #374151; margin-top: 4px; font-family: monospace; }
            .amount-block { text-align: center; margin: 24px 0; padding: 20px; background: #f0fdfa; border-radius: 10px; border: 1px solid #ccfbf1; }
            .amount-label { font-size: 11px; font-weight: 600; color: #0d9488; text-transform: uppercase; letter-spacing: 0.08em; }
            .amount-value { font-size: 36px; font-weight: 800; color: #0d9488; margin-top: 4px; }
            .rows { margin-top: 24px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .row:last-child { border-bottom: none; }
            .row-label { font-size: 12px; color: #6b7280; font-weight: 500; }
            .row-value { font-size: 13px; color: #111827; font-weight: 600; text-align: right; max-width: 60%; }
            .footer { margin-top: 28px; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 16px; }
            .footer p { font-size: 11px; color: #9ca3af; }
            .mode-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .receipt { border: none; margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  }

  const formattedDate = new Date(receipt.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const formattedAmount = `₹${Number(receipt.amount).toLocaleString("en-IN")}`;
  const formattedMode = receipt.paymentMode.replace(/_/g, " ");

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px]">
        {/* Modal header — not part of print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-gray-900" style={{ fontSize: "16px", fontWeight: 700 }}>Payment Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0d9488", fontSize: "13px", fontWeight: 600 }}
            >
              <Printer size={14} strokeWidth={2.5} />
              Print
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt body — this is what gets printed */}
        <div className="px-6 py-5">
          <div id={printId}>
            <div className="receipt" style={{ maxWidth: "100%", padding: "28px", border: "1px solid #e5e7eb", borderRadius: "12px" }}>

              {/* Header */}
              <div className="header" style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #0d9488", paddingBottom: "18px" }}>
                <p className="institute" style={{ fontSize: "20px", fontWeight: 800, color: "#0d9488", letterSpacing: "-0.02em" }}>
                  {receipt.instituteName}
                </p>
                <p className="receipt-label" style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>
                  Payment Receipt
                </p>
                <p className="receipt-number" style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginTop: "3px", fontFamily: "monospace" }}>
                  {receipt.receiptNumber}
                </p>
              </div>

              {/* Amount */}
              <div style={{ textAlign: "center", margin: "20px 0", padding: "18px", backgroundColor: "#f0fdfa", borderRadius: "10px", border: "1px solid #ccfbf1" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Amount Received
                </p>
                <p style={{ fontSize: "34px", fontWeight: 800, color: "#0d9488", marginTop: "4px" }}>
                  {formattedAmount}
                </p>
              </div>

              {/* Details rows */}
              <div style={{ marginTop: "20px" }}>
                {[
                  { label: "Student Name",   value: receipt.studentName },
                  { label: "Login ID",       value: receipt.loginIdentifier },
                  { label: "Batch",          value: receipt.batchName },
                  { label: "Payment Date",   value: formattedDate },
                  { label: "Payment Mode",   value: formattedMode },
                  ...(receipt.paymentReference ? [{ label: "Reference / UTR", value: receipt.paymentReference }] : []),
                  { label: "Collected By",   value: receipt.collectedBy ?? "—" },
                  ...(receipt.note ? [{ label: "Note", value: receipt.note }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: "13px", color: "#111827", fontWeight: 600, textAlign: "right", maxWidth: "58%" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px dashed #e5e7eb", paddingTop: "16px" }}>
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>Thank you for your payment.</p>
                <p style={{ fontSize: "10px", color: "#d1d5db", marginTop: "4px" }}>This is a computer-generated receipt.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── Fee Status Badge ──────────────────────────────────────────────────────────

function FeeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    UNPAID:         { color: "#dc2626", bg: "#fef2f2",  label: "Unpaid"          },
    PARTIALLY_PAID: { color: "#d97706", bg: "#fffbeb",  label: "Partially Paid"  },
    PAID:           { color: "#16a34a", bg: "#f0fdf4",  label: "Paid"            },
    OVERDUE:        { color: "#9333ea", bg: "#fdf4ff",  label: "Overdue"         },
  };
  const c = config[status] ?? { color: "#6b7280", bg: "#f9fafb", label: status };
  return (
    <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "12px", fontWeight: 700, color: c.color, backgroundColor: c.bg }}>
      {c.label}
    </span>
  );
}

// ─── Record Payment Modal ──────────────────────────────────────────────────────

function RecordPaymentModal({
  feeRecordId,
  onClose,
  onSuccess,
}: {
  feeRecordId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount]     = useState("");
  const [mode, setMode]         = useState("");
  const [date, setDate]         = useState(() => new Date().toISOString().split("T")[0]);
  const [ref, setRef]           = useState("");
  const [note, setNote]         = useState("");
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"];

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Valid amount required.";
    if (!mode) e.mode = "Payment mode required.";
    if (!date) e.date = "Date required.";
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setApiError(null);
    try {
      await recordStudentPaymentApi(feeRecordId, {
        amount: Number(amount),
        payment_date: date,
        payment_mode: mode,
        payment_reference: ref.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setApiError(err.message ?? "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>Record Payment</h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>Enter payment details below.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Amount (₹) *</label>
              <input type="number" min={1} value={amount} onChange={(e) => { setAmount(e.target.value); setErrors((er) => { const c = { ...er }; delete c.amount; return c; }); }}
                placeholder="e.g. 5000"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                style={{ fontSize: "13.5px", borderColor: errors.amount ? "#fca5a5" : undefined }} />
              {errors.amount && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Payment Mode *</label>
              <select value={mode} onChange={(e) => { setMode(e.target.value); setErrors((er) => { const c = { ...er }; delete c.mode; return c; }); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
                style={{ fontSize: "13.5px", color: mode ? "#1f2937" : "#d1d5db", borderColor: errors.mode ? "#fca5a5" : undefined }}>
                <option value="">Select</option>
                {MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
              {errors.mode && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.mode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Payment Date *</label>
              <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setErrors((er) => { const c = { ...er }; delete c.date; return c; }); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
                style={{ fontSize: "13.5px" }} />
              {errors.date && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.date}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Reference / UTR</label>
              <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Optional"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                style={{ fontSize: "13.5px" }} />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Note</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              style={{ fontSize: "13.5px" }} />
          </div>

          {apiError && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <AlertCircle size={14} style={{ color: "#dc2626" }} strokeWidth={2} />
              <p style={{ fontSize: "12.5px", color: "#dc2626" }}>{apiError}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontSize: "13.5px", fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}>
            {submitting ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Override Installment Plan Modal ──────────────────────────────────────────

function EditFeeStructureModal({
  feeRecordId,
  feeStructureLabel,
  currentDiscount,
  currentDiscountReason,
  currentInstallments,
  totalPayable,
  onClose,
  onSuccess,
}: {
  feeRecordId: string;
  feeStructureLabel: string;
  currentDiscount: number;
  currentDiscountReason: string | null;
  currentInstallments: InstallmentRow[];
  totalPayable: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Fee fields
  const [discountAmount, setDiscountAmount] = useState(currentDiscount > 0 ? String(currentDiscount) : "");
  const [discountReason, setDiscountReason] = useState(currentDiscountReason ?? "");

  // Custom installment plan
  const [showInstallments, setShowInstallments] = useState(currentInstallments.length > 0);
  const [rows, setRows] = useState<{ amount: string; due_date: string }[]>(
    currentInstallments.length > 0
      ? currentInstallments.map((i) => ({ amount: String(i.amount), due_date: String(i.due_date).slice(0, 10) }))
      : [{ amount: "", due_date: "" }]
  );

  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Derived: what will the total payable be after the new discount
  // The original total before any discount = totalPayable + currentDiscount
  const originalTotal = totalPayable + currentDiscount;
  const newDiscount = parseFloat(discountAmount) || 0;
  const newTotalPayable = Math.max(0, originalTotal - newDiscount);

  const rowSum = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const sumMismatch = showInstallments && rows.length > 0 && Math.abs(rowSum - newTotalPayable) > 0.01;

  function addRow() { if (rows.length < 12) setRows((r) => [...r, { amount: "", due_date: "" }]); }
  function removeRow(i: number) { setRows((r) => r.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: "amount" | "due_date", val: string) {
    setRows((r) => { const c = [...r]; c[i] = { ...c[i], [field]: val }; return c; });
    setErrors((e) => { const c = { ...e }; delete c[`r_${i}_${field}`]; return c; });
  }

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (newDiscount < 0) e.discountAmount = "Discount cannot be negative.";
    if (newDiscount > originalTotal) e.discountAmount = `Discount cannot exceed ₹${originalTotal.toLocaleString("en-IN")}.`;
    if (newDiscount > 0 && !discountReason.trim()) e.discountReason = "Reason is required when a discount is applied.";

    if (showInstallments) {
      rows.forEach((r, i) => {
        if (!r.amount || isNaN(Number(r.amount)) || Number(r.amount) <= 0) e[`r_${i}_amount`] = "Required";
        if (!r.due_date) e[`r_${i}_due_date`] = "Required";
      });
      if (rows.length === 0) e.installments = "Add at least one installment row.";
      if (sumMismatch) e.installments = `Sum ₹${rowSum.toFixed(2)} must equal total payable ₹${newTotalPayable.toLocaleString("en-IN")}.`;
    }

    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setApiError(null);
    try {
      await updateStudentFeeRecordApi(feeRecordId, {
        discount_amount: newDiscount,
        discount_reason: discountReason.trim() || null,
        installments: showInstallments
          ? rows.map((r, i) => ({ installment_number: i + 1, amount: Number(r.amount), due_date: r.due_date }))
          : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setApiError(err.message ?? "Failed to update fee record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[580px] flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>Edit Fee Structure</h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>{feeStructureLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-6 flex-1 space-y-5">

          {/* Total summary */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
            <div className="flex items-center gap-4 text-gray-500" style={{ fontSize: "13px" }}>
              <span>Original: <span className="text-gray-700 font-semibold">₹{originalTotal.toLocaleString("en-IN")}</span></span>
              {newDiscount > 0 && (
                <>
                  <span className="text-gray-300">−</span>
                  <span>Discount: <span style={{ color: "#dc2626", fontWeight: 600 }}>₹{newDiscount.toLocaleString("en-IN")}</span></span>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-400" style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Payable</p>
              <p style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", color: newDiscount > 0 ? "#0d9488" : "#374151" }}>
                ₹{newTotalPayable.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Discount Amount (₹)</label>
              <input type="number" min={0} value={discountAmount}
                onChange={(e) => { setDiscountAmount(e.target.value); setErrors((er) => { const c = { ...er }; delete c.discountAmount; return c; }); }}
                placeholder="e.g. 2000"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                style={{ fontSize: "13.5px", borderColor: errors.discountAmount ? "#fca5a5" : undefined }} />
              {errors.discountAmount && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.discountAmount}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                Discount Reason {newDiscount > 0 && <span className="text-red-500">*</span>}
              </label>
              <input type="text" value={discountReason}
                onChange={(e) => { setDiscountReason(e.target.value); setErrors((er) => { const c = { ...er }; delete c.discountReason; return c; }); }}
                placeholder="e.g. Merit scholarship"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                style={{ fontSize: "13.5px", borderColor: errors.discountReason ? "#fca5a5" : undefined }} />
              {errors.discountReason && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.discountReason}</p>}
            </div>
          </div>

          {/* Custom Installment Plan toggle */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Custom Installment Plan</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>Override the batch installment schedule for this student.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallments((v) => !v)}
                className="relative inline-flex items-center rounded-full transition-all duration-200 flex-shrink-0 ml-4"
                style={{ width: "44px", height: "24px", backgroundColor: showInstallments ? "#0d9488" : "#e5e7eb" }}>
                <span className="inline-block rounded-full bg-white shadow transition-transform duration-200"
                  style={{ width: "18px", height: "18px", transform: showInstallments ? "translateX(22px)" : "translateX(2px)" }} />
              </button>
            </div>

            {showInstallments && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600" style={{ fontSize: "13px", fontWeight: 600 }}>
                    Installments <span className="text-gray-400 font-normal">(max 12)</span>
                  </p>
                  <button onClick={addRow} disabled={rows.length >= 12}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontSize: "12px", fontWeight: 600 }}>
                    <Plus size={12} strokeWidth={2.5} /> Add Row
                  </button>
                </div>

                {/* Sum indicator */}
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: sumMismatch ? "#fef2f2" : "#f0fdfa", border: `1px solid ${sumMismatch ? "#fecaca" : "#ccfbf1"}` }}>
                  {sumMismatch
                    ? <AlertCircle size={13} style={{ color: "#dc2626" }} strokeWidth={2} />
                    : <CheckCircle2 size={13} style={{ color: "#0d9488" }} strokeWidth={2} />}
                  <span style={{ fontSize: "12px", fontWeight: 600, color: sumMismatch ? "#dc2626" : "#0d9488" }}>
                    Sum: ₹{rowSum.toFixed(2)} / ₹{newTotalPayable.toLocaleString("en-IN")}{!sumMismatch && rowSum > 0 && " ✓"}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid px-4 py-2.5" style={{ gridTemplateColumns: "36px 1fr 1fr 32px", backgroundColor: "#f9fafb", gap: "8px" }}>
                    {["#", "Amount (₹)", "Due Date", ""].map((h) => (
                      <p key={h} className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>{h}</p>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {rows.map((row, i) => (
                      <div key={i} className="grid px-4 py-3 items-start" style={{ gridTemplateColumns: "36px 1fr 1fr 32px", gap: "8px" }}>
                        <span className="text-gray-400 pt-2.5" style={{ fontSize: "12.5px", fontWeight: 600 }}>{i + 1}</span>
                        <div>
                          <input type="number" min={0.01} value={row.amount} onChange={(e) => updateRow(i, "amount", e.target.value)} placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-all"
                            style={{ fontSize: "13px", borderColor: errors[`r_${i}_amount`] ? "#fca5a5" : undefined }} />
                          {errors[`r_${i}_amount`] && <p className="text-red-400 mt-0.5" style={{ fontSize: "11px" }}>{errors[`r_${i}_amount`]}</p>}
                        </div>
                        <div>
                          <input type="date" value={row.due_date} onChange={(e) => updateRow(i, "due_date", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-teal-400 transition-all bg-white"
                            style={{ fontSize: "13px", borderColor: errors[`r_${i}_due_date`] ? "#fca5a5" : undefined }} />
                          {errors[`r_${i}_due_date`] && <p className="text-red-400 mt-0.5" style={{ fontSize: "11px" }}>{errors[`r_${i}_due_date`]}</p>}
                        </div>
                        <button onClick={() => removeRow(i)} className="mt-2 w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all">
                          <X size={13} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {errors.installments && <p className="text-red-500 mt-2" style={{ fontSize: "12px" }}>{errors.installments}</p>}
              </div>
            )}
          </div>

          {apiError && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <AlertCircle size={14} style={{ color: "#dc2626" }} strokeWidth={2} />
              <p style={{ fontSize: "12.5px", color: "#dc2626" }}>{apiError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontSize: "13.5px", fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}>
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fee Tab ───────────────────────────────────────────────────────────────────

function FeeTab({
  studentUserId,
  feeData,
  loading,
  error,
  isAdmin,
  showPaymentModal,
  setShowPaymentModal,
  showEditFeeModal,
setShowEditFeeModal,
  cancellingPaymentId,
  setCancellingPaymentId,
  onRefresh,
}: {
  studentUserId: string;
  feeData: FeeTabData | null | undefined;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  showPaymentModal: boolean;
  setShowPaymentModal: (v: boolean) => void;
  showEditFeeModal: boolean;
  setShowEditFeeModal: (v: boolean) => void;
  cancellingPaymentId: string | null;
  setCancellingPaymentId: (v: string | null) => void;
  onRefresh: () => void;
}) {
  const [cancelReason, setCancelReason]           = useState("");
  const [cancelError, setCancelError]             = useState<string | null>(null);
  const [cancelTarget, setCancelTarget]           = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt]       = useState<PaymentRow | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: "14px" }}>Loading fee data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center gap-3">
        <AlertTriangle size={28} className="text-red-300" strokeWidth={1.5} />
        <p className="text-red-400" style={{ fontSize: "14px" }}>{error}</p>
        <button onClick={onRefresh} className="text-teal-600 underline" style={{ fontSize: "13px" }}>Retry</button>
      </div>
    );
  }

  if (feeData === null) {
    return (
      <div className="py-16 flex flex-col items-center gap-3">
        <DollarSign size={32} className="text-gray-200" strokeWidth={1.5} />
        <p className="text-gray-400" style={{ fontSize: "14px" }}>No fee record found for this student.</p>
        <p className="text-gray-300 text-center" style={{ fontSize: "13px", maxWidth: "360px" }}>
          This student was enrolled before a fee structure was set, or their batch has no active fee structure.
        </p>
      </div>
    );
  }

  if (!feeData) return null;

  const { fee_record: fr, payments } = feeData;
  const isLumpSum = fr.plan_type === "LUMP_SUM";
  const today = new Date().toISOString().split("T")[0];

  async function handleCancel(paymentId: string) {
    if (!cancelReason.trim()) { setCancelError("Cancellation reason is required."); return; }
    setCancellingPaymentId(paymentId);
    setCancelError(null);
    try {
      await cancelStudentPaymentApi(paymentId, cancelReason.trim());
      setCancelTarget(null);
      setCancelReason("");
      onRefresh();
    } catch (err: any) {
      setCancelError(err.message ?? "Failed to cancel payment.");
    } finally {
      setCancellingPaymentId(null);
    }
  }

  return (
    <>
      {/* ── Overview Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-gray-400 uppercase mb-1" style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em" }}>
              Fee Structure
            </p>
            <p className="text-gray-900" style={{ fontSize: "16px", fontWeight: 700 }}>{fr.fee_structure_label}</p>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>{fr.batch_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <FeeStatusBadge status={fr.fee_status} />
            {fr.has_custom_plan && (
              <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                Custom Plan
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-5 border-t border-gray-50">
          {[
            { label: "Total Payable",        value: `₹${Number(fr.total_payable).toLocaleString("en-IN")}`,        color: "#374151" },
            { label: "Total Collected",      value: `₹${Number(fr.total_collected).toLocaleString("en-IN")}`,      color: "#16a34a" },
            { label: "Outstanding Balance",  value: `₹${Number(fr.outstanding_balance).toLocaleString("en-IN")}`,  color: Number(fr.outstanding_balance) > 0 ? "#dc2626" : "#16a34a" },
            { label: "Final Due Date",       value: new Date(fr.final_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), color: fr.final_due_date < today && fr.fee_status !== "PAID" ? "#dc2626" : "#374151" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                {label}
              </p>
              <p style={{ fontSize: "18px", fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</p>
            </div>
          ))}
        </div>

        {fr.discount_amount > 0 && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}>
            <CheckCircle2 size={13} style={{ color: "#0d9488" }} strokeWidth={2.5} />
            <span className="text-teal-700" style={{ fontSize: "12.5px" }}>
              Discount applied: <span style={{ fontWeight: 700 }}>₹{Number(fr.discount_amount).toLocaleString("en-IN")}</span>
              {fr.discount_reason && <span className="text-teal-600"> — {fr.discount_reason}</span>}
            </span>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Record Payment
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowEditFeeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            <Pencil size={14} strokeWidth={2} />
            Edit Fee Structure
          </button>
        )}
      </div>

      {/* ── Installment Schedule ── */}
      {!isLumpSum && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: "#f9fafb" }}>
            <ClipboardList size={14} className="text-teal-500" />
            <h3 className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>Installment Schedule</h3>
            {fr.has_custom_plan && (
              <span className="ml-1 px-2 py-0.5 rounded-full" style={{ fontSize: "10.5px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                Custom Plan
              </span>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["#", "Due Date", "Amount Due", "Status"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fr.has_custom_plan && fr.installments && fr.installments.length > 0 ? (
                fr.installments.map((inst) => {
                  const isOverdue = inst.due_date < today;
                  return (
                    <tr key={inst.id} className="border-t border-gray-50">
                      <td className="px-5 py-3.5 text-gray-600" style={{ fontSize: "13px", fontWeight: 600 }}>
                        #{inst.installment_number}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600" style={{ fontSize: "13px" }}>
                        {new Date(inst.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {isOverdue && fr.fee_status !== "PAID" && (
                          <span className="ml-2 px-1.5 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", backgroundColor: "#fef2f2" }}>Overdue</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5" style={{ fontSize: "13.5px", fontWeight: 700, color: "#374151" }}>
                        ₹{Number(inst.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400" style={{ fontSize: "12px" }}>—</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center">
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>
                      {fr.has_custom_plan
                        ? "Loading installment schedule…"
                        : "No custom installment plan. Use \"Edit Fee Structure\" to create one."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-teal-500" />
            <h3 className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>Payment History</h3>
          </div>
          <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{payments.length} record{payments.length !== 1 ? "s" : ""}</span>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-300" style={{ fontSize: "14px" }}>No payments recorded yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Receipt", "Date", "Amount", "Mode", "Collected By", "Reference", ""].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-gray-50" style={{ opacity: p.is_cancelled ? 0.5 : 1 }}>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{p.receipt_number}</span>
                    {p.is_cancelled && (
                      <span className="ml-2 px-1.5 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", backgroundColor: "#fef2f2" }}>
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-600" style={{ fontSize: "13px" }}>
                      {new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: p.is_cancelled ? "#9ca3af" : "#16a34a" }}>
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}>
                      {p.payment_mode.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-500" style={{ fontSize: "13px" }}>{p.recorded_by_name ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-400 font-mono" style={{ fontSize: "12px" }}>{p.payment_reference ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingReceipt(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                        style={{ fontSize: "12px", fontWeight: 600 }}
                      >
                        <Printer size={12} strokeWidth={2} />
                        Receipt
                      </button>
                    {!p.is_cancelled && (
                      cancelTarget === p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cancelReason}
                            onChange={(e) => { setCancelReason(e.target.value); setCancelError(null); }}
                            placeholder="Reason…"
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-all"
                            style={{ fontSize: "12px", width: "140px" }}
                          />
                          <button
                            onClick={() => handleCancel(p.id)}
                            disabled={cancellingPaymentId === p.id}
                            className="px-2.5 py-1.5 rounded-lg text-white hover:opacity-90 transition-all disabled:opacity-50"
                            style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#dc2626" }}
                          >
                            {cancellingPaymentId === p.id ? "…" : "Confirm"}
                          </button>
                          <button onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelError(null); }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all">
                            <X size={13} strokeWidth={2} />
                          </button>
                          {cancelError && <p className="text-red-500" style={{ fontSize: "11px" }}>{cancelError}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelTarget(p.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all"
                          style={{ fontSize: "12px", fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                      )
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ── */}
      {showPaymentModal && (
        <RecordPaymentModal
          feeRecordId={fr.id}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { setShowPaymentModal(false); onRefresh(); }}
        />
      )}
      {showEditFeeModal && (
        <EditFeeStructureModal
          feeRecordId={fr.id}
          feeStructureLabel={fr.fee_structure_label}
          currentDiscount={Number(fr.discount_amount)}
          currentDiscountReason={fr.discount_reason}
          currentInstallments={fr.installments ?? []}
          totalPayable={Number(fr.total_payable)}
          onClose={() => setShowEditFeeModal(false)}
          onSuccess={() => { setShowEditFeeModal(false); onRefresh(); }}
        />
      )}
      {viewingReceipt && (
        <ReceiptModal
          receipt={{
            receiptNumber:    viewingReceipt.receipt_number,
            date:             viewingReceipt.payment_date,
            amount:           Number(viewingReceipt.amount),
            paymentMode:      viewingReceipt.payment_mode,
            paymentReference: viewingReceipt.payment_reference,
            note:             viewingReceipt.note,
            collectedBy:      viewingReceipt.recorded_by_name,
            studentName:      fr.student_name,
            loginIdentifier:  fr.login_identifier,
            batchName:        fr.batch_name,
            instituteName:    fr.institute_name,
          }}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </>
  );
}

export function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate      = useNavigate();
  const location      = useLocation();
  const searchParams  = new URLSearchParams(location.search);
  const fromFee       = searchParams.get("from") === "fee-management";
  const feeBatchId    = searchParams.get("batchId") ?? null;
  const feeBatchName  = searchParams.get("batchName") ?? null;

  const [studentName, setStudentName]     = useState<string>("Student");
  const [studentMeta, setStudentMeta]     = useState<StudentRow | null>(null);
  const [apiData, setApiData]             = useState<StudentResultsData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState<string | null>(null);

  const initialTab = searchParams.get("tab") === "fee" ? "fee" : "results";
const [activeTab, setActiveTab] = useState<"results" | "fee">(initialTab);

  const [selectedTestId, setSelectedTestId]     = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject]   = useState<string | null>(null);
  const [search, setSearch]                     = useState("");
  const [subjectFilter, setSubjectFilter]       = useState("All");

  // Fee tab data
  const [feeData, setFeeData]         = useState<FeeTabData | null | undefined>(undefined);
  const [loadingFee, setLoadingFee]   = useState(false);
  const [feeError, setFeeError]       = useState<string | null>(null);

  // Record payment modal
  const [showPaymentModal, setShowPaymentModal]     = useState(false);
  const [showEditFeeModal, setShowEditFeeModal]     = useState(false);
  // Cancel payment
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null);

  const session = getSession();
  const isAdmin = session?.payload.role_id === ROLES.ADMIN;

  useEffect(() => {
    if (activeTab !== "fee" || !studentId) return;
    if (feeData !== undefined) return; // already loaded
    setLoadingFee(true);
    setFeeError(null);
    getStudentFeeTabApi(studentId)
      .then(setFeeData)
      .catch((e: any) => setFeeError(e.message ?? "Failed to load fee data"))
      .finally(() => setLoadingFee(false));
  }, [activeTab, studentId]);


  useEffect(() => {
    if (!studentId) { setFetchError("No student ID provided"); setLoading(false); return; }

    Promise.all([
      fetchStudentsApi({ limit: 1000 }),
      fetchStudentResultsById(studentId),
    ])
      .then(([listRes, results]) => {
        const match = listRes.students.find((s) => s.id === studentId);
        if (match) {
          setStudentName(match.name ?? "Student");
          setStudentMeta(match);
        }
        setApiData(results);
      })
      .catch((e: any) => setFetchError(e.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-8 max-w-[1060px] mx-auto flex items-center justify-center h-64">
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading student profile…</p>
      </div>
    );
  }

  if (fetchError || !apiData) {
    return (
      <div className="p-8 max-w-[1060px] mx-auto flex items-center justify-center h-64">
        <p className="text-red-400" style={{ fontSize: "14px" }}>{fetchError ?? "Failed to load profile."}</p>
      </div>
    );
  }

  const myResults: StudentResult[] = apiData.all_results.map(mapApiResult);

  // ── Sub-views ──
  if (selectedTestId !== null) {
    const result = myResults.find((r) => r.testId === selectedTestId);
    if (result) return <ResultDetail result={result} studentName={studentName} onBack={() => setSelectedTestId(null)} />;
  }
  if (selectedSubject !== null) {
    const subjectResults = myResults.filter((r) => r.subject === selectedSubject);
    return <SubjectDetail subject={selectedSubject} results={subjectResults} studentName={studentName} onBack={() => setSelectedSubject(null)} />;
  }

  // ── Derived stats ──
  const attemptedResults = myResults.filter((r) => r.score !== null);
  const totalTests       = apiData.total_tested;
  const overallPct       = apiData.overall_pct ?? 0;
  const totalScored      = attemptedResults.reduce((s, r) => s + (r.score ?? 0), 0);
  const totalPossible    = attemptedResults.reduce((s, r) => s + r.totalMarks, 0);
  const passedCount      = attemptedResults.filter((r) => pct(r.score!, r.totalMarks) >= 35).length;

  const sortedByPct = apiData.subject_summaries.map((s) => ({
    name: s.subject, pct: s.avg_pct, count: s.attempted_count, totalTests: s.total_count,
  }));
  const bestSubject = apiData.best_subject ? { name: apiData.best_subject.subject, pct: apiData.best_subject.avg_pct } : null;
  const weakSubject = apiData.weak_subject ? { name: apiData.weak_subject.subject, pct: apiData.weak_subject.avg_pct } : null;

  const trendData = apiData.trend_data.map((r) => ({
    label: fmtShortDate(r.test_date), percentage: r.percentage,
    testName: r.test_name, score: r.score, totalMarks: r.total_marks, date: r.test_date,
  }));

  const allSubjects = ["All", ...Array.from(new Set(myResults.map((r) => r.subject)))];
  const filtered    = myResults.filter((r) => {
    const matchesSubject = subjectFilter === "All" || r.subject === subjectFilter;
    const matchesSearch  = r.testName.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const initials = getInitials(studentName);
  const bc       = studentMeta ? getBoardColor((studentMeta as any).board ?? "") : { color: "#0d9488", bg: "#f0fdfa" };

  return (
    <div className="p-8 max-w-[1060px] mx-auto">

      {/* ── Back ── */}
      <button
        onClick={() => {
          if (fromFee && feeBatchId && feeBatchName) {
            // Return to fee management with batch drill-down state
            const feeMgmtPath = location.pathname.startsWith("/management")
              ? "/management/fee-management"
              : "/fee-management";
            navigate(feeMgmtPath, {
              state: { drillDown: { batchId: feeBatchId, batchName: feeBatchName } },
            });
          } else {
            navigate("/students");
          }
        }}
        className="flex items-center gap-2 text-gray-400 hover:text-teal-600 transition-colors mb-6"
        style={{ fontSize: "13.5px", fontWeight: 600 }}
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        {fromFee && feeBatchName ? `Back to ${feeBatchName}` : "Back to Students"}
      </button>

      {/* ── Hero card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fdfa" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#0d9488" }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>{studentName}</h1>
              <span className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: "11.5px", fontWeight: 600, color: "#0d9488", backgroundColor: "#f0fdfa" }}>
                Student
              </span>
              {studentMeta && (
                <span className="px-2.5 py-0.5 rounded-full"
                  style={{ fontSize: "11.5px", fontWeight: 600,
                    color: studentMeta.is_active ? "#16a34a" : "#9ca3af",
                    backgroundColor: studentMeta.is_active ? "#f0fdf4" : "#f9fafb" }}>
                  {studentMeta.is_active ? "Active" : "Inactive"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-5 mt-2 flex-wrap">
              {studentMeta?.mobile && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Phone size={13} strokeWidth={2} className="text-gray-400" />
                  {studentMeta.mobile}
                </div>
              )}
              {studentMeta?.batch && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Users2 size={13} strokeWidth={2} className="text-gray-400" />
                  {studentMeta.batch}
                </div>
              )}
              {studentMeta && (
                <div className="flex items-center gap-1.5 text-gray-400" style={{ fontSize: "13px" }}>
                  <CalendarDays size={13} strokeWidth={2} />
                  Joined {new Date(studentMeta.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: "#f3f4f6" }}>
        {(["results", "fee"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-md capitalize transition-all"
            style={{
              fontSize: "13.5px",
              fontWeight: 600,
              backgroundColor: activeTab === tab ? "white" : "transparent",
              color: activeTab === tab ? "#111827" : "#9ca3af",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab === "results" ? "Results & Performance" : "Fee"}
          </button>
        ))}
      </div>

      {/* ── Fee Tab ── */}
      {activeTab === "fee" && (
        <FeeTab
          studentUserId={studentId!}
          feeData={feeData}
          loading={loadingFee}
          error={feeError}
          isAdmin={isAdmin}
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          showEditFeeModal={showEditFeeModal}
          setShowEditFeeModal={setShowEditFeeModal}
          cancellingPaymentId={cancellingPaymentId}
          setCancellingPaymentId={setCancellingPaymentId}
          onRefresh={() => {
            setFeeData(undefined);
            setLoadingFee(true);
            setFeeError(null);
            getStudentFeeTabApi(studentId!)
              .then(setFeeData)
              .catch((e: any) => setFeeError(e.message ?? "Failed to load fee data"))
              .finally(() => setLoadingFee(false));
          }}
        />
      )}

      {activeTab === "results" && (<>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Overall</p>
          </div>
          <p className="text-gray-900 mb-2" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{overallPct}%</p>
          <div className="w-full h-1.5 rounded-full mb-2" style={{ backgroundColor: "#f3f4f6" }}>
            <div className="h-full rounded-full" style={{ width: `${overallPct}%`, backgroundColor: barColor(overallPct) }} />
          </div>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{totalScored} / {totalPossible} marks</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <ClipboardList size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Tests</p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{totalTests}</p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{passedCount} passed</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Pass Rate</p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {attemptedResults.length > 0 ? Math.round((passedCount / attemptedResults.length) * 100) : 0}%
          </p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{passedCount} of {totalTests} attempted</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-teal-100 transition-all"
          onClick={() => bestSubject && setSelectedSubject(bestSubject.name)}>
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} className="text-amber-400" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Best Subject</p>
          </div>
          {bestSubject ? (
            <>
              <p className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>{bestSubject.name}</p>
              <p className="text-gray-400" style={{ fontSize: "11.5px" }}>Avg: {bestSubject.pct}%</p>
              <span style={{ fontSize: "11px", color: "#0d9488", fontWeight: 600 }}>View →</span>
            </>
          ) : <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>}
        </div>

        <div className="rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
          style={{ backgroundColor: weakSubject && weakSubject.pct < 50 ? "#fff7ed" : "white",
            borderColor: weakSubject && weakSubject.pct < 50 ? "#fed7aa" : "#f3f4f6" }}
          onClick={() => weakSubject && setSelectedSubject(weakSubject.name)}>
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart2 size={13} style={{ color: weakSubject && weakSubject.pct < 50 ? "#ea580c" : "#9ca3af" }} />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Weak Subject</p>
          </div>
          {weakSubject ? (
            <>
              <p className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>{weakSubject.name}</p>
              <p style={{ fontSize: "11.5px", color: weakSubject.pct < 50 ? "#c2410c" : "#6b7280", marginTop: "2px" }}>Avg: {weakSubject.pct}%</p>
              <span style={{ fontSize: "11px", color: weakSubject.pct < 50 ? "#ea580c" : "#0d9488", fontWeight: 600 }}>View →</span>
            </>
          ) : <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>}
        </div>
      </div>

      {/* ── Trend + Subjects ── */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-teal-500" />
              <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Score Trend</h2>
            </div>
            <span className="text-gray-400" style={{ fontSize: "12px" }}>% per test, date-ordered</span>
          </div>
          {trendData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrendTooltip />} />
                <ReferenceLine y={35} stroke="#fca5a5" strokeDasharray="4 4"
                  label={{ value: "Pass 35%", position: "right", fontSize: 10, fill: "#fca5a5" }} />
                <Line type="monotone" dataKey="percentage" stroke="#0d9488" strokeWidth={2.5}
                  dot={<TrendDot />} activeDot={{ r: 6, fill: "#0d9488", stroke: "white", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300" style={{ fontSize: "14px" }}>
              Not enough data for a trend yet.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Subjects</h2>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "230px" }}>
            {sortedByPct.map((s) => {
              const sc = subjectColors[s.name] ?? { color: "#0d9488", bg: "#f0fdfa" };
              return (
                <button key={s.name} onClick={() => setSelectedSubject(s.name)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors text-left w-full group">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sc.bg }}>
                    <BookOpen size={13} style={{ color: sc.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700 truncate" style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: barColor(s.pct), flexShrink: 0, marginLeft: "8px" }}>{s.pct}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: barColor(s.pct) }} />
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-400 flex-shrink-0 transition-colors" />
                </button>
              );
            })}
            {sortedByPct.length === 0 && (
              <p className="text-gray-300 text-center py-8" style={{ fontSize: "13px" }}>No subjects yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test name or subject…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }} />
        </div>
        <div className="relative">
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-100 rounded-xl pl-4 pr-8 py-2.5 text-gray-600 focus:outline-none focus:border-teal-300 shadow-sm cursor-pointer"
            style={{ fontSize: "13px", fontWeight: 500 }}>
            {allSubjects.map((s) => <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>)}
          </select>
          <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Results table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Test", "Subject", "Date", "Score", "Percentage", "Grade", "Result"].map((col) => (
                <th key={col} className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>{col.toUpperCase()}</th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((result) => {
              const sc      = subjectColors[result.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
              const isAbsent    = result.score === null;
              const percentage  = isAbsent ? null : pct(result.score!, result.totalMarks);
              const grade       = percentage !== null ? gradeLabel(percentage) : null;
              const passed      = percentage !== null && percentage >= 35;
              return (
                <tr key={result.testId} onClick={() => setSelectedTestId(result.testId)}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                        <ClipboardList size={14} style={{ color: sc.color }} strokeWidth={2} />
                      </div>
                      <span className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{result.testName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedSubject(result.subject); }}
                      className="px-2.5 py-0.5 rounded-full hover:opacity-75 transition-opacity"
                      style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
                      {result.subject}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-600" style={{ fontSize: "13px" }}>{fmtDate(result.date, true)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {isAbsent ? <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                      : <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                          {result.score}<span className="text-gray-400" style={{ fontSize: "12px", fontWeight: 400 }}> / {result.totalMarks}</span>
                        </span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {isAbsent ? <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                      : <div className="flex items-center gap-2" style={{ minWidth: "100px" }}>
                          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                            <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: barColor(percentage!) }} />
                          </div>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: barColor(percentage!), minWidth: "36px" }}>{percentage}%</span>
                        </div>}
                  </td>
                  <td className="px-5 py-3.5">
                    {isAbsent ? <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                      : grade ? <span className="px-2.5 py-0.5 rounded-full"
                          style={{ fontSize: "12px", fontWeight: 700, color: grade.color, backgroundColor: grade.bg }}>{grade.label}</span>
                        : null}
                  </td>
                  <td className="px-5 py-3.5">
                    {isAbsent
                      ? <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f3f4f6" }}>Absent</span>
                      : <span className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}>
                          {passed ? "Pass" : "Fail"}
                        </span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center">
                <p className="text-gray-300" style={{ fontSize: "14px" }}>No results found.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>)}
    </div>
  );
}