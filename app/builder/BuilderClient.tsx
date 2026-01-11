"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  addSection,
  type Category,
  initFormSchemaFromCategoryCount,
  type Section,
  setCategoryName,
  setSectionName,
  useFormSchema,
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

export function BuilderClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const countParam = searchParams.get("count");
  const initialCount = React.useMemo(() => {
    const parsedCount = countParam ? Number(countParam) : NaN;
    return Number.isFinite(parsedCount) ? parsedCount : 1;
  }, [countParam]);

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
              ({ id: subsectionId, name: subsectionName }) => ({
                id: subsectionId,
                name: subsectionName,
              })
            ),
          })
        ),
      })),
    }),
    [formSchema.categories]
  );

  React.useEffect(() => {
    initFormSchemaFromCategoryCount(initialCount);
  }, [initialCount]);

  const [activeTab, setActiveTab] = React.useState<string>(
    () => formSchema.categories[0]?.id ?? ""
  );

  React.useEffect(() => {
    if (!formSchema.categories.some((c) => c.id === activeTab)) {
      setActiveTab(formSchema.categories[0]?.id ?? "");
    }
  }, [activeTab, formSchema.categories]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3">
          <CardTitle>Question Logic Builder</CardTitle>
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Button
                onClick={() =>
                  downloadJson("question-logic-builder.json", exportPayload)
                }
              >
                Download JSON
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/builder/export")}
              >
                Save and Next
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              {formSchema.categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {formSchema.categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Category title
                    </div>
                    <Input
                      value={category.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const nextName = e.target.value;
                        setCategoryName(category.id, nextName);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Sections
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        addSection(category.id);
                      }}
                    >
                      Add Section
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {category.sections.map((section) => (
                      <div
                        key={section.id}
                        className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                      >
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Section title
                        </div>
                        <Input
                          value={section.name}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const nextName = e.target.value;
                            setSectionName(category.id, section.id, nextName);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>

        <CardFooter />
      </Card>
    </main>
  );
}
