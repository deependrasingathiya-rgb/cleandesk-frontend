// src/app/components/errors/withErrorBoundary.tsx

import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

export function withErrorBoundary(
  children: ReactNode,
  section: string
): ReactNode {
  return (
    <ErrorBoundary section={section}>
      {children}
    </ErrorBoundary>
  );
}