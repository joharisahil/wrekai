import { cn } from "@/lib/utils/cn";

export function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
}: {
  className?: string;
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      aria-hidden={decorative}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
