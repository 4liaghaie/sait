
import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, ...props }) {
  return <hr className={cn("border-border", className)} {...props} />;
}
