import * as React from "react";

import { BuilderClient } from "./BuilderClient";

export default function BuilderPage() {
  return (
    <React.Suspense fallback={null}>
      <BuilderClient />
    </React.Suspense>
  );
}
