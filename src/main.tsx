import "./app/api";

import { createRoot } from "react-dom/client";
import { useState } from "react";
import App from "./app/App.tsx";
import "./styles/index.css";
import { ErrorBoundary } from "./app/components/errors/ErrorBoundary";
import { RootErrorFallback } from "./app/components/errors/RootErrorFallback";

function Root() {
  const [errorKey, setErrorKey] = useState(0);

  return (
    <ErrorBoundary
      fallback={
        <RootErrorFallback
          error={null}
          onReset={() => setErrorKey((k) => k + 1)}
        />
      }
    >
      <App key={errorKey} />
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);