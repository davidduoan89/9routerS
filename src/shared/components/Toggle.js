"use client";

import { cn } from "@/shared/utils/cn";

export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className,
}) {
  const sizes = {
    sm: { track: "w-7 h-4", thumb: "size-3", translate: "translate-x-3" },
    md: { track: "w-10 h-[22px]", thumb: "size-4", translate: "translate-x-[18px]" },
    lg: { track: "w-11 h-6", thumb: "size-4.5", translate: "translate-x-5" },
  };

  const handleClick = () => {
    if (!disabled && onChange) onChange(!checked);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full border",
          "transition-all duration-[180ms]",
          "focus:outline-none",
          checked ? "bg-brand-500 border-brand-500" : "bg-surface-2 border-border",
          sizes[size].track,
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full shadow-sm",
            "transform transition-transform duration-[180ms]",
            checked ? `${sizes[size].translate} bg-white` : "translate-x-0.5 bg-text-main",
            sizes[size].thumb,
            "mt-[2px]"
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm text-text-main">{label}</span>
          )}
          {description && (
            <span className="text-xs text-text-muted">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
