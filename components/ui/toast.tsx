import { cn } from "@/lib/utils/cn";

export function Toast({
  className,
  message,
  title = "Something went wrong",
}: {
  className?: string;
  message: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-red-200 bg-white p-4 shadow-lg sm:bottom-6 sm:right-6",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}
