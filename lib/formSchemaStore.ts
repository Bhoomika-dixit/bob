"use client";

import * as React from "react";

export type Subsection = {
  id: string;
  name: string;
  startingHeading?: string;
  questions?: Question[];
};

export type AnswerType =
  | "boolean"
  | "single_select"
  | "multi_select"
  | "text"
  | "number"
  | "upload"
  | "multi_field";

export type QuestionRoute = {
  answerValue: string;
  nextQuestionId: string | null;
};

export type MultiField = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  name: string;
  description?: string;
  shortform?: string;
  isStartingQuestion?: boolean;
  answerType: AnswerType;
  options?: string[];
  fields?: MultiField[];
  routes?: QuestionRoute[];
  position?: { x: number; y: number };
};

export type Section = {
  id: string;
  name: string;
  subsections: Subsection[];
};

export type Category = {
  id: string;
  name: string;
  sections: Section[];
};

export type FormSchema = {
  categories: Category[];
};

type StoreState = {
  formSchema: FormSchema;
  initializedCount: number | null;
};

type Listener = () => void;

let state: StoreState = { formSchema: { categories: [] }, initializedCount: null };
const listeners = new Set<Listener>();

let hasHydratedFromStorage = false;

const STORAGE_KEY = "question-logic-builder.formSchema";

function canUseStorage() {
  return typeof window !== "undefined";
}

function hydrateFromStorage() {
  if (!canUseStorage()) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("categories" in (parsed as any)) ||
      !Array.isArray((parsed as any).categories)
    ) {
      return;
    }

    const nextFormSchema = parsed as FormSchema;
    const nextInitializedCount = nextFormSchema.categories.length;
    state = { formSchema: nextFormSchema, initializedCount: nextInitializedCount };
  } catch {
    return;
  }
}

function hydrateFromStorageOnce() {
  if (hasHydratedFromStorage) return;
  if (!canUseStorage()) return;
  hasHydratedFromStorage = true;

  const prevState = state;
  hydrateFromStorage();
  if (state !== prevState) {
    emit();
  }
}

function persistToStorage(next: StoreState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.formSchema));
  } catch {
    return;
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: StoreState) {
  state = next;
  persistToStorage(next);
  emit();
}

function clampCount(count: number) {
  return Math.min(10, Math.max(1, count));
}

function createFormSchema(categoryCount: number): FormSchema {
  const safeCount = clampCount(categoryCount);
  const categories: Category[] = Array.from({ length: safeCount }).map((_, idx) => {
    const categoryId = `category-${idx + 1}`;
    const sectionId = `${categoryId}-section-1`;
    const subsectionId = `${sectionId}-subsection-1`;
    const firstQuestionId = `${subsectionId}-question-1`;

    return {
      id: categoryId,
      name: `Category ${idx + 1}`,
      sections: [
        {
          id: sectionId,
          name: "Section 1",
          subsections: [
            {
              id: subsectionId,
              name: "Subsection 1",
              startingHeading: "",
              questions: [
                {
                  id: firstQuestionId,
                  name: "Question 1",
                  description: "",
                  shortform: "",
                  isStartingQuestion: true,
                  answerType: "boolean",
                  routes: [
                    { answerValue: "Yes", nextQuestionId: null },
                    { answerValue: "No", nextQuestionId: null },
                  ],
                  position: { x: 40, y: 40 },
                },
              ],
            },
          ],
        },
      ],
    };
  });

  return { categories };
}

function nextSectionName(sections: Section[]) {
  return `Section ${sections.length + 1}`;
}

function nextSubsectionName(subsections: Subsection[]) {
  return `Subsection ${subsections.length + 1}`;
}

export function initFormSchemaFromCategoryCount(categoryCount: number) {
  const safeCount = clampCount(categoryCount);
  if (state.formSchema.categories.length > 0 && state.initializedCount === null) {
    setState({
      initializedCount: state.formSchema.categories.length,
      formSchema: state.formSchema,
    });
    return;
  }
  if (state.initializedCount === safeCount && state.formSchema.categories.length > 0) {
    return;
  }

  const next = createFormSchema(safeCount);
  setState({ formSchema: next, initializedCount: safeCount });
}

export function setCategoryName(categoryId: string, name: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) =>
        c.id === categoryId ? { ...c, name } : c,
      ),
    },
  });
}

export function addSection(categoryId: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const nextIndex = c.sections.length + 1;
        const nextSection: Section = {
          id: `${c.id}-section-${nextIndex}`,
          name: nextSectionName(c.sections),
          subsections: [],
        };
        return { ...c, sections: [...c.sections, nextSection] };
      }),
    },
  });
}

export function deleteSection(categoryId: string, sectionId: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return { ...c, sections: c.sections.filter((s) => s.id !== sectionId) };
      }),
    },
  });
}

export function setSectionName(categoryId: string, sectionId: string, name: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)),
        };
      }),
    },
  });
}

