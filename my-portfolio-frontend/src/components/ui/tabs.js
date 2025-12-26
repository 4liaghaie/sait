
import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext();

export function Tabs({ defaultValue, value: controlled, onValueChange, className, children }) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;
  const setValue = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return <div className={cn("inline-flex items-center gap-2 rounded-full p-1", className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-full transition border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/60 text-foreground border-transparent hover:border-border"
      , className)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
