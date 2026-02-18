"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useAdmin } from "@/hooks/use-admin";

export default function Navbar() {
  const { isAdmin } = useAdmin();

  const adminLink = { 
    href: "/admin", 
    label: "Admin Dashboard" 
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Protagon Defense</span>
          </Link>
        </div>

        {/* Auth Buttons, Admin, and Theme Toggle */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <ThemeToggle />

          {/* Admin dashboard button */}
          <SignedIn>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href={adminLink.href} className="flex items-center gap-2">
                  {adminLink.label}
                </Link>
              </Button>
            )}
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
