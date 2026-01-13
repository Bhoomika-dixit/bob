"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addQuestion,
  type AnswerType,
  setQuestionPosition,
  setQuestionRoute,
  updateQuestion,
  useFormSchema,
  useFormSchemaHydrated,
} from "@/lib/formSchemaStore";

import ReactFlow, {
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  Background,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";

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
  const hydrated = useFormSchemaHydrated();
  const formSchema = useFormSchema();

  const [activeTab, setActiveTab] = React.useState<"builder" | "graph">(
    "builder"
  );
  const [selectedQuestionId, setSelectedQuestionId] =
    React.useState<string>("");
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string>("");
  const [routeSourceQuestionId, setRouteSourceQuestionId] =
    React.useState<string>("");
  const [routeAnswerValue, setRouteAnswerValue] = React.useState<string>("");
  const [endNodePosition, setEndNodePosition] = React.useState<{
    x: number;
    y: number;
  }>({
    x: 520,
    y: 0,
  });

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

  const questions = subsection?.questions ?? [];

  React.useEffect(() => {
    if (!selectedQuestionId && questions[0]?.id) {
      setSelectedQuestionId(questions[0].id);
    }
  }, [questions, selectedQuestionId]);

  React.useEffect(() => {
    if (!routeSourceQuestionId && questions[0]?.id) {
      setRouteSourceQuestionId(questions[0].id);
    }
  }, [questions, routeSourceQuestionId]);

  React.useEffect(() => {
    const source = questions.find((q) => q.id === routeSourceQuestionId);
    const firstAnswer = source?.routes?.[0]?.answerValue ?? "";
    if (routeSourceQuestionId && !routeAnswerValue && firstAnswer) {
      setRouteAnswerValue(firstAnswer);
    }
  }, [questions, routeAnswerValue, routeSourceQuestionId]);

  const selectedQuestion = React.useMemo(
    () => questions.find((q) => q.id === selectedQuestionId),
    [questions, selectedQuestionId]
  );

  const questionIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) map.set(q.id, q.name || q.id);
    return map;
  }, [questions]);

  const answerTypeOptions: Array<{ value: AnswerType; label: string }> =
    React.useMemo(
      () => [
        { value: "boolean", label: "Yes / No" },
        { value: "single_select", label: "Single choice" },
        { value: "multi_select", label: "Multi choice" },
        { value: "text", label: "Text" },
        { value: "number", label: "Number" },
        { value: "upload", label: "Upload" },
        { value: "multi_field", label: "Multiple field input" },
      ],
      []
    );

  const parseOptions = React.useCallback((raw: string) => {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const optionsString = React.useMemo(() => {
    if (!selectedQuestion) return "";
    return (selectedQuestion.options ?? []).join(", ");
  }, [selectedQuestion]);

  const END_NODE_ID = "__END__";

  const nodes: Node[] = React.useMemo(() => {
    const base: Node[] = questions.map((q, index) => ({
      id: q.id,
      position: q.position ?? { x: 40, y: index * 90 + 40 },
      data: { label: q.name || q.id },
      style: {
        borderRadius: 12,
        border:
          q.id === selectedQuestionId
            ? "2px solid rgb(236 72 153)"
            : "1px solid rgb(226 232 240)",
        padding: 12,
        background: "white",
        minWidth: 220,
      },
    }));

    base.push({
      id: END_NODE_ID,
      position: endNodePosition,
      data: { label: "End" },
      style: {
        borderRadius: 999,
        border: "1px dashed rgb(148 163 184)",
        padding: 12,
        background: "rgb(248 250 252)",
        minWidth: 120,
        textAlign: "center",
      },
    });

    return base;
  }, [endNodePosition, questions, selectedQuestionId]);

  const edges: Edge[] = React.useMemo(() => {
    const result: Edge[] = [];
    for (const q of questions) {
      for (const r of q.routes ?? []) {
        const target = r.nextQuestionId ?? END_NODE_ID;
        result.push({
          id: `${q.id}__${r.answerValue}`,
          source: q.id,
          target,
          label: r.answerValue,
          animated: false,
          style: {
            stroke: "rgb(148 163 184)",
          },
          labelStyle: {
            fill: "rgb(71 85 105)",
            fontSize: 12,
          },
        });
      }
    }
    return result;
  }, [questions]);

  const selectedEdge = React.useMemo(() => {
    return edges.find((e) => e.id === selectedEdgeId);
  }, [edges, selectedEdgeId]);

  const selectedEdgeMeta = React.useMemo(() => {
    if (!selectedEdge) return null;
    const [sourceId, ...rest] = selectedEdge.id.split("__");
    const answerValue = rest.join("__");
    return { sourceId, answerValue };
  }, [selectedEdge]);

  const routeNextQuestionId = React.useMemo(() => {
    const source = questions.find((q) => q.id === routeSourceQuestionId);
    const route = source?.routes?.find(
      (r) => r.answerValue === routeAnswerValue
    );
    return route?.nextQuestionId ?? "";
  }, [questions, routeAnswerValue, routeSourceQuestionId]);

  const handleNodeClick = React.useCallback<NodeMouseHandler>(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === END_NODE_ID) return;
      setSelectedQuestionId(node.id);
      setSelectedEdgeId("");
      setRouteSourceQuestionId(node.id);
      const source = questions.find((q) => q.id === node.id);
      const firstAnswer = source?.routes?.[0]?.answerValue ?? "";
      setRouteAnswerValue(firstAnswer);
    },
    [END_NODE_ID, questions]
  );

  const handleEdgeClick = React.useCallback<EdgeMouseHandler>(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setSelectedEdgeId(edge.id);
      const [sourceId, ...rest] = edge.id.split("__");
      const answerValue = rest.join("__");
      setRouteSourceQuestionId(sourceId);
      setRouteAnswerValue(answerValue);
    },
    []
  );

  const handleNodeDragStop = React.useCallback<NodeDragHandler>(
    (_event, node) => {
      if (node.id === END_NODE_ID) {
        setEndNodePosition(node.position);
        return;
      }
      setQuestionPosition(
        categoryId,
        sectionId,
        subsectionId,
        node.id,
        node.position
      );
    },
    [END_NODE_ID, categoryId, sectionId, subsectionId]
  );

  if (!hydrated) {
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
            Loading...
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-6xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
          </div>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {!category || !section || !subsection ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              This subsection could not be found.
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
            >
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="builder">Question Builder</TabsTrigger>
                  <TabsTrigger value="graph">Logic Map</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      addQuestion(categoryId, sectionId, subsectionId);
                      setActiveTab("builder");
                      setSelectedEdgeId("");
                    }}
                  >
                    Add Question
                  </Button>
                </div>
              </div>

              <TabsContent value="builder">
                <div className="grid gap-4 md:grid-cols-[320px_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">All questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {questions.length === 0 ? (
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          No questions yet.
                        </div>
                      ) : (
                        questions.map((q) => {
                          const isActive = q.id === selectedQuestionId;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              className={
                                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                                (isActive
                                  ? "border-pink-200 bg-pink-50"
                                  : "border-neutral-200 hover:bg-neutral-50")
                              }
                              onClick={() => {
                                setSelectedQuestionId(q.id);
                                setSelectedEdgeId("");
                              }}
                            >
                              <div className="font-medium text-neutral-900">
                                {q.name}
                              </div>
                              <div className="text-xs text-neutral-600">
                                {q.answerType}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Editor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!selectedQuestion ? (
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Select a question to edit.
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              Question name
                            </div>
                            <Input
                              value={selectedQuestion.name}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                updateQuestion(
                                  categoryId,
                                  sectionId,
                                  subsectionId,
                                  selectedQuestion.id,
                                  {
                                    name: e.target.value,
                                  }
                                );
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              Answer type
                            </div>
                            <Select
                              value={selectedQuestion.answerType}
                              onValueChange={(v) => {
                                updateQuestion(
                                  categoryId,
                                  sectionId,
                                  subsectionId,
                                  selectedQuestion.id,
                                  {
                                    answerType: v as AnswerType,
                                  }
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectContent>
                                  {answerTypeOptions.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </SelectTrigger>
                            </Select>
                          </div>

                          {selectedQuestion.answerType === "single_select" ||
                          selectedQuestion.answerType === "multi_select" ? (
                            <div className="space-y-2">
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                Options (comma-separated)
                              </div>
                              <Input
                                value={optionsString}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  updateQuestion(
                                    categoryId,
                                    sectionId,
                                    subsectionId,
                                    selectedQuestion.id,
                                    {
                                      options: parseOptions(e.target.value),
                                    }
                                  );
                                }}
                              />
                            </div>
                          ) : null}

                          <div className="space-y-2">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              Routing (read-only)
                            </div>
                            <div className="space-y-1 rounded-md border border-neutral-200 p-3 text-sm text-neutral-700">
                              {(selectedQuestion.routes ?? []).length === 0 ? (
                                <div className="text-neutral-600">
                                  No routes.
                                </div>
                              ) : (
                                (selectedQuestion.routes ?? []).map((r) => (
                                  <div key={r.answerValue}>
                                    If {r.answerValue} →{" "}
                                    {r.nextQuestionId
                                      ? questionIdToName.get(
                                          r.nextQuestionId
                                        ) ?? r.nextQuestionId
                                      : "End"}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="graph">
                <div className="grid gap-4 md:grid-cols-[1fr_360px]">
                  <div className="h-[70vh] overflow-hidden rounded-md border border-neutral-200">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      fitView
                      onNodeClick={handleNodeClick}
                      onEdgeClick={handleEdgeClick}
                      onNodeDragStop={handleNodeDragStop}
                      nodesConnectable={false}
                      nodesDraggable
                    >
                      <Background />
                      <Controls />
                    </ReactFlow>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Edge editor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-neutral-700">
                        <div>
                          From:{" "}
                          <span className="font-medium">
                            {questionIdToName.get(routeSourceQuestionId) ??
                              "Select a question"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Answer
                        </div>
                        <Select
                          value={routeAnswerValue}
                          onValueChange={(v) => {
                            setRouteAnswerValue(v);
                            setSelectedEdgeId(
                              routeSourceQuestionId && v
                                ? `${routeSourceQuestionId}__${v}`
                                : ""
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectContent>
                              {(
                                questions.find(
                                  (q) => q.id === routeSourceQuestionId
                                )?.routes ?? []
                              ).map((r) => (
                                <SelectItem
                                  key={r.answerValue}
                                  value={r.answerValue}
                                >
                                  {r.answerValue}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </SelectTrigger>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Next question
                        </div>
                        <Select
                          value={routeNextQuestionId}
                          onValueChange={(v) => {
                            if (!routeSourceQuestionId || !routeAnswerValue)
                              return;
                            setQuestionRoute(
                              categoryId,
                              sectionId,
                              subsectionId,
                              routeSourceQuestionId,
                              routeAnswerValue,
                              v || null
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">End</SelectItem>
                              {questions
                                .filter((q) => q.id !== routeSourceQuestionId)
                                .map((q) => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </SelectTrigger>
                        </Select>
                      </div>

                      <Button
                        variant="secondary"
                        disabled={!routeSourceQuestionId}
                        onClick={() => {
                          if (!routeSourceQuestionId) return;
                          setSelectedQuestionId(routeSourceQuestionId);
                          setActiveTab("builder");
                        }}
                      >
                        Open in Question Builder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
