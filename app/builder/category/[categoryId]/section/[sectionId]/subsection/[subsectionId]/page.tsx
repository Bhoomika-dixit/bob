import * as React from "react";

import { QuestionsClient } from "./QuestionsClient";

type Props = {
  params: Promise<{
    categoryId: string;
    sectionId: string;
    subsectionId: string;
  }>;
};

export default async function QuestionsPage({ params }: Props) {
  const { categoryId, sectionId, subsectionId } = await params;

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
