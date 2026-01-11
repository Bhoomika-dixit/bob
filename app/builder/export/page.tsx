import * as React from "react";

import { ExportClient } from "./ExportClient";

export default function ExportPage() {
  return (
    <React.Suspense fallback={null}>
      <ExportClient />
    </React.Suspense>
  );
}
