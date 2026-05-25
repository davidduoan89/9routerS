"use client";

import { cn } from "@/shared/utils/cn";

export function Spinner({ size = "md", className }) {
  const sizes = {
    sm: "size-4",
    md: "size-5",
    lg: "size-7",
    xl: "size-10",
  };

  return (
    <span
      className={cn(
        "material-symbols-outlined animate-spin text-text-muted",
        sizes[size],
        className
      )}
    >
      progress_activity
    </span>
  );
}

export function PageLoading({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
      <Spinner size="xl" />
      <p className="mt-3 text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-2",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <Skeleton className="h-6 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export default function Loading({ type = "spinner", ...props }) {
  switch (type) {
    case "page":
      return <PageLoading {...props} />;
    case "skeleton":
      return <Skeleton {...props} />;
    case "card":
      return <CardSkeleton {...props} />;
    default:
      return <Spinner {...props} />;
  }
}
