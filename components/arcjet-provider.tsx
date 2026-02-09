"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ArcjetProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Call protection API for client-side navigation
    async function checkProtection() {
      try {
        const response = await fetch("/api/protection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok && response.status === 429) {
          // Rate limited - reload to show error page
          window.location.reload();
        } else if (!response.ok && response.status === 403) {
          // Blocked by security policy
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Protection check failed:", error);
      }
    }

    checkProtection();
  }, [pathname]);

  return <>{children}</>;
}
