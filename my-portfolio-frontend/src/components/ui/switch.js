
import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked = false, onCheckedChange, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "h-6 w-10 rounded-full border transition flex items-center",
        checked ? "bg-primary border-primary" : "bg-muted border-border",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-white shadow transition ml-1",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
