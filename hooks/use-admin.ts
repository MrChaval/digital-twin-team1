"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { checkIsAdmin } from "@/actions/admin";

export const useAdmin = () => {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when user changes
    setIsLoading(true);
    
    // If no user is logged in, they can't be an admin
    if (!isLoaded || !user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const fetchAdminStatus = async () => {
      try {
        console.log("useAdmin: Checking admin status for user:", user.id);
        
        // Call the server action to check if the user is an admin
        const result = await checkIsAdmin();
        
        console.log("useAdmin: Admin check result:", result);
        setIsAdmin(!!result.isAdmin);
      } catch (error) {
        console.error("useAdmin: Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStatus();
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
};
