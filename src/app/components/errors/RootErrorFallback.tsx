// src/app/components/errors/RootErrorFallback.tsx

export function RootErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: "#f5f6f8" }}
    >
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center"
        style={{ maxWidth: "480px", width: "100%" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: "#fef2f2" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          className="text-gray-900 mb-2 text-center"
          style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          CleanDesk ran into a problem
        </h1>

        <p
          className="text-gray-400 text-center mb-6"
          style={{ fontSize: "14px", lineHeight: 1.7 }}
        >
          Something unexpected happened. Your data is safe — this is a display
          error only. Try reloading the page.
        </p>

        {import.meta.env.DEV && error?.message && (
          <div
            className="w-full rounded-xl p-4 mb-5 font-mono"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <p className="text-red-500" style={{ fontSize: "12px" }}>
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/login"}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}