import * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-teal-200 bg-teal-50 text-teal-800",
        className,
      )}
      {...props}
    />
  );
}
