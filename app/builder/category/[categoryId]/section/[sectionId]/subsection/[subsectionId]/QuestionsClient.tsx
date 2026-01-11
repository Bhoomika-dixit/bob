"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormSchema } from "@/lib/formSchemaStore";

type Props = {
  categoryId: string;
  sectionId: string;
  subsectionId: string;
};

export function QuestionsClient({
  categoryId,
  sectionId,
  subsectionId,
}: Props) {
  const router = useRouter();
  const formSchema = useFormSchema();

  const category = React.useMemo(
    () => formSchema.categories.find((c) => c.id === categoryId),
    [categoryId, formSchema.categories]
  );

  const section = React.useMemo(
    () => category?.sections.find((s) => s.id === sectionId),
    [category?.sections, sectionId]
  );

  const subsection = React.useMemo(
    () => section?.subsections.find((ss) => ss.id === subsectionId),
    [section?.subsections, subsectionId]
  );

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
          </div>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
          this is a Questions page for this subsection{" "}
          {subsection?.name ?? "(Unknown Subsection)"} of this section{" "}
          {section?.name ?? "(Unknown Section)"} of this category{" "}
          {category?.name ?? "(Unknown Category)"}
        </CardContent>
      </Card>
    </main>
  );
}
