"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormSchema } from "@/lib/formSchemaStore";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  addSubsection,
  deleteSubsection,
  setSubsectionName,
  setSubsectionStartingHeading,
} from "@/lib/formSchemaStore";

function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function ExportClient() {
  const router = useRouter();
  const formSchema = useFormSchema();

  const exportPayload = React.useMemo(
    () => ({
      categories: formSchema.categories.map(({ id, name, sections }) => ({
        id,
        name,
        sections: sections.map(
          ({ id: sectionId, name: sectionName, subsections }) => ({
            id: sectionId,
            name: sectionName,
            subsections: subsections.map(
              ({
                id: subsectionId,
                name: subsectionName,
                startingHeading,
                questions,
              }) => ({
                id: subsectionId,
                name: subsectionName,
                startingHeading: startingHeading ?? "",
                questions: (questions ?? []).map(
                  ({
                    id: questionId,
                    name: questionName,
                    description,
                    shortform,
                    isStartingQuestion,
                    answerType,
                    options,
                    fields,
                    routes,
                    position,
                  }) => ({
                    id: questionId,
                    name: questionName,
                    description: description ?? "",
                    shortform: shortform ?? "",
                    isStartingQuestion: isStartingQuestion ?? false,
                    answerType,
                    options: options ?? [],
                    fields: (fields ?? []).map(({ id: fieldId, label }) => ({
                      id: fieldId,
                      label,
                    })),
                    routes: (routes ?? []).map(
                      ({ answerValue, nextQuestionId }) => ({
                        answerValue,
                        nextQuestionId,
                      })
                    ),
                    position: position ?? null,
                  })
                ),
              })
            ),
          })
        ),
      })),
    }),
    [formSchema.categories]
  );

  const [activeCategoryId, setActiveCategoryId] = React.useState<string>(
    () => formSchema.categories[0]?.id ?? ""
  );

  React.useEffect(() => {
    if (!formSchema.categories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(formSchema.categories[0]?.id ?? "");
    }
  }, [activeCategoryId, formSchema.categories]);

  const activeCategory = React.useMemo(
    () => formSchema.categories.find((c) => c.id === activeCategoryId),
    [activeCategoryId, formSchema.categories]
  );

  const [activeSectionId, setActiveSectionId] = React.useState<string>("");

  React.useEffect(() => {
    const firstSectionId = activeCategory?.sections[0]?.id ?? "";
    if (!activeCategory) {
      setActiveSectionId("");
      return;
    }
    if (!activeCategory.sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(firstSectionId);
    }
  }, [activeCategory, activeSectionId]);

  const activeSection = React.useMemo(
    () => activeCategory?.sections.find((s) => s.id === activeSectionId),
    [activeCategory?.sections, activeSectionId]
  );

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
          <Button
            onClick={() =>
              downloadJson("question-logic-builder.json", exportPayload)
            }
          >
            Download JSON
          </Button>
        </div>

        <Card className="mb-4">
          <CardHeader className="space-y-3">
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {formSchema.categories.length === 0 ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                No categories available.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formSchema.categories.map((category) => {
                  const isActive = category.id === activeCategoryId;
                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? "default" : "secondary"}
                      onClick={() => setActiveCategoryId(category.id)}
                    >
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter />
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Sections</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!activeCategory ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                No categories available.
              </div>
            ) : activeCategory.sections.length === 0 ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                No sections found in {activeCategory.name}.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {activeCategory.sections.map((section) => {
                    const isActive = section.id === activeSectionId;
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? "default" : "secondary"}
                        onClick={() => setActiveSectionId(section.id)}
                      >
                        {section.name}
                      </Button>
                    );
                  })}
                </div>

                {!activeSection ? (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select a section to manage subsections.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                    <Card>
                      <CardHeader className="space-y-3">
                        <CardTitle>Subsections</CardTitle>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {activeSection.name}
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              addSubsection(activeCategory.id, activeSection.id)
                            }
                          >
                            Add Subsection
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {activeSection.subsections.length === 0 ? (
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            No subsections yet.
                          </div>
                        ) : (
                          <Accordion
                            type="single"
                            collapsible
                            className="space-y-2"
                          >
                            {activeSection.subsections.map((subsection) => (
                              <AccordionItem
                                key={subsection.id}
                                value={subsection.id}
                                className="rounded-md border border-neutral-200 dark:border-neutral-800"
                              >
                                <AccordionTrigger className="w-full px-3 py-2 text-left text-sm">
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <div className="truncate">
                                      {subsection.name}
                                    </div>
                                    <button
                                      type="button"
                                      aria-label={`Open questions for ${subsection.name}`}
                                      className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        router.push(
                                          `/builder/category/${activeCategory.id}/section/${activeSection.id}/subsection/${subsection.id}`
                                        );
                                      }}
                                    >
                                      →
                                    </button>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Subsection title
                                      </div>
                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          deleteSubsection(
                                            activeCategory.id,
                                            activeSection.id,
                                            subsection.id
                                          )
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                    <Input
                                      value={subsection.name}
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                      ) => {
                                        const nextName = e.target.value;
                                        setSubsectionName(
                                          activeCategory.id,
                                          activeSection.id,
                                          subsection.id,
                                          nextName
                                        );
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-2 pt-3">
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                      Starting heading
                                    </div>
                                    <Input
                                      value={subsection.startingHeading ?? ""}
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                      ) => {
                                        setSubsectionStartingHeading(
                                          activeCategory.id,
                                          activeSection.id,
                                          subsection.id,
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Coming soon</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
                        Coming soon
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter />
        </Card>
      </div>
    </main>
  );
}
