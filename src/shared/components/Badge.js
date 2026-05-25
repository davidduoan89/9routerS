"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  default: "bg-surface-3 text-text-muted",
  primary: "bg-accent-soft text-brand-500",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-[11px]",
  lg: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold leading-[1.5]",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-danger",
            variant === "info" && "bg-info",
            variant === "primary" && "bg-brand-500",
            variant === "default" && "bg-text-subtle"
          )}
        />
      )}
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      {children}
    </span>
  );
}
