"use client";

import * as React from "react";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  type: AccordionType;
  collapsible: boolean;
  openValues: string[];
  toggle: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null
);

type AccordionProps = {
  type?: AccordionType;
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Accordion({
  type = "single",
  collapsible = true,
  className,
  children,
}: AccordionProps) {
  const [openValues, setOpenValues] = React.useState<string[]>([]);

  const toggle = React.useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        const isOpen = prev.includes(value);

        if (type === "multiple") {
          if (isOpen) return prev.filter((v) => v !== value);
          return [...prev, value];
        }

        if (isOpen) return collapsible ? [] : prev;
        return [value];
      });
    },
    [collapsible, type]
  );

  const ctx = React.useMemo<AccordionContextValue>(
    () => ({ type, collapsible, openValues, toggle }),
    [type, collapsible, openValues, toggle]
  );

  return (
    <AccordionContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemContextValue = {
  value: string;
  open: boolean;
  toggle: () => void;
};

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

type AccordionItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function AccordionItem({
  value,
  className,
  children,
}: AccordionItemProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within Accordion");

  const open = ctx.openValues.includes(value);
  const toggle = React.useCallback(() => ctx.toggle(value), [ctx, value]);

  return (
    <AccordionItemContext.Provider value={{ value, open, toggle }}>
      <div className={className}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

type AccordionTriggerProps = {
  className?: string;
  children: React.ReactNode;
};

export function AccordionTrigger({
  className,
  children,
}: AccordionTriggerProps) {
  const ctx = React.useContext(AccordionItemContext);
  if (!ctx)
    throw new Error("AccordionTrigger must be used within AccordionItem");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={ctx.toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ctx.toggle();
        }
      }}
      aria-expanded={ctx.open}
      className={className}
    >
      {children}
    </div>
  );
}

type AccordionContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function AccordionContent({
  className,
  children,
}: AccordionContentProps) {
  const ctx = React.useContext(AccordionItemContext);
  if (!ctx)
    throw new Error("AccordionContent must be used within AccordionItem");

  if (!ctx.open) return null;
  return <div className={className}>{children}</div>;
}
