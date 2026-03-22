// src/app/pages/Student/MyFee.tsx

import { useState, useEffect } from "react";
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Printer,
  X,
  Calendar,
  ClipboardList,
} from "lucide-react";
import {
  fetchOwnFeeRecordApi,
  type StudentOwnFeeRecord,
  type StudentFeeInstallment,
  type StudentOwnPayment,
} from "../../../Lib/api/student-fee-self";
import { fetchMyProfile } from "../../../Lib/api/profile";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number): string {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const today = new Date().toISOString().split("T")[0];

// ─── Fee Status Badge ──────────────────────────────────────────────────────────

function FeeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    UNPAID:         { color: "#dc2626", bg: "#fef2f2",  label: "Unpaid"         },
    PARTIALLY_PAID: { color: "#d97706", bg: "#fffbeb",  label: "Partially Paid" },
    PAID:           { color: "#16a34a", bg: "#f0fdf4",  label: "Paid"           },
    OVERDUE:        { color: "#9333ea", bg: "#fdf4ff",  label: "Overdue"        },
  };
  const c = config[status] ?? { color: "#6b7280", bg: "#f9fafb", label: status };
  return (
    <span className="px-3 py-1 rounded-full" style={{ fontSize: "13px", fontWeight: 700, color: c.color, backgroundColor: c.bg }}>
      {c.label}
    </span>
  );
}

// ─── Receipt Modal (identical logic to StudentProfilePage.tsx — student self-view variant) ──

function ReceiptModal({
  payment,
  studentName,
  batchName,
  instituteName,
  onClose,
}: {
  payment: StudentOwnPayment;
  studentName: string;
  batchName: string;
  instituteName: string;
  onClose: () => void;
}) {
  const printId = "student-fee-receipt-printable";
  const formattedDate   = fmtDateLong(payment.payment_date);
  const formattedAmount = inr(payment.amount);
  const formattedMode   = payment.payment_mode.replace(/_/g, " ");

  function handlePrint() {
    const content = document.getElementById(printId);
    if (!content) return;
    const w = window.open("", "_blank", "width=700,height=600");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${payment.receipt_number}</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;}
      .receipt{max-width:480px;margin:40px auto;padding:36px;border:1px solid #e5e7eb;border-radius:12px;}
      .header{text-align:center;margin-bottom:28px;border-bottom:2px solid #0d9488;padding-bottom:20px;}
      .institute{font-size:20px;font-weight:800;color:#0d9488;letter-spacing:-0.02em;}
      .receipt-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-top:6px;}
      .receipt-number{font-size:15px;font-weight:700;color:#374151;margin-top:4px;font-family:monospace;}
      .amount-block{text-align:center;margin:24px 0;padding:20px;background:#f0fdfa;border-radius:10px;border:1px solid #ccfbf1;}
      .amount-label{font-size:11px;font-weight:600;color:#0d9488;text-transform:uppercase;letter-spacing:0.08em;}
      .amount-value{font-size:36px;font-weight:800;color:#0d9488;margin-top:4px;}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6;}
      .row:last-child{border-bottom:none;}
      .row-label{font-size:12px;color:#6b7280;font-weight:500;}
      .row-value{font-size:13px;color:#111827;font-weight:600;text-align:right;max-width:60%;}
      .footer{margin-top:28px;text-align:center;border-top:1px dashed #e5e7eb;padding-top:16px;}
      .footer p{font-size:11px;color:#9ca3af;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.receipt{border:none;margin:0;padding:20px;}}
    </style></head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  const rows = [
    { label: "Student Name",  value: studentName },
    { label: "Batch",         value: batchName },
    { label: "Payment Date",  value: formattedDate },
    { label: "Payment Mode",  value: formattedMode },
    ...(payment.note ? [{ label: "Note", value: payment.note }] : []),
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px]">
        {/* Header */}
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

        {/* Receipt body */}
        <div className="px-6 py-5">
          <div id={printId}>
            <div className="receipt" style={{ maxWidth: "100%", padding: "28px", border: "1px solid #e5e7eb", borderRadius: "12px" }}>

              <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #0d9488", paddingBottom: "18px" }}>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#0d9488", letterSpacing: "-0.02em" }}>{instituteName}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>Payment Receipt</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginTop: "3px", fontFamily: "monospace" }}>{payment.receipt_number}</p>
              </div>

              <div style={{ textAlign: "center", margin: "20px 0", padding: "18px", backgroundColor: "#f0fdfa", borderRadius: "10px", border: "1px solid #ccfbf1" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount Received</p>
                <p style={{ fontSize: "34px", fontWeight: 800, color: "#0d9488", marginTop: "4px" }}>{formattedAmount}</p>
              </div>

              <div style={{ marginTop: "20px" }}>
                {rows.map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: "13px", color: "#111827", fontWeight: 600, textAlign: "right", maxWidth: "58%" }}>{value}</span>
                  </div>
                ))}
              </div>

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

// ─── Installment row ────────────────────────────────────────────────────────────

function InstallmentRow({ inst }: { inst: StudentFeeInstallment }) {
  const isOverdue = inst.due_date < today;
  const isPast    = inst.due_date <= today;

  return (
    <tr
      className="border-t border-gray-50"
      style={{ backgroundColor: isOverdue ? "#fffafa" : "white" }}
    >
      <td className="px-5 py-3.5">
        <span className="text-gray-600" style={{ fontSize: "13px", fontWeight: 600 }}>
          #{inst.installment_number}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          {isOverdue && <AlertTriangle size={12} style={{ color: "#dc2626" }} strokeWidth={2.5} />}
          <span style={{ fontSize: "13px", color: isOverdue ? "#dc2626" : "#374151", fontWeight: isOverdue ? 600 : 400 }}>
            {fmtDate(inst.due_date)}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#374151" }}>{inr(inst.amount)}</span>
      </td>
      <td className="px-5 py-3.5">
        {isOverdue ? (
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 700, color: "#dc2626", backgroundColor: "#fef2f2" }}>
            Overdue
          </span>
        ) : isPast ? (
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4" }}>
            Due
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f9fafb" }}>
            Upcoming
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function MyFee() {
  const [record, setRecord]           = useState<StudentOwnFeeRecord | null | undefined>(undefined);
  const [instituteName, setInstituteName] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<StudentOwnPayment | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchOwnFeeRecordApi(),
      fetchMyProfile(),
    ])
      .then(([rec, profile]) => {
        if (cancelled) return;
        setRecord(rec);
        setInstituteName(profile.institute_name);
        setStudentName(profile.full_name ?? "");
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e.message ?? "Failed to load fee record");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Loading fee details…</span>
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

  // No fee record — enrolled before fee structures existed
  if (record === null) {
    return (
      <div className="p-8 max-w-[860px] mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>My Fee</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
          <DollarSign size={32} className="text-gray-200" strokeWidth={1.5} />
          <p className="text-gray-400" style={{ fontSize: "14px" }}>No fee record found for your account.</p>
          <p className="text-gray-300 text-center" style={{ fontSize: "13px", maxWidth: "360px" }}>
            Your batch may not have a fee structure assigned yet. Contact your institute if you believe this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const isInstallmentBased = record.plan_type !== "LUMP_SUM";
  const finalDueOverdue    = record.final_due_date < today && record.fee_status !== "PAID";
  const collectionPct      = record.total_payable > 0
    ? Math.min(100, Math.round((record.total_collected / record.total_payable) * 100))
    : 0;

  return (
    <div className="p-8 max-w-[960px] mx-auto">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          My Fee
        </h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
          {record.batch_name} · {record.fee_structure_label}
        </p>
      </div>

      {/* ── Fee overview card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-5">

        {/* Status + label row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-gray-400 uppercase mb-1" style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em" }}>
              Fee Status
            </p>
            <FeeStatusBadge status={record.fee_status} />
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
            <DollarSign size={22} style={{ color: "#2563eb" }} strokeWidth={2} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 border-t border-gray-50">
          {[
            { label: "Total Payable",       value: inr(record.total_payable),       color: "#374151" },
            { label: "Amount Paid",         value: inr(record.total_collected),     color: "#16a34a" },
            { label: "Outstanding Balance", value: inr(record.outstanding_balance), color: record.outstanding_balance > 0 ? "#dc2626" : "#16a34a" },
            { label: "Final Due Date",      value: fmtDate(record.final_due_date),  color: finalDueOverdue ? "#dc2626" : "#374151" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-gray-400 mb-1" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </p>
              <p style={{ fontSize: "17px", fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Discount row */}
        {record.discount_amount > 0 && (
          <div className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}>
            <CheckCircle2 size={13} style={{ color: "#0d9488" }} strokeWidth={2.5} />
            <span className="text-teal-700" style={{ fontSize: "12.5px" }}>
              Discount applied: <span style={{ fontWeight: 700 }}>{inr(record.discount_amount)}</span>
              {record.discount_reason && <span className="text-teal-600"> — {record.discount_reason}</span>}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-400" style={{ fontSize: "12px" }}>Payment progress</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: collectionPct === 100 ? "#16a34a" : "#0d9488" }}>
              {collectionPct}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${collectionPct}%`, backgroundColor: collectionPct === 100 ? "#16a34a" : "#0d9488" }}
            />
          </div>
        </div>
      </div>

      {/* ── Installment Schedule ── */}
      {isInstallmentBased && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-teal-500" />
              <h2 className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>Installment Schedule</h2>
            </div>
            {record.has_custom_plan && (
              <span className="text-gray-500 italic" style={{ fontSize: "12px" }}>
                Your payment schedule has been customised
              </span>
            )}
          </div>

          {record.installments.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-300" style={{ fontSize: "13.5px" }}>No installment schedule available.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {["No.", "Due Date", "Amount", "Status"].map((col) => (
                    <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.installments.map((inst) => (
                  <InstallmentRow key={inst.id} inst={inst} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-teal-500" />
            <h2 className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>Payment History</h2>
          </div>
          <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
            {record.payments.length} payment{record.payments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {record.payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-300" style={{ fontSize: "14px" }}>No payments recorded yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Receipt No.", "Date", "Amount", "Mode", ""].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.payments.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                      {p.receipt_number}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-600" style={{ fontSize: "13px" }}>{fmtDate(p.payment_date)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#16a34a" }}>{inr(p.amount)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}>
                      {p.payment_mode.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setViewingPayment(p)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      <Printer size={12} strokeWidth={2} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Receipt modal ── */}
      {viewingPayment && (
        <ReceiptModal
          payment={viewingPayment}
          studentName={studentName}
          batchName={record.batch_name}
          instituteName={instituteName}
          onClose={() => setViewingPayment(null)}
        />
      )}
    </div>
  );
}