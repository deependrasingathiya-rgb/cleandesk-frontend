// src/app/pages/Batches.tsx

import { useState, useEffect } from "react";
import {
  fetchAcademicYearsApi,
  createClassBatchApi,
  updateClassBatchApi,
  deleteClassBatchApi,
  fetchBatchesPageSummaryApi,
  fetchBatchesDetailedApi,
  fetchBatchStudentsApi,
  type AcademicYearOption,
  type BatchDetailed,
  type BatchStudent,
} from "../../Lib/api/class-batches";
import {
  createFeeStructureApi,
  getFeeStructureForBatchApi,
  type LateFeeType,
  type InstallmentInput,
  type FeeStructureRecord,
  type CreateFeeStructurePayload,
} from "../../Lib/api/fee-structure";
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  X,
  Users2,
  GraduationCap,
  ArrowLeft,
  Mail,
  BookOpen,
  Edit2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  MoreVertical,
} from "lucide-react";

// ─── Subject Color Map ─────────────────────────────────────────────────────────

const subjectColors: Record<string, { color: string; bg: string }> = {
  Science:     { color: "#0d9488", bg: "#f0fdfa" },
  Commerce:    { color: "#7c3aed", bg: "#f5f3ff" },
  Arts:        { color: "#d97706", bg: "#fffbeb" },
  Mathematics: { color: "#2563eb", bg: "#eff6ff" },
  Physics:     { color: "#db2777", bg: "#fdf2f8" },
  Biology:     { color: "#16a34a", bg: "#f0fdf4" },
  Chemistry:   { color: "#ea580c", bg: "#fff7ed" },
  English:     { color: "#6b7280", bg: "#f9fafb" },
};

function getSubjectColor(subject: string) {
  return subjectColors[subject] ?? { color: "#6b7280", bg: "#f9fafb" };
}



// ─── Create Fee Structure Modal ───────────────────────────────────────────────

type FeeCollectionType = "LUMP_SUM" | "INSTALLMENTS" | "BOTH";

type FeeFormState = {
  label: string;
  totalAmount: string;
  feeCollectionType: FeeCollectionType;
  finalDueDate: string;
  lateFeeAmount: string;
  lateFeeType: LateFeeType | "";
  requireAdvance: boolean;
  installments: { amount: string; due_date: string }[];
};

const emptyFeeForm: FeeFormState = {
  label: "",
  totalAmount: "",
  feeCollectionType: "LUMP_SUM",
  finalDueDate: "",
  lateFeeAmount: "",
  lateFeeType: "",
  requireAdvance: false,
  installments: [],
};

