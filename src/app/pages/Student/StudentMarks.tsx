// src/app/pages/Student/StudentMarks.tsx

import { useState, useEffect } from "react";
import {
  fetchStudentResults,
  type StudentResultsData,
  type ResultRow as ApiResultRow,
} from "../../../Lib/api/student-results";
import {
  ArrowLeft,
  Award,
  ClipboardList,
  Calendar,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  BarChart2,
  Target,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  BarChart,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

// Internal UI type — maps directly from backend ApiResultRow
type StudentResult = {
  testId:    string;
  testName:  string;
  subject:   string;
  batch:     string;
  date:      string;          // YYYY-MM-DD — test_date from backend, NOT upload date
  score:     number | null;   // null = no marks recorded
  totalMarks: number;
  syllabus:  string;
};

function mapApiResult(r: ApiResultRow): StudentResult {
  return {
    testId:    r.test_id,
    testName:  r.test_name,
    subject:   r.subject,
    batch:     r.batch_name,
    date:      r.test_date,
    score:     r.score,
    totalMarks: r.total_marks,
    syllabus:  r.syllabus_text ?? "",
  };
}

// ─── Subject colour map ────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pct(score: number, total: number) {
  return Math.round((score / total) * 100);
}

function gradeLabel(p: number): { label: string; color: string; bg: string } {
  if (p >= 90) return { label: "A+", color: "#16a34a", bg: "#f0fdf4" };
  if (p >= 75) return { label: "A",  color: "#0d9488", bg: "#f0fdfa" };
  if (p >= 60) return { label: "B",  color: "#2563eb", bg: "#eff6ff" };
  if (p >= 45) return { label: "C",  color: "#d97706", bg: "#fffbeb" };
  if (p >= 35) return { label: "D",  color: "#ea580c", bg: "#fff7ed" };
  return { label: "F", color: "#dc2626", bg: "#fef2f2" };
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
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ─── Custom Tooltip for Trend Chart ───────────────────────────────────────────

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const g = gradeLabel(d.percentage);
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-lg p-3"
      style={{ minWidth: "160px" }}
    >
      <p className="text-gray-800 mb-1" style={{ fontSize: "13px", fontWeight: 700 }}>
        {d.testName}
      </p>
      <p className="text-gray-400 mb-2" style={{ fontSize: "11px" }}>
        {fmtDate(d.date, true)}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span style={{ fontSize: "13px", fontWeight: 700, color: barColor(d.percentage) }}>
          {d.percentage}%
        </span>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ fontSize: "11px", fontWeight: 700, color: g.color, backgroundColor: g.bg }}
        >
          {g.label}
        </span>
      </div>
      <p className="text-gray-400 mt-1" style={{ fontSize: "11px" }}>
        {d.score} / {d.totalMarks} marks
      </p>
    </div>
  );
}

// ─── Subject Detail Screen ─────────────────────────────────────────────────────

