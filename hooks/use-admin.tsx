"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { checkAdminStatus } from "@/app/actions/admin";

/**
 * Custom hook to check if the current user has admin privileges
 * @returns Object containing admin status and loading state
 */
export function useAdmin() {
  const { isSignedIn, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!isLoaded || !isSignedIn) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Use server action instead of API fetch
        const result = await checkAdminStatus();
        // Extract isAdmin from the correct location in the response
        if (result.status === "success" && result.data) {
          setIsAdmin(result.data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [isLoaded, isSignedIn]);

  return { isAdmin, isLoading };
}