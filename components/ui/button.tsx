import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
  outline:
    "border border-border bg-card text-card-foreground hover:bg-muted focus-visible:ring-primary",
  ghost:
    "bg-transparent text-card-foreground hover:bg-muted focus-visible:ring-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  lg: "h-11 px-5 py-2.5",
  icon: "size-10",
};

export const buttonClassName = ({
  className,
  size = "default",
  variant = "default",
}: Pick<ButtonProps, "className" | "size" | "variant">) =>
  cn(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size = "default", variant = "default", ...props }, ref) => {
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;

      return React.cloneElement(child, {
        className: cn(buttonClassName({ className, size, variant }), child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        className={buttonClassName({ className, size, variant })}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
