import { cn } from "@/lib/utils/cn";

const steps = [
  { title: "Workspace", step: 1 },
  { title: "Company Details", step: 2 },
  { title: "Connect Slack", step: 3 },
  { title: "Done", step: 4 },
];

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Step {currentStep} of 4</span>
        <span>{Math.round((currentStep / 4) * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-950 transition-all"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
      <ol className="grid gap-3 sm:grid-cols-4">
        {steps.map((item) => {
          const isComplete = item.step < currentStep;
          const isCurrent = item.step === currentStep;

          return (
            <li
              key={item.step}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm",
                isCurrent
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isComplete
                    ? "bg-slate-950 text-white"
                    : isCurrent
                      ? "bg-white text-slate-950"
                      : "bg-slate-100 text-slate-500",
                )}
              >
                {isComplete ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3.5 8.5 6.5 11.5 12.5 5.5" />
                  </svg>
                ) : (
                  item.step
                )}
              </span>
              <span className="leading-5">{item.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
