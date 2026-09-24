import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-[var(--pdcc-border)] bg-white px-2.5 py-1 text-sm text-[var(--pdcc-body)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--pdcc-muted-light)] focus-visible:border-[var(--pdcc-indigo)] focus-visible:ring-2 focus-visible:ring-[var(--pdcc-indigo)]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--pdcc-danger-fg)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
