"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-brand-500 hover:bg-brand-400 text-white disabled:opacity-50",
  secondary: "bg-surface-2 hover:bg-surface-3 text-text-main border border-border disabled:opacity-50",
  outline: "bg-transparent border border-border text-text-main hover:bg-surface-2 hover:border-text-subtle",
  ghost: "bg-transparent text-text-muted hover:bg-surface-2 hover:text-text-main",
  danger: "bg-danger hover:bg-red-600 text-white disabled:opacity-50",
  success: "bg-success hover:bg-green-600 text-white disabled:opacity-50",
};

const sizes = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-8 px-3 text-sm rounded-lg",
  lg: "h-10 px-4 text-sm rounded-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-100 cursor-pointer",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[16px]">{iconRight}</span>
      )}
    </button>
  );
}
