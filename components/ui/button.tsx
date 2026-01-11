import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary";
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => {
    const variantClassName =
      variant === "secondary"
        ? "bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-100"
        : "bg-gradient-to-r from-pink-600 to-sky-600 text-white hover:from-pink-500 hover:to-sky-500";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:pointer-events-none disabled:opacity-50",
          variantClassName,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
