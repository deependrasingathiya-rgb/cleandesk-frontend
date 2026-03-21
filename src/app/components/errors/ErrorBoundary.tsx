// src/app/components/errors/ErrorBoundary.tsx

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string; // optional label for logging e.g. "AttendancePage"
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production you'd send this to a logging service
    console.error(
      `[ErrorBoundary]${this.props.section ? ` [${this.props.section}]` : ""}`,
      error,
      info.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          section={this.props.section}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  section,
  onReset,
}: {
  error: Error | null;
  section?: string;
  onReset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center p-12"
      style={{ minHeight: "400px" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: "#fef2f2" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2
        className="text-gray-900 mb-2"
        style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}
      >
        Something went wrong
      </h2>

      <p
        className="text-gray-400 text-center mb-1"
        style={{ fontSize: "14px", maxWidth: "360px", lineHeight: 1.6 }}
      >
        {section
          ? `An unexpected error occurred in ${section}.`
          : "An unexpected error occurred."}
        {" "}Your other work is safe.
      </p>

      {/* Show error message in development only */}
      {import.meta.env.DEV && error?.message && (
        <p
          className="text-red-400 text-center mb-6 font-mono"
          style={{ fontSize: "12px", maxWidth: "480px" }}
        >
          {error.message}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          style={{ fontSize: "13.5px", fontWeight: 600 }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}