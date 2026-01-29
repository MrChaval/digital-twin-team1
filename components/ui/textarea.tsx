import * as React from "react"

import { cn } from "@/lib/utils"

// Define expected props if any, otherwise remove the interface
// export interface TextareaProps
//   extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
// Replace the interface with a type alias if no additional members are needed
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;


const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
