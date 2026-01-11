"use client";

import * as React from "react";

export type Subsection = {
  id: string;
  name: string;
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

function persistToStorage(next: StoreState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.formSchema));
  } catch {
    return;
  }
}

hydrateFromStorage();

function emit() {
  for (const l of listeners) l();
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
  const categories: Category[] = Array.from({ length: safeCount }).map((_, idx) => ({
    id: `category-${idx + 1}`,
    name: `Category ${idx + 1}`,
    sections: [],
  }));

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
            const nextSubsection: Subsection = {
              id: `${s.id}-subsection-${nextIndex}`,
              name: nextSubsectionName(s.subsections),
            };
            return { ...s, subsections: [...s.subsections, nextSubsection] };
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

export function useFormSchema() {
  return React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state.formSchema,
    () => state.formSchema,
  );
}
