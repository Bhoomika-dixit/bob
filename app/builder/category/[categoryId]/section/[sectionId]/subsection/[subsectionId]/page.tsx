import * as React from "react";

import { QuestionsClient } from "./QuestionsClient";

type Props = {
  params: { categoryId: string; sectionId: string; subsectionId: string };
};

export default function QuestionsPage({ params }: Props) {
  const { categoryId, sectionId, subsectionId } = params;

  return (
    <React.Suspense fallback={null}>
      <QuestionsClient
        categoryId={categoryId}
        sectionId={sectionId}
        subsectionId={subsectionId}
      />
    </React.Suspense>
  );
}