function SubjectDetail({
  subject,
  results,
  onBack,
}: {
  subject: string;
  results: StudentResult[];
  onBack: () => void;
}) {
  const sc = subjectColors[subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const attempted = results.filter((r) => r.score !== null);

  // Sorted by date ascending for chart
  const sortedAsc = [...attempted].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  // Sorted by date descending for table
  const sortedDesc = [...results].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Stats
  const avgPct =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((s, r) => s + pct(r.score!, r.totalMarks), 0) / attempted.length
        )
      : 0;

  const highestEntry = [...attempted].sort(
    (a, b) => pct(b.score!, b.totalMarks) - pct(a.score!, a.totalMarks)
  )[0];
  const highestPct = highestEntry ? pct(highestEntry.score!, highestEntry.totalMarks) : null;

  const lastAttempted = sortedDesc.find((r) => r.score !== null);
  const lastPct = lastAttempted ? pct(lastAttempted.score!, lastAttempted.totalMarks) : null;

  const passedCount = attempted.filter((r) => pct(r.score!, r.totalMarks) >= 35).length;

  // Chart data
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
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to My Marks
      </button>

      {/* Subject hero */}
      <div
        className="rounded-2xl border shadow-sm p-7 mb-6 flex items-center justify-between"
        style={{ backgroundColor: sc.bg, borderColor: `${sc.color}22` }}
      >
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            <BookOpen size={26} style={{ color: sc.color }} strokeWidth={1.8} />
          </div>
          <div>
            <p className="uppercase mb-1" style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", color: sc.color, opacity: 0.7 }}>
              Subject Performance
            </p>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: sc.color, letterSpacing: "-0.02em" }}>
              {subject}
            </h1>
            <p style={{ fontSize: "13px", color: sc.color, opacity: 0.65, marginTop: "2px" }}>
              {results.length} test{results.length !== 1 ? "s" : ""} · {attempted.length} attempted
            </p>
          </div>
        </div>
        {avgPct > 0 && (
          <div className="text-right">
            <p style={{ fontSize: "44px", fontWeight: 800, color: sc.color, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {avgPct}%
            </p>
            <p style={{ fontSize: "12px", color: sc.color, opacity: 0.65, marginTop: "4px" }}>
              Overall Average
            </p>
          </div>
        )}
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Highest Score */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} className="text-amber-400" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>
              Highest Score
            </p>
          </div>
          {highestEntry && highestPct !== null ? (
            <>
              <p className="text-gray-900 mb-1" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {highestPct}%
              </p>
              <p className="text-gray-400" style={{ fontSize: "11.5px", lineHeight: 1.5 }}>
                {highestEntry.score}/{highestEntry.totalMarks} · {fmtDate(highestEntry.date, true)}
              </p>
              <p className="text-gray-500 mt-1 truncate" style={{ fontSize: "11px" }}>
                {highestEntry.testName}
              </p>
            </>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>
          )}
        </div>

        {/* Last Test */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>
              Last Test
            </p>
          </div>
          {lastAttempted && lastPct !== null ? (
            <>
              <p
                className="mb-1"
                style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: barColor(lastPct) }}
              >
                {lastPct}%
              </p>
              <p className="text-gray-400" style={{ fontSize: "11.5px", lineHeight: 1.5 }}>
                {lastAttempted.score}/{lastAttempted.totalMarks} · {fmtDate(lastAttempted.date, true)}
              </p>
              <p className="text-gray-500 mt-1 truncate" style={{ fontSize: "11px" }}>
                {lastAttempted.testName}
              </p>
            </>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>
          )}
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>
              Pass Rate
            </p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {attempted.length > 0 ? Math.round((passedCount / attempted.length) * 100) : 0}%
          </p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {passedCount} of {attempted.length} passed
          </p>
        </div>

        {/* Tests Total */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <ClipboardList size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>
              Tests
            </p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {results.length}
          </p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {attempted.length} attempted · {results.length - attempted.length} absent
          </p>
        </div>
      </div>

      {/* Score trend chart */}
      {chartData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={15} style={{ color: sc.color }} />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
              Score Trend
            </h2>
            <span className="ml-auto text-gray-400" style={{ fontSize: "12px" }}>
              Percentage (%) per test
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: `${sc.color}10` }} />
              <ReferenceLine y={35} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: "Pass", position: "right", fontSize: 10, fill: "#fca5a5" }} />
              <Bar
                dataKey="percentage"
                fill={sc.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Test-wise table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <ClipboardList size={15} className="text-teal-500" />
          <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
            All Tests in {subject}
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Test", "Date", "Score", "Percentage", "Grade", "Result"].map((col) => (
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
            {sortedDesc.map((r) => {
              const isAbsent = r.score === null;
              const p = isAbsent ? null : pct(r.score!, r.totalMarks);
              const grade = p !== null ? gradeLabel(p) : null;
              const passed = p !== null && p >= 35;
              const isHighest =
                !isAbsent && highestEntry && r.testId === highestEntry.testId;

              return (
                <tr
                  key={r.testId}
                  className="border-t border-gray-50"
                  style={isHighest ? { backgroundColor: "#fffbeb" } : undefined}
                >
                  {/* Test name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                        {r.testName}
                      </span>
                      {isHighest && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: "10px", fontWeight: 700, color: "#d97706", backgroundColor: "#fef3c7" }}
                        >
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-600" style={{ fontSize: "13px" }}>
                        {fmtDate(r.date, true)}
                      </span>
                    </div>
                  </td>
                  {/* Score */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : (
                      <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                        {r.score}
                        <span className="text-gray-400" style={{ fontSize: "12px", fontWeight: 400 }}> / {r.totalMarks}</span>
                      </span>
                    )}
                  </td>
                  {/* Percentage bar */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : (
                      <div className="flex items-center gap-2" style={{ minWidth: "110px" }}>
                        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${p}%`, backgroundColor: barColor(p!) }}
                          />
                        </div>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: barColor(p!), minWidth: "36px" }}>
                          {p}%
                        </span>
                      </div>
                    )}
                  </td>
                  {/* Grade */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : grade ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full"
                        style={{ fontSize: "12px", fontWeight: 700, color: grade.color, backgroundColor: grade.bg }}
                      >
                        {grade.label}
                      </span>
                    ) : null}
                  </td>
                  {/* Pass/Fail/Absent */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f3f4f6" }}>
                        Absent
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}
                      >
                        {passed ? "Pass" : "Fail"}
                      </span>
                    )}
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

// ─── Result Detail Screen ──────────────────────────────────────────────────────

function ResultDetail({
  result,
  onBack,
}: {
  result: StudentResult;
  onBack: () => void;
}) {
  const sc = subjectColors[result.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const isAbsent = result.score === null;
  const percentage = isAbsent ? null : pct(result.score!, result.totalMarks);
  const grade = percentage !== null ? gradeLabel(percentage) : null;
  const passed = percentage !== null && percentage >= 35;

  return (
    <div className="p-8 max-w-[760px] mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to My Marks
      </button>

      {/* Result hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: sc.bg }}
            >
              <ClipboardList size={24} style={{ color: sc.color }} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-gray-900 mb-1" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {result.testName}
              </h1>
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
                {result.batch} · {fmtDate(result.date)}
              </p>
            </div>
          </div>

          {/* Grade badge */}
          {!isAbsent && grade && (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
                style={{ backgroundColor: grade.bg }}
              >
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

        {/* Score display */}
        {!isAbsent && percentage !== null && (
          <div className="mt-8 pt-6 border-t border-gray-50">
            <div className="flex items-end gap-6 mb-5">
              <div>
                <p className="text-gray-400 mb-1" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Your Score
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-900" style={{ fontSize: "48px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {result.score}
                  </span>
                  <span className="text-gray-400" style={{ fontSize: "20px", fontWeight: 400 }}>
                    / {result.totalMarks}
                  </span>
                </div>
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: "12px", fontWeight: 600, color: barColor(percentage) }}>{percentage}%</span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}
                  >
                    {passed ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, backgroundColor: barColor(percentage) }}
                  />
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
            <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
              You were absent for this test. No marks have been recorded.
            </p>
          </div>
        )}
      </div>

      {/* Test details */}
      <div className="grid grid-cols-2 gap-5">
        {/* Syllabus */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Syllabus Covered</h2>
          </div>
          {result.syllabus ? (
            <p className="text-gray-600" style={{ fontSize: "13.5px", lineHeight: 1.7 }}>{result.syllabus}</p>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13.5px" }}>No syllabus specified.</p>
          )}
        </div>

        {/* Quick info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Test Details</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Subject",     value: result.subject,   isSubject: true },
              { label: "Batch",       value: result.batch,     isSubject: false },
              { label: "Date",        value: fmtDate(result.date), isSubject: false },
              { label: "Total Marks", value: String(result.totalMarks), isSubject: false },
            ].map(({ label, value, isSubject }) => {
              const sc2 = subjectColors[value] ?? null;
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>{label}</span>
                  {isSubject && sc2 ? (
                    <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "12px", fontWeight: 600, color: sc2.color, backgroundColor: sc2.bg }}>
                      {value}
                    </span>
                  ) : (
                    <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score Trend Custom Dot ────────────────────────────────────────────────────

function TrendDot(props: any) {
  const { cx, cy, payload } = props;
  const color = barColor(payload.percentage);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="white"
      strokeWidth={2}
    />
  );
}

// ─── Main Student Marks Page ───────────────────────────────────────────────────

export function StudentMarks() {
  const [selectedTestId, setSelectedTestId]   = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [search, setSearch]                   = useState("");
  const [subjectFilter, setSubjectFilter]     = useState("All");

  // ── Data fetching ──
  const [apiData, setApiData]   = useState<StudentResultsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStudentResults()
      .then((data) => { if (!cancelled) { setApiData(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setFetchError(err.message ?? "Failed to load results"); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="p-8 max-w-[1060px] mx-auto flex items-center justify-center h-64">
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading your results…</p>
      </div>
    );
  }

  if (fetchError || !apiData) {
    return (
      <div className="p-8 max-w-[1060px] mx-auto flex items-center justify-center h-64">
        <p className="text-red-400" style={{ fontSize: "14px" }}>{fetchError ?? "Failed to load results."}</p>
      </div>
    );
  }

  // ── Map API rows to UI type ──
  const myResults: StudentResult[] = apiData.all_results.map(mapApiResult);

  // ── View: Test Detail ──
  if (selectedTestId !== null) {
    const result = myResults.find((r) => r.testId === selectedTestId);
    if (result) {
      return <ResultDetail result={result} onBack={() => setSelectedTestId(null)} />;
    }
  }

  // ── View: Subject Detail ──
  if (selectedSubject !== null) {
    const subjectResults = myResults.filter((r) => r.subject === selectedSubject);
    return (
      <SubjectDetail
        subject={selectedSubject}
        results={subjectResults}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  // ── Summary stats — use pre-computed values from backend ──
  const attemptedResults = myResults.filter((r) => r.score !== null);
  const totalTests       = apiData.total_tested;
  const overallPct       = apiData.overall_pct ?? 0;

  const totalScored   = attemptedResults.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const totalPossible = attemptedResults.reduce((sum, r) => sum + r.totalMarks, 0);
  const passedCount   = attemptedResults.filter((r) => pct(r.score!, r.totalMarks) >= 35).length;

  // ── Subject summaries — from backend (already sorted highest-first) ──
  const sortedByPct = apiData.subject_summaries.map((s) => ({
    name:       s.subject,
    pct:        s.avg_pct,
    count:      s.attempted_count,
    totalTests: s.total_count,
  }));
  const bestSubject = apiData.best_subject
    ? { name: apiData.best_subject.subject, pct: apiData.best_subject.avg_pct }
    : null;
  const weakSubject = apiData.weak_subject
    ? { name: apiData.weak_subject.subject, pct: apiData.weak_subject.avg_pct }
    : null;

  // ── Score trend data — from backend (already sorted date-ascending) ──
  const trendData = apiData.trend_data.map((r) => ({
    label:      fmtShortDate(r.test_date),
    percentage: r.percentage,
    testName:   r.test_name,
    score:      r.score,
    totalMarks: r.total_marks,
    date:       r.test_date,
  }));

  // ── Unique subjects for filter dropdown ──
  const allSubjects = ["All", ...Array.from(new Set(myResults.map((r) => r.subject)))];

  // ── Filtered list (client-side search + subject filter) ──
  const filtered = myResults.filter((r) => {
    const matchesSubject = subjectFilter === "All" || r.subject === subjectFilter;
    const matchesSearch  =
      r.testName.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="p-8 max-w-[1060px] mx-auto">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          My Results
        </h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
          Performance analytics across all your subjects and tests
        </p>
      </div>

      {/* ── Row 1: Summary Cards (5 cards) ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">

        {/* Overall */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Overall</p>
          </div>
          <p className="text-gray-900 mb-2" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {overallPct}%
          </p>
          <div className="w-full h-1.5 rounded-full mb-2" style={{ backgroundColor: "#f3f4f6" }}>
            <div className="h-full rounded-full" style={{ width: `${overallPct}%`, backgroundColor: barColor(overallPct) }} />
          </div>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {totalScored} / {totalPossible} marks
          </p>
        </div>

        {/* Tests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <ClipboardList size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Tests</p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {totalTests}
          </p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {passedCount} passed
          </p>
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={13} className="text-teal-500" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Pass Rate</p>
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {attemptedResults.length > 0 ? Math.round((passedCount / attemptedResults.length) * 100) : 0}%
          </p>
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            {passedCount} of {totalTests} attempted
          </p>
        </div>

        {/* Best Subject */}
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-teal-100 transition-all"
          onClick={() => bestSubject && setSelectedSubject(bestSubject.name)}
          title="View subject details"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} className="text-amber-400" />
            <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em" }}>Best Subject</p>
          </div>
          {bestSubject ? (
            <>
              <p className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
                {bestSubject.name}
              </p>
              <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
                Avg: {bestSubject.pct}%
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span style={{ fontSize: "11px", color: "#0d9488", fontWeight: 600 }}>View →</span>
              </div>
            </>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>
          )}
        </div>

        {/* Weak Subject */}
        <div
          className="rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
          style={{
            backgroundColor: weakSubject && weakSubject.pct < 50 ? "#fff7ed" : "white",
            borderColor: weakSubject && weakSubject.pct < 50 ? "#fed7aa" : "#f3f4f6",
          }}
          onClick={() => weakSubject && setSelectedSubject(weakSubject.name)}
          title="View subject details"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle size={13} style={{ color: weakSubject && weakSubject.pct < 50 ? "#ea580c" : "#9ca3af" }} />
            <p
              className="uppercase"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                color: weakSubject && weakSubject.pct < 50 ? "#ea580c" : "#9ca3af",
              }}
            >
              Needs Work
            </p>
          </div>
          {weakSubject ? (
            <>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: weakSubject.pct < 50 ? "#9a3412" : "#374151",
                }}
              >
                {weakSubject.name}
              </p>
              <p style={{ fontSize: "11.5px", color: weakSubject.pct < 50 ? "#c2410c" : "#6b7280", marginTop: "2px" }}>
                Avg: {weakSubject.pct}%
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span style={{ fontSize: "11px", color: weakSubject.pct < 50 ? "#ea580c" : "#0d9488", fontWeight: 600 }}>
                  View →
                </span>
              </div>
            </>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13px" }}>No data yet</p>
          )}
        </div>
      </div>

      {/* ── Row 2: Score Trend + Subject Performance Grid ── */}
      <div className="grid grid-cols-3 gap-5 mb-6">

        {/* Score Trend (takes 2 cols) */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-teal-500" />
              <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
                Score Trend
              </h2>
            </div>
            <span className="text-gray-400" style={{ fontSize: "12px" }}>
              % per test, date-ordered
            </span>
          </div>

          {trendData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip />} />
                <ReferenceLine
                  y={35}
                  stroke="#fca5a5"
                  strokeDasharray="4 4"
                  label={{ value: "Pass 35%", position: "right", fontSize: 10, fill: "#fca5a5" }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={<TrendDot />}
                  activeDot={{ r: 6, fill: "#0d9488", stroke: "white", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300" style={{ fontSize: "14px" }}>
              Not enough data for a trend yet.
            </div>
          )}
        </div>

        {/* Subject Performance (1 col, scrollable) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
              Subjects
            </h2>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "230px" }}>
            {sortedByPct.map((s) => {
              const sc = subjectColors[s.name] ?? { color: "#0d9488", bg: "#f0fdfa" };
              return (
                <button
                  key={s.name}
                  onClick={() => setSelectedSubject(s.name)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors text-left w-full group"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <BookOpen size={13} style={{ color: sc.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700 group-hover:text-teal-700 transition-colors truncate" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: barColor(s.pct), flexShrink: 0, marginLeft: "8px" }}>
                        {s.pct}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.pct}%`, backgroundColor: barColor(s.pct) }}
                      />
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

      {/* ── Row 3: All Tests (filtered table) ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
          All Tests
        </h2>
        <span className="text-gray-400" style={{ fontSize: "13px" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search + Subject filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test name or subject…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="relative">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-100 rounded-xl pl-4 pr-8 py-2.5 text-gray-600 focus:outline-none focus:border-teal-300 shadow-sm cursor-pointer"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            {allSubjects.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>
            ))}
          </select>
          <SlidersHorizontal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Test", "Subject", "Date", "Score", "Percentage", "Grade", "Result"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((result) => {
              const sc = subjectColors[result.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
              const isAbsent = result.score === null;
              const percentage = isAbsent ? null : pct(result.score!, result.totalMarks);
              const grade = percentage !== null ? gradeLabel(percentage) : null;
              const passed = percentage !== null && percentage >= 35;

              return (
                <tr
                  key={result.testId}
                  onClick={() => setSelectedTestId(result.testId)}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  {/* Test name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                        <ClipboardList size={14} style={{ color: sc.color }} strokeWidth={2} />
                      </div>
                      <span className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                        {result.testName}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSubject(result.subject); }}
                      className="px-2.5 py-0.5 rounded-full hover:opacity-75 transition-opacity"
                      style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}
                    >
                      {result.subject}
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-600" style={{ fontSize: "13px" }}>
                        {fmtDate(result.date, true)}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : (
                      <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                        {result.score}
                        <span className="text-gray-400" style={{ fontSize: "12px", fontWeight: 400 }}> / {result.totalMarks}</span>
                      </span>
                    )}
                  </td>

                  {/* Percentage bar */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : (
                      <div className="flex items-center gap-2" style={{ minWidth: "100px" }}>
                        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: barColor(percentage!) }}
                          />
                        </div>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: barColor(percentage!), minWidth: "36px" }}>
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Grade */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                    ) : grade ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full"
                        style={{ fontSize: "12px", fontWeight: 700, color: grade.color, backgroundColor: grade.bg }}
                      >
                        {grade.label}
                      </span>
                    ) : null}
                  </td>

                  {/* Pass / Fail / Absent */}
                  <td className="px-5 py-3.5">
                    {isAbsent ? (
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f3f4f6" }}>
                        Absent
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}
                      >
                        {passed ? "Pass" : "Fail"}
                      </span>
                    )}
                  </td>

                  {/* Chevron */}
                  <td className="px-5 py-3.5">
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <p className="text-gray-300" style={{ fontSize: "14px" }}>No results found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}