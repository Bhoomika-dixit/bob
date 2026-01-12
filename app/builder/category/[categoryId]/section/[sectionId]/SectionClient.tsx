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
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  addSubsection,
  setSubsectionName,
  useFormSchema,
  useFormSchemaHydrated,
} from "@/lib/formSchemaStore";

type Props = {
  categoryId: string;
  sectionId: string;
};

export function SectionClient({ categoryId, sectionId }: Props) {
  const router = useRouter();
  const hydrated = useFormSchemaHydrated();
  const formSchema = useFormSchema();

  const category = React.useMemo(
    () => formSchema.categories.find((c) => c.id === categoryId),
    [categoryId, formSchema.categories]
  );

  const section = React.useMemo(
    () => category?.sections.find((s) => s.id === sectionId),
    [category?.sections, sectionId]
  );

  if (!hydrated) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl">
          <CardHeader className="space-y-3">
            <CardTitle>Subsections</CardTitle>
            <div className="flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Loading...
            </div>
          </CardContent>
          <CardFooter />
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Categories &gt; {category?.name ?? "(Unknown Category)"} &gt;{" "}
            {section?.name ?? "(Unknown Section)"}
          </div>
          <CardTitle>Subsections</CardTitle>
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              variant="secondary"
              disabled={!category || !section}
              onClick={() => {
                if (!category || !section) return;
                addSubsection(category.id, section.id);
              }}
            >
              Add Subsection
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!category || !section ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              This section could not be found.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Subsections
                </div>
                <Button
                  variant="secondary"
                  onClick={() => addSubsection(category.id, section.id)}
                >
                  Add Subsection
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {section.subsections.map((subsection) => (
                  <AccordionItem
                    key={subsection.id}
                    value={subsection.id}
                    className="rounded-md border border-neutral-200 dark:border-neutral-800"
                  >
                    <AccordionTrigger className="w-full px-3 py-2 text-left text-sm">
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="truncate">{subsection.name}</div>
                        <button
                          type="button"
                          aria-label={`Open questions for ${subsection.name}`}
                          className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(
                              `/builder/category/${category.id}/section/${section.id}/subsection/${subsection.id}`
                            );
                          }}
                        >
                          →
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-2">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Subsection title
                        </div>
                        <Input
                          value={subsection.name}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const nextName = e.target.value;
                            setSubsectionName(
                              category.id,
                              section.id,
                              subsection.id,
                              nextName
                            );
                          }}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </CardContent>

        <CardFooter />
      </Card>
    </main>
  );
}
