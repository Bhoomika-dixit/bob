"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string;
  setValue: (v: string) => void;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const actualValue = value ?? internalValue;

  const setValue = React.useCallback(
    (v: string) => {
      onValueChange?.(v);
      if (value === undefined) setInternalValue(v);
    },
    [onValueChange, value]
  );

  return (
    <SelectContext.Provider value={{ value: actualValue, setValue, disabled }}>
      {children}
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "defaultValue" | "onChange"
>;

const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useSelectContext();

    return (
      <select
        ref={ref}
        value={ctx.value}
        disabled={ctx.disabled || props.disabled}
        onChange={(e) => ctx.setValue(e.target.value)}
        className={cn(
          "h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

type SelectItemProps = React.OptionHTMLAttributes<HTMLOptionElement> & {
  value: string;
};

function SelectItem({ className, ...props }: SelectItemProps) {
  return <option className={className} {...props} />;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SelectValue(_props: { placeholder?: string }) {
  return null;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
