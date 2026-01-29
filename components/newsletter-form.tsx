"use client"

import { useRef, useEffect } from "react"
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useActionState } from "react"

export function NewsletterForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  
  // Initialize with an initial state
  const initialState: NewsletterState = {
    status: "idle",
    message: ""
  }
  
  // Use the useActionState hook from React/experimental
  const [state, formAction] = useActionState(subscribeToNewsletter, initialState)
  
  // Watch for state changes and show toasts accordingly
  useEffect(() => {
    if (state.status === "success") {
      toast({
        title: "Success!",
        description: state.message,
      })
      // Reset the form on success
      formRef.current?.reset()
    } else if (state.status === "error") {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, toast])
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Input type="text" name="name" placeholder="Your name (optional)" className="bg-background" />
        <div className="flex space-x-2">
          <Input type="email" name="email" placeholder="Your email address" required className="bg-background" />          <Button type="submit" disabled={state.status === "submitting"}>
            {state.status === "submitting" ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        By subscribing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-2">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  )
}
