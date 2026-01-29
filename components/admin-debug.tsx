"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export const AdminDebugPanel = () => {
  const { isAdmin, isLoading } = useAdmin();
  const { user, isLoaded } = useUser();
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    console.log("AdminDebugPanel - User:", user);
    console.log("AdminDebugPanel - isAdmin:", isAdmin);
  }, [user, isAdmin]);
  
  if (!user || !isLoaded) return null;
  
  return (
    <div className="fixed bottom-0 right-0 p-2 bg-black/80 text-white text-xs rounded-tl-md z-50 max-w-xs">
      <div className="flex justify-between">
        <span>Admin Debug</span>
        <button onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide" : "Show"}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2 space-y-1">
          <div>User ID: {user.id}</div>
          <div>isAdmin: {String(isAdmin)}</div>
          <div>isLoading: {String(isLoading)}</div>
          <div>Roles: {user.publicMetadata?.roles ? JSON.stringify(user.publicMetadata.roles) : "None"}</div>
          <div className="mt-2 text-yellow-400">
            Check the console for more details
          </div>
        </div>
      )}
    </div>
  );
};