export function addSubsection(categoryId: string, sectionId: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const nextIndex = s.subsections.length + 1;
            const nextSubsectionId = `${s.id}-subsection-${nextIndex}`;
            const firstQuestionId = `${nextSubsectionId}-question-1`;
            const nextSubsection: Subsection = {
              id: nextSubsectionId,
              name: nextSubsectionName(s.subsections),
              startingHeading: "",
              questions: [
                {
                  id: firstQuestionId,
                  name: "Question 1",
                  description: "",
                  shortform: "",
                  isStartingQuestion: true,
                  answerType: "boolean",
                  routes: [
                    { answerValue: "Yes", nextQuestionId: null },
                    { answerValue: "No", nextQuestionId: null },
                  ],
                },
              ],
            };
            return { ...s, subsections: [...s.subsections, nextSubsection] };
          }),
        };
      }),
    },
  });
}

export function deleteSubsection(
  categoryId: string,
  sectionId: string,
  subsectionId: string
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.filter((ss) => ss.id !== subsectionId),
            };
          }),
        };
      }),
    },
  });
}

function getAnswerValues(answerType: AnswerType, options: string[] | undefined) {
  if (answerType === "boolean") return ["Yes", "No"];
  if (answerType === "single_select" || answerType === "multi_select") {
    return (options ?? []).filter(Boolean);
  }
  return ["Next"];
}

function upsertRoute(
  routes: QuestionRoute[] | undefined,
  answerValue: string,
  nextQuestionId: string | null
) {
  const next = [...(routes ?? [])];
  const idx = next.findIndex((r) => r.answerValue === answerValue);
  if (idx === -1) next.push({ answerValue, nextQuestionId });
  else next[idx] = { answerValue, nextQuestionId };
  return next;
}

export function addQuestion(categoryId: string, sectionId: string, subsectionId: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                const nextIndex = questions.length + 1;
                const nextQuestionId = `${ss.id}-question-${nextIndex}`;
                const nextQuestion: Question = {
                  id: nextQuestionId,
                  name: `Question ${nextIndex}`,
                  description: "",
                  shortform: "",
                  isStartingQuestion: false,
                  answerType: "boolean",
                  routes: [
                    { answerValue: "Yes", nextQuestionId: null },
                    { answerValue: "No", nextQuestionId: null },
                  ],
                  position: { x: 40, y: (nextIndex - 1) * 90 + 40 },
                };
                return { ...ss, questions: [...questions, nextQuestion] };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function deleteQuestion(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return { ...ss, questions: questions.filter((q) => q.id !== questionId) };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function setQuestionPosition(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  position: { x: number; y: number }
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) =>
                    q.id === questionId ? { ...q, position } : q
                  ),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function updateQuestion(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  patch: Partial<
    Pick<
      Question,
      "name" | "description" | "shortform" | "isStartingQuestion" | "answerType" | "options" | "fields"
    >
  >
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const nextAnswerType = patch.answerType ?? q.answerType;
                    const nextOptions = patch.options ?? q.options;
                    const answerValues = getAnswerValues(nextAnswerType, nextOptions);
                    const existingRoutes = q.routes ?? [];
                    const nextRoutes = answerValues.map((av) => {
                      const existing = existingRoutes.find((r) => r.answerValue === av);
                      return { answerValue: av, nextQuestionId: existing?.nextQuestionId ?? null };
                    });
                    return {
                      ...q,
                      ...patch,
                      routes: nextRoutes,
                    };
                  }),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function addMultiField(categoryId: string, sectionId: string, subsectionId: string, questionId: string) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const fields = q.fields ?? [];
                    const nextIndex = fields.length + 1;
                    const nextField: MultiField = {
                      id: `${q.id}-field-${nextIndex}`,
                      label: `Field ${nextIndex}`,
                    };
                    return { ...q, fields: [...fields, nextField] };
                  }),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function setMultiFieldLabel(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  fieldId: string,
  label: string
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const fields = q.fields ?? [];
                    return {
                      ...q,
                      fields: fields.map((f) => (f.id === fieldId ? { ...f, label } : f)),
                    };
                  }),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function removeMultiField(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  fieldId: string
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const fields = q.fields ?? [];
                    return { ...q, fields: fields.filter((f) => f.id !== fieldId) };
                  }),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function setQuestionRoute(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  answerValue: string,
  nextQuestionId: string | null
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) => {
                if (ss.id !== subsectionId) return ss;
                const questions = ss.questions ?? [];
                return {
                  ...ss,
                  questions: questions.map((q) => {
                    if (q.id !== questionId) return q;
                    return {
                      ...q,
                      routes: upsertRoute(q.routes, answerValue, nextQuestionId),
                    };
                  }),
                };
              }),
            };
          }),
        };
      }),
    },
  });
}

export function setSubsectionName(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  name: string,
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) =>
                ss.id === subsectionId ? { ...ss, name } : ss,
              ),
            };
          }),
        };
      }),
    },
  });
}

export function setSubsectionStartingHeading(
  categoryId: string,
  sectionId: string,
  subsectionId: string,
  startingHeading: string
) {
  setState({
    initializedCount: state.initializedCount,
    formSchema: {
      ...state.formSchema,
      categories: state.formSchema.categories.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              subsections: s.subsections.map((ss) =>
                ss.id === subsectionId ? { ...ss, startingHeading } : ss
              ),
            };
          }),
        };
      }),
    },
  });
}

export function useFormSchema() {
  React.useEffect(() => {
    hydrateFromStorageOnce();
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => state.formSchema,
    () => state.formSchema,
  );
}

export function useFormSchemaHydrated() {
  React.useEffect(() => {
    hydrateFromStorageOnce();
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => hasHydratedFromStorage,
    () => false,
  );
}