function CreateFeeStructureModal({
  batchId,
  batchName,
  onClose,
  onCreated,
}: {
  batchId: string;
  batchName: string;
  onClose: () => void;
  onCreated: (structure: FeeStructureRecord) => void;
}) {
  const [form, setForm] = useState<FeeFormState>(emptyFeeForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const totalAmountNum = parseFloat(form.totalAmount) || 0;
  const installmentSum = form.installments.reduce(
    (s, inst) => s + (parseFloat(inst.amount) || 0),
    0
  );
  const sumMismatch =
    form.feeCollectionType !== "LUMP_SUM" &&
    form.installments.length > 0 &&
    Math.abs(installmentSum - totalAmountNum) > 0.01;

  // ── Installment row helpers ──────────────────────────────────────────────
  function addInstallment() {
    if (form.installments.length >= 12) return;
    setForm((f) => ({
      ...f,
      installments: [...f.installments, { amount: "", due_date: "" }],
    }));
  }

  function removeInstallment(idx: number) {
    setForm((f) => ({
      ...f,
      installments: f.installments.filter((_, i) => i !== idx),
    }));
  }

  function updateInstallment(
    idx: number,
    field: "amount" | "due_date",
    value: string
  ) {
    setForm((f) => {
      const updated = [...f.installments];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, installments: updated };
    });
    // Clear per-installment error on change
    setErrors((e) => {
      const next = { ...e };
      delete next[`inst_${idx}_${field}`];
      return next;
    });
  }

  function setFeeCollectionType(pt: FeeCollectionType) {
    setForm((f) => ({ ...f, feeCollectionType: pt, installments: [] }));
    setErrors({});
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.label.trim()) e.label = "Label is required.";
    if (!form.totalAmount || isNaN(Number(form.totalAmount)) || Number(form.totalAmount) <= 0)
      e.totalAmount = "Total amount must be greater than 0.";
    if (!form.finalDueDate) e.finalDueDate = "Final due date is required.";

    const hasLateFeeAmount = form.lateFeeAmount !== "" && !isNaN(Number(form.lateFeeAmount)) && Number(form.lateFeeAmount) > 0;
    const hasLateFeeType = form.lateFeeType !== "";
    if (hasLateFeeAmount && !hasLateFeeType)
      e.lateFeeType = "Select a late fee type when providing a late fee amount.";
    if (!hasLateFeeAmount && hasLateFeeType)
      e.lateFeeAmount = "Enter a late fee amount when a late fee type is selected.";

    if (form.feeCollectionType !== "LUMP_SUM") {
      if (form.installments.length === 0)
        e.installments = "At least one installment row is required.";
      if (form.installments.length > 12)
        e.installments = "Maximum 12 installment rows allowed.";

      form.installments.forEach((inst, idx) => {
        if (!inst.amount || isNaN(Number(inst.amount)) || Number(inst.amount) <= 0)
          e[`inst_${idx}_amount`] = "Required";
        if (!inst.due_date)
          e[`inst_${idx}_due_date`] = "Required";
      });

      if (form.installments.length > 0 && Math.abs(installmentSum - totalAmountNum) > 0.01)
        e.installments = `Installment amounts sum to ₹${installmentSum.toFixed(2)}, but total is ₹${totalAmountNum.toFixed(2)}.`;
    }

    return e;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);

    const payload: CreateFeeStructurePayload = {
      class_batch_id: batchId,
      label: form.label.trim(),
      total_amount: Number(form.totalAmount),
      lump_sum_enabled: form.feeCollectionType === "LUMP_SUM" || form.feeCollectionType === "BOTH",
      installments_enabled: form.feeCollectionType === "INSTALLMENTS" || form.feeCollectionType === "BOTH",
      final_due_date: form.finalDueDate,
      require_advance: form.requireAdvance,
    };

    if (form.lateFeeAmount !== "" && form.lateFeeType !== "") {
      payload.late_fee_amount = Number(form.lateFeeAmount);
      payload.late_fee_type = form.lateFeeType as LateFeeType;
    }

    if (form.feeCollectionType !== "LUMP_SUM") {
      payload.installments = form.installments.map((inst, idx) => ({
        installment_number: idx + 1,
        amount: Number(inst.amount),
        due_date: inst.due_date,
      }));
    }

    try {
      const result = await createFeeStructureApi(payload);
      setSaved(true);
      setTimeout(() => onCreated(result), 900);
    } catch (err: any) {
      setApiError(err.message ?? "Failed to create fee structure.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <CheckCircle2 size={28} color="#0d9488" strokeWidth={2} />
          </div>
          <p className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>
            Fee Structure Created!
          </p>
          <p className="text-gray-400 mt-1 text-center" style={{ fontSize: "13.5px" }}>
            {batchName} now has an active fee structure.
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[720px] flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Fixed header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Create Fee Structure
            </h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>
              {batchName} — define how fees are collected for this batch.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-7 py-6 space-y-5 flex-1">

          {/* Label */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setErrors((er) => { const c = { ...er }; delete c.label; return c; }); }}
              placeholder="e.g. Annual Fees 2025–26"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              style={{ fontSize: "13.5px" }}
            />
            {errors.label && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.label}</p>}
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Total Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.totalAmount}
              onChange={(e) => { setForm((f) => ({ ...f, totalAmount: e.target.value })); setErrors((er) => { const c = { ...er }; delete c.totalAmount; return c; }); }}
              placeholder="e.g. 50000"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              style={{ fontSize: "13.5px" }}
            />
            {errors.totalAmount && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.totalAmount}</p>}
          </div>

          {/* Fee Collection Type */}
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: "13px", fontWeight: 600 }}>
              Fee Collection Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "LUMP_SUM", label: "Lump Sum Only", desc: "Single payment by deadline" },
                  { value: "INSTALLMENTS", label: "Installments Only", desc: "Fixed installment schedule" },
                  { value: "BOTH", label: "Both Options", desc: "Student chooses at enrollment" },
                ] as { value: FeeCollectionType; label: string; desc: string }[]
              ).map((opt) => {
                const isSelected = form.feeCollectionType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFeeCollectionType(opt.value)}
                    className="flex flex-col items-start p-3 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: isSelected ? "#0d9488" : "#f3f4f6",
                      backgroundColor: isSelected ? "#f0fdfa" : "white",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isSelected ? "#0d9488" : "#d1d5db" }}
                      />
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "#0d9488" : "#374151",
                        }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "11px", paddingLeft: "18px" }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Due Date */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Final Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.finalDueDate}
              onChange={(e) => { setForm((f) => ({ ...f, finalDueDate: e.target.value })); setErrors((er) => { const c = { ...er }; delete c.finalDueDate; return c; }); }}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
              style={{ fontSize: "13.5px" }}
            />
            {errors.finalDueDate && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.finalDueDate}</p>}
          </div>

          {/* Late Fee Rule (optional) */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-gray-500" style={{ fontSize: "12.5px", fontWeight: 600 }}>
              Late Fee Rule{" "}
              <span className="text-gray-400" style={{ fontWeight: 400 }}>(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Late Fee Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.lateFeeAmount}
                  onChange={(e) => { setForm((f) => ({ ...f, lateFeeAmount: e.target.value })); setErrors((er) => { const c = { ...er }; delete c.lateFeeAmount; return c; }); }}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-all"
                  style={{ fontSize: "13px" }}
                />
                {errors.lateFeeAmount && <p className="text-red-500 mt-1" style={{ fontSize: "11.5px" }}>{errors.lateFeeAmount}</p>}
              </div>
              <div>
                <label className="block text-gray-600 mb-1" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Late Fee Type
                </label>
                <select
                  value={form.lateFeeType}
                  onChange={(e) => { setForm((f) => ({ ...f, lateFeeType: e.target.value as LateFeeType | "" })); setErrors((er) => { const c = { ...er }; delete c.lateFeeType; return c; }); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-teal-400 transition-all bg-white"
                  style={{ fontSize: "13px", color: form.lateFeeType ? "#1f2937" : "#d1d5db" }}
                >
                  <option value="">None</option>
                  <option value="FLAT">Flat (fixed ₹ amount)</option>
                  <option value="PERCENT">Percent (% of outstanding)</option>
                </select>
                {errors.lateFeeType && <p className="text-red-500 mt-1" style={{ fontSize: "11.5px" }}>{errors.lateFeeType}</p>}
              </div>
            </div>
          </div>

          {/* Require Advance Toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                Require Advance Payment
              </p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>
                Students must pay an advance before enrollment is confirmed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, requireAdvance: !f.requireAdvance }))}
              className="relative inline-flex items-center rounded-full transition-all duration-200 flex-shrink-0 ml-4"
              style={{ width: "44px", height: "24px", backgroundColor: form.requireAdvance ? "#0d9488" : "#e5e7eb" }}
            >
              <span
                className="inline-block rounded-full bg-white shadow transition-transform duration-200"
                style={{ width: "18px", height: "18px", transform: form.requireAdvance ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {/* Fixed Installments — dynamic rows */}
          {form.feeCollectionType !== "LUMP_SUM" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Installments <span className="text-red-500">*</span>
                  <span className="text-gray-400 ml-1.5" style={{ fontWeight: 400, fontSize: "12px" }}>
                    (max 12)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={addInstallment}
                  disabled={form.installments.length >= 12}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Add Row
                </button>
              </div>

              {/* Sum live indicator */}
              {form.installments.length > 0 && (
                <div
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: sumMismatch ? "#fef2f2" : "#f0fdfa",
                    border: `1px solid ${sumMismatch ? "#fecaca" : "#ccfbf1"}`,
                  }}
                >
                  {sumMismatch ? (
                    <AlertCircle size={13} style={{ color: "#dc2626" }} strokeWidth={2} />
                  ) : (
                    <CheckCircle2 size={13} style={{ color: "#0d9488" }} strokeWidth={2} />
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: sumMismatch ? "#dc2626" : "#0d9488",
                    }}
                  >
                    Sum: ₹{installmentSum.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
                    {!sumMismatch && installmentSum > 0 && " ✓"}
                  </span>
                </div>
              )}

              {form.installments.length === 0 ? (
                <div
                  className="py-6 flex flex-col items-center justify-center rounded-xl"
                  style={{ backgroundColor: "#f9fafb", border: "1px dashed #e5e7eb" }}
                >
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>
                    No installments added yet. Click "Add Row" to begin.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div
                    className="grid px-4 py-2.5"
                    style={{ gridTemplateColumns: "40px 1fr 1fr 32px", backgroundColor: "#f9fafb", gap: "8px" }}
                  >
                    {["#", "Amount (₹)", "Due Date", ""].map((col) => (
                      <p key={col} className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {col.toUpperCase()}
                      </p>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {form.installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="grid px-4 py-3 items-start"
                        style={{ gridTemplateColumns: "40px 1fr 1fr 32px", gap: "8px" }}
                      >
                        <span className="text-gray-400 pt-2.5" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                          {idx + 1}
                        </span>
                        <div>
                          <input
                            type="number"
                            min={0.01}
                            value={inst.amount}
                            onChange={(e) => updateInstallment(idx, "amount", e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-all"
                            style={{
                              fontSize: "13px",
                              borderColor: errors[`inst_${idx}_amount`] ? "#fca5a5" : undefined,
                            }}
                          />
                          {errors[`inst_${idx}_amount`] && (
                            <p className="text-red-400 mt-0.5" style={{ fontSize: "11px" }}>
                              {errors[`inst_${idx}_amount`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <input
                            type="date"
                            value={inst.due_date}
                            onChange={(e) => updateInstallment(idx, "due_date", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-teal-400 transition-all bg-white"
                            style={{
                              fontSize: "13px",
                              borderColor: errors[`inst_${idx}_due_date`] ? "#fca5a5" : undefined,
                            }}
                          />
                          {errors[`inst_${idx}_due_date`] && (
                            <p className="text-red-400 mt-0.5" style={{ fontSize: "11px" }}>
                              {errors[`inst_${idx}_due_date`]}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInstallment(idx)}
                          className="mt-2 w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.installments && (
                <p className="text-red-500 mt-1.5" style={{ fontSize: "12px" }}>{errors.installments}</p>
              )}
            </div>
          )}



          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            <span className="text-red-400">*</span> Required fields
          </p>

          {apiError && (
            <div
              className="flex items-center gap-2 px-3 py-3 rounded-xl"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <AlertCircle size={14} style={{ color: "#dc2626" }} strokeWidth={2} />
              <p style={{ fontSize: "12.5px", color: "#dc2626" }}>{apiError}</p>
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Creating…" : "Create Fee Structure"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Edit Batch Modal ─────────────────────────────────────────────────────────

function EditBatchModal({
  batch,
  onClose,
  onUpdated,
}: {
  batch: BatchDetailed;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName]                     = useState(batch.name);
  const [selectedYearId, setSelectedYearId] = useState(batch.academic_year_id);
  const [academicYears, setAcademicYears]   = useState<AcademicYearOption[]>([]);
  const [yearsLoading, setYearsLoading]     = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicYearsApi()
      .then((years) => {
        setAcademicYears(years);
      })
      .catch(() => setError("Could not load academic years."))
      .finally(() => setYearsLoading(false));
  }, []);

  const isDirty =
    name.trim() !== batch.name || selectedYearId !== batch.academic_year_id;
  const canSubmit = name.trim().length > 0 && selectedYearId !== "" && isDirty && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateClassBatchApi(batch.id, {
        name: name.trim(),
        academic_year_id: selectedYearId,
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to update batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7" style={{ border: "1px solid #f3f4f6" }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Edit Batch
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Update the name or academic year for this batch.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Batch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science – Batch A"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
              style={{ fontSize: "13.5px" }}
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Academic Year
            </label>
            {yearsLoading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-400" style={{ fontSize: "13.5px" }}>
                Loading years…
              </div>
            ) : (
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 bg-white transition-all"
                style={{ fontSize: "13.5px" }}
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}{y.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-red-500" style={{ fontSize: "12.5px" }}>{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Create Batch Modal ────────────────────────────────────────────────────────

function CreateBatchModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName]                           = useState("");
  const [selectedYearId, setSelectedYearId]       = useState("");
  const [academicYears, setAcademicYears]         = useState<AcademicYearOption[]>([]);
  const [yearsLoading, setYearsLoading]           = useState(true);
  const [submitting, setSubmitting]               = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicYearsApi()
      .then((years) => {
        setAcademicYears(years);
        const active = years.find((y) => y.is_active);
        if (active) setSelectedYearId(active.id);
        else if (years.length > 0) setSelectedYearId(years[0].id);
      })
      .catch(() => setError("Could not load academic years."))
      .finally(() => setYearsLoading(false));
  }, []);

  const canSubmit = name.trim().length > 0 && selectedYearId !== "" && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createClassBatchApi({ name: name.trim(), academic_year_id: selectedYearId });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
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
              Create Batch
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Add a new class batch to the institute.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Batch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science – Batch A"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
              style={{ fontSize: "13.5px" }}
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Academic Year</label>
            {yearsLoading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-400" style={{ fontSize: "13.5px" }}>
                Loading years…
              </div>
            ) : (
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 bg-white transition-all"
                style={{ fontSize: "13.5px" }}
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}{y.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-red-500" style={{ fontSize: "12.5px" }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Creating…" : "Create Batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Profile Sub-Panel ─────────────────────────────────────────────────

function StudentProfilePanel({
  student,
  batchName,
  onBack,
}: {
  student: BatchStudent;
  batchName: string;
  onBack: () => void;
}) {
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-panel Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
        </button>
        <span className="text-gray-500" style={{ fontSize: "13px" }}>Back to batch</span>
      </div>

      {/* Student Identity */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488" }}>{initials}</span>
          </div>
          <div>
            <p className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {student.name}
            </p>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px", fontFamily: "monospace" }}>
              {student.login_identifier}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Batch tag */}
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}>
          <Users2 size={14} style={{ color: "#0d9488" }} strokeWidth={2} />
          <span className="text-teal-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{batchName}</span>
        </div>

        {/* Contact */}
        <div>
          <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
            Identifier
          </p>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
              <Mail size={13} className="text-gray-400" strokeWidth={2} />
            </div>
            <span className="text-gray-600" style={{ fontSize: "13px" }}>{student.login_identifier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Detail Side Panel ──────────────────────────────────────────────────

function BatchDetailPanel({
  batch,
  onClose,
}: {
  batch: BatchDetailed;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<BatchStudent | null>(null);
  const [students, setStudents]               = useState<BatchStudent[]>([]);
  const [totalStudents, setTotalStudents]     = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [studentsError, setStudentsError]     = useState<string | null>(null);
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Fee structure
  const [feeStructure, setFeeStructure]         = useState<FeeStructureRecord | null | undefined>(undefined);
  const [loadingFee, setLoadingFee]             = useState(true);
  const [showFeeModal, setShowFeeModal]         = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showMenu, setShowMenu]                 = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]                 = useState(false);
  const [deleteError, setDeleteError]           = useState<string | null>(null);

  const PREVIEW_LIMIT = 5;

  // Load fee structure for this batch
  useEffect(() => {
    setLoadingFee(true);
    getFeeStructureForBatchApi(batch.id)
      .then(setFeeStructure)
      .catch(() => setFeeStructure(null))
      .finally(() => setLoadingFee(false));
  }, [batch.id]);

  // Load first 5 students on mount
  useEffect(() => {
    setLoadingStudents(true);
    setStudentsError(null);
    fetchBatchStudentsApi(batch.id, PREVIEW_LIMIT, 0)
      .then((res) => {
        setStudents(res.data);
        setTotalStudents(res.total);
      })
      .catch((e: any) => setStudentsError(e.message ?? "Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [batch.id]);

  // Load all remaining students when "Show More" is clicked
  async function handleShowMore() {
    if (showAllStudents) return;
    setLoadingMore(true);
    try {
      const res = await fetchBatchStudentsApi(batch.id, 1000, 0);
      setStudents(res.data);
      setShowAllStudents(true);
    } catch (e: any) {
      setStudentsError(e.message ?? "Failed to load students");
    } finally {
      setLoadingMore(false);
    }
  }

  const sc = getSubjectColor(batch.name);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 bg-white flex flex-col"
        style={{ width: "420px", borderLeft: "1px solid #f3f4f6", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
      >
        {selectedStudent ? (
          <StudentProfilePanel
            student={selectedStudent}
            batchName={batch.name}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <>
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Batch Details
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Batch Identity */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <BookOpen size={22} style={{ color: sc.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      {batch.name}
                    </p>
                    <p className="text-gray-400 mt-1" style={{ fontSize: "12.5px" }}>
                      {batch.academic_year_label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch Info Grid */}
              <div className="px-6 py-4 border-b border-gray-50">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  {[
                    { label: "Academic Year", value: batch.academic_year_label },
                    { label: "Created Date",  value: new Date(batch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: "Created By",    value: batch.created_by },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>{label}</span>
                      <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teachers */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                  Assigned {batch.teachers.length === 1 ? "Teacher" : "Teachers"}
                </p>
                {batch.teachers.length === 0 ? (
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>No teachers assigned yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {batch.teachers.map((teacher) => (
                      <div key={teacher} className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#f5f3ff" }}
                        >
                          <GraduationCap size={16} style={{ color: "#7c3aed" }} strokeWidth={2} />
                        </div>
                        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{teacher}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

{/* Fee Structure */}
              <div className="px-6 py-4 border-b border-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                    Fee Structure
                  </p>
                  {!loadingFee && !feeStructure && (
                    <button
                      onClick={() => setShowFeeModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      Create
                    </button>
                  )}
                </div>

                {loadingFee ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ fontSize: "13px" }}>Loading…</span>
                  </div>
                ) : feeStructure ? (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                            {feeStructure.label}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-full mt-1 inline-block"
                            style={{
                              fontSize: "11px", fontWeight: 600,
                              color: feeStructure.plan_type === "LUMP_SUM" ? "#2563eb" : feeStructure.plan_type === "FIXED_INSTALLMENTS" ? "#7c3aed" : "#d97706",
                              backgroundColor: feeStructure.plan_type === "LUMP_SUM" ? "#eff6ff" : feeStructure.plan_type === "FIXED_INSTALLMENTS" ? "#f5f3ff" : "#fffbeb",
                            }}
                          >
                            {feeStructure.plan_type === "LUMP_SUM"
                              ? "Lump Sum"
                              : feeStructure.plan_type === "FIXED_INSTALLMENTS"
                              ? "Fixed Installments"
                              : "Custom Installments"}
                          </span>
                        </div>
                        <p className="text-gray-900 flex-shrink-0" style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                          ₹{Number(feeStructure.total_amount).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400" style={{ fontSize: "12px" }}>Final due</span>
                        <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                          {new Date(feeStructure.final_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {feeStructure.late_fee_amount && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400" style={{ fontSize: "12px" }}>Late fee</span>
                          <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                            {feeStructure.late_fee_type === "PERCENT"
                              ? `${feeStructure.late_fee_amount}%`
                              : `₹${Number(feeStructure.late_fee_amount).toLocaleString("en-IN")}`}{" "}
                            ({feeStructure.late_fee_type === "PERCENT" ? "of outstanding" : "flat"})
                          </span>
                        </div>
                      )}

                      {feeStructure.require_advance && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 size={12} style={{ color: "#0d9488" }} strokeWidth={2.5} />
                          <span className="text-teal-700" style={{ fontSize: "12px", fontWeight: 500 }}>
                            Advance payment required
                          </span>
                        </div>
                      )}

                      {feeStructure.plan_type === "FIXED_INSTALLMENTS" && feeStructure.installments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
                          <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Installments
                          </p>
                          {feeStructure.installments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between">
                              <span className="text-gray-500" style={{ fontSize: "12px" }}>
                                #{inst.installment_number}
                              </span>
                              <div className="text-right">
                                <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                                  ₹{Number(inst.amount).toLocaleString("en-IN")}
                                </span>
                                <span className="text-gray-400 ml-2" style={{ fontSize: "11.5px" }}>
                                  due {new Date(inst.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="py-5 flex flex-col items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#f9fafb", border: "1px dashed #e5e7eb" }}
                  >
                    <DollarSign size={22} className="text-gray-300 mb-1.5" strokeWidth={1.5} />
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>No fee structure yet</p>
                    <button
                      onClick={() => setShowFeeModal(true)}
                      className="mt-2 px-4 py-1.5 rounded-lg text-white hover:opacity-90 transition-all"
                      style={{ fontSize: "12.5px", fontWeight: 600, backgroundColor: "#0d9488" }}
                    >
                      Create Fee Structure
                    </button>
                  </div>
                )}
              </div>


              {/* Batch Strength */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                  Batch Strength
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0fdfa" }}
                  >
                    <span style={{ fontSize: "20px", fontWeight: 750, color: "#0d9488" }}>
                      {batch.student_count}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800" style={{ fontSize: "14px", fontWeight: 600 }}>
                      {batch.student_count} {batch.student_count === 1 ? "Student" : "Students"}
                    </p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>
                      currently enrolled in this batch
                    </p>
                  </div>
                </div>
              </div>

              {/* Student List */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                    Student List
                  </p>
                  {!loadingStudents && (
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      {showAllStudents ? `${totalStudents} total` : `Showing ${Math.min(students.length, PREVIEW_LIMIT)} of ${totalStudents}`}
                    </span>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: "13px" }}>Loading students…</span>
                  </div>
                ) : studentsError ? (
                  <p className="text-red-400 text-center py-6" style={{ fontSize: "13px" }}>{studentsError}</p>
                ) : students.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users size={28} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>No students enrolled yet</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: "#f9fafb" }}>
                            <th className="text-left px-4 py-2.5 text-gray-400" style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.05em" }}>
                              STUDENT NAME
                            </th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {students.map((student) => {
                            const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                            return (
                              <tr
                                key={student.id}
                                className="hover:bg-teal-50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: "#f0fdfa" }}
                                    >
                                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488" }}>
                                        {initials}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 group-hover:text-teal-700 transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
                                      {student.name}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-400 transition-colors" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Show More */}
                    {!showAllStudents && totalStudents > PREVIEW_LIMIT && (
                      <button
                        onClick={handleShowMore}
                        disabled={loadingMore}
                        className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ fontSize: "13px", fontWeight: 600 }}
                      >
                        {loadingMore ? (
                          <><Loader2 size={13} className="animate-spin" /> Loading…</>
                        ) : (
                          `Show all ${totalStudents} students`
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-gray-100 relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center gap-2 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                style={{ fontSize: "13.5px", fontWeight: 600 }}
              >
                <MoreVertical size={14} strokeWidth={2.5} />
                Actions
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className="absolute bottom-16 left-6 right-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20"
                  >
                    <button
                      onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      style={{ fontSize: "13.5px", fontWeight: 600 }}
                    >
                      <Edit2 size={14} strokeWidth={2.5} className="text-gray-400" />
                      Edit Batch
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button
                      onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                      style={{ fontSize: "13.5px", fontWeight: 600 }}
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                      Delete Batch
                    </button>
                  </div>
                </>
              )}
            </div>

{/* Delete Confirm Modal */}
            {showDeleteConfirm && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7" style={{ border: "1px solid #f3f4f6" }}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto" style={{ backgroundColor: "#fef2f2" }}>
                    <Trash2 size={20} style={{ color: "#dc2626" }} strokeWidth={2} />
                  </div>
                  <h2 className="text-gray-900 text-center mb-1" style={{ fontSize: "17px", fontWeight: 700 }}>
                    Delete Batch?
                  </h2>
                  <p className="text-gray-400 text-center mb-5" style={{ fontSize: "13px" }}>
                    <strong className="text-gray-600">{batch.name}</strong> will be permanently deactivated. This cannot be undone.
                  </p>
                  {deleteError && (
                    <p className="text-red-500 text-center mb-3" style={{ fontSize: "12.5px" }}>{deleteError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      style={{ fontSize: "13.5px", fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setDeleting(true);
                        setDeleteError(null);
                        try {
                          await deleteClassBatchApi(batch.id);
                          setShowDeleteConfirm(false);
                          onClose();
                        } catch (e: any) {
                          setDeleteError(e.message ?? "Failed to delete batch");
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#dc2626", fontSize: "13.5px", fontWeight: 600 }}
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            
           {/* Edit Batch Modal */}
            {showEditModal && (
              <EditBatchModal
                batch={batch}
                onClose={() => setShowEditModal(false)}
                onUpdated={() => {
                  setShowEditModal(false);
                  onClose();
                }}
              />
            )}

            {/* Fee Structure Modal */}
            {showFeeModal && (
              <CreateFeeStructureModal
                batchId={batch.id}
                batchName={batch.name}
                onClose={() => setShowFeeModal(false)}
                onCreated={(structure) => {
                  setFeeStructure(structure);
                  setShowFeeModal(false);
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Batches() {
  const [search, setSearch]             = useState("");
  const [showCreate, setShowCreate]     = useState(false);
  const [detailBatch, setDetailBatch]   = useState<BatchDetailed | null>(null);

  // Summary stats
  const [summary, setSummary]           = useState<{ active_batches: number; total_students: number } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Batch list
  const [batches, setBatches]           = useState<BatchDetailed[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  function loadData() {
    setSummaryLoading(true);
    setBatchesLoading(true);
    setBatchesError(null);

    fetchBatchesPageSummaryApi()
      .then(setSummary)
      .catch(() => setSummary({ active_batches: 0, total_students: 0 }))
      .finally(() => setSummaryLoading(false));

    fetchBatchesDetailedApi()
      .then(setBatches)
      .catch((e: any) => setBatchesError(e.message ?? "Failed to load batches"))
      .finally(() => setBatchesLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.teachers.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Batches
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {batchesLoading ? "Loading…" : `${batches.length} ${batches.length === 1 ? "batch" : "batches"} · active academic year`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create Batch
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          {
            label: "Active Batches",
            value: summaryLoading ? "—" : (summary?.active_batches ?? 0).toString(),
            color: "#0d9488", bg: "#f0fdfa",
          },
          {
            label: "Total Students",
            value: summaryLoading ? "—" : (summary?.total_students ?? 0).toString(),
            color: "#7c3aed", bg: "#f5f3ff",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em", color: s.color, lineHeight: 1.2, marginTop: "4px" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch name or teacher…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm transition-all"
            style={{ fontSize: "13.5px" }}
          />
        </div>
      </div>

      {/* ── Batch Grid ── */}
      {batchesLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Loading batches…</span>
        </div>
      ) : batchesError ? (
        <div className="py-16 text-center">
          <p className="text-red-400" style={{ fontSize: "14px" }}>{batchesError}</p>
          <button
            onClick={loadData}
            className="mt-3 text-teal-600 underline"
            style={{ fontSize: "13px" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((batch) => {
              const sc = getSubjectColor(batch.name);
              return (
                <div
                  key={batch.id}
                  onClick={() => setDetailBatch(batch)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sc.bg }}>
                        <BookOpen size={16} style={{ color: sc.color }} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-gray-900 group-hover:text-teal-700 transition-colors" style={{ fontSize: "14px", fontWeight: 650 }}>
                          {batch.name}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: "12px" }}>
                          {batch.academic_year_label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teachers */}
                  <div className="flex items-center gap-2 mb-4 mt-3 flex-wrap">
                    {batch.teachers.length === 0 ? (
                      <span className="text-gray-400" style={{ fontSize: "12px" }}>No teacher assigned</span>
                    ) : (
                      batch.teachers.map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                          {t}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Student count */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users size={12} className="text-gray-400" strokeWidth={2} />
                    <span className="text-gray-500" style={{ fontSize: "12px", fontWeight: 500 }}>
                      {batch.student_count} {batch.student_count === 1 ? "student" : "students"}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      Created by {batch.created_by}
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users2 size={36} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-400" style={{ fontSize: "14px" }}>
                {search ? "No batches match your search" : "No active batches for this academic year"}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Modals & Panels ── */}
      {showCreate && (
        <CreateBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData();
          }}
        />
      )}
      {detailBatch && (
        <BatchDetailPanel
          batch={detailBatch}
          onClose={() => {
            setDetailBatch(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
