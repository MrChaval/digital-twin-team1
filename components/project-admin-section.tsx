"use client";

import { useRouter } from "next/navigation";
import AddProjectForm from "./add-project-form";
import { useAdmin } from "@/hooks/use-admin";

export default function ProjectAdminSection() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();
  
  // Function to refresh the page when a new project is added
  const handleProjectAdded = () => {
    router.refresh();
  };
  
  // Only render for admins
  if (isLoading) {
    return <div className="container px-4 md:px-6 pt-8">Loading admin access...</div>;
  }
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="container px-4 md:px-6 pt-8">
      <AddProjectForm onProjectAdded={handleProjectAdded} />
    </div>
  );
}