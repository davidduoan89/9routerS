"use client";

import { cn } from "@/shared/utils/cn";

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  className,
}) {
  const sizes = {
    sm: "h-7 text-xs",
    md: "h-8 text-sm",
    lg: "h-9 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center p-[3px] gap-0.5 rounded-lg overflow-x-auto",
        "bg-surface-2 border border-border",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 px-3.5 rounded-[5px] font-medium transition-all duration-150",
            sizes[size],
            value === option.value
              ? "bg-surface-3 text-text-main"
              : "text-text-muted hover:text-text-main"
          )}
        >
          {option.icon && (
            <span className="material-symbols-outlined text-[15px] mr-1">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
