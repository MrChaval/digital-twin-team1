"use client";

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createProject } from "@/app/actions/projects";
import { useActionState } from "react";
import { Project } from "@/lib/types";

/**
 * A record mapping icon identifiers to their display names.
 * These icons correspond to Lucide icon components used in the application.
 * 
 * @type {Record<string, string>} - Key is the icon identifier, value is the display name
 */
const availableIcons: Record<string, string> = {
  AlertTriangle: "Alert Triangle",
  Shield: "Shield",
  FileCode: "File Code",
  Lock: "Lock",
  Server: "Server",
  Users: "Users"
};

/**
 * Props for the AddProjectForm component
 * 
 * @interface AddProjectFormProps
 * @property {() => void} onProjectAdded - Callback function triggered when a project is successfully added
 */
interface AddProjectFormProps {
  onProjectAdded: () => void;
}

/**
 * Initial state for the project creation action
 * 
 * @interface ProjectActionState
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Success or error message from the operation
 * @property {Project | null} project - The newly created project or null on failure
 */
interface ProjectActionState {
  success: boolean;
  message: string;
  project: Project | null;
}

/**
 * A form component that allows admins to create new projects.
 * Provides input fields for project details and dynamically manages an array of items.
 * Uses React 19's useActionState for handling server actions with proper state management.
 * 
 * @param {AddProjectFormProps} props - Component props
 * @returns {React.ReactElement} The rendered form component
 */
export default function AddProjectForm({ onProjectAdded }: AddProjectFormProps): React.ReactElement {
  const { toast } = useToast();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState<string>("");
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  // Using the useActionState hook for server action state management
  const initialState: ProjectActionState = {
    success: false,
    message: "",
    project: null
  };
  
  const [state, formAction] = useActionState(createProject, initialState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Effect hook to handle state changes from the server action
   * Manages form reset, success/error toast notifications, and parent component updates
   */
  useEffect(() => {
    if (state?.success) {
      // Reset form on success
      setTitle("");
      setDescription("");
      setSelectedIcon("");
      setItems([]);
      setIsFormVisible(false);
      
      // Show success message
      toast({
        title: "Success",
        description: state.message || "Project created successfully",
      });
      
      // Notify parent component to refresh projects
      onProjectAdded();
    } else if (state?.message) {
      // Show error message if there's a message but success is false
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onProjectAdded]); // Added missing closing bracket for dependency array

  /**
   * Toggles the visibility of the form
   */
  const toggleForm = (): void => {
    setIsFormVisible(!isFormVisible);
  };

  /**
   * Adds a new item to the items array if it's not empty
   * Trims whitespace and resets the input field after adding
   */
  const addItem = (): void => {
    if (newItem.trim() !== "") {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  /**
   * Removes an item from the items array at the specified index
   * 
   * @param {number} index - The index of the item to remove
   */
  const removeItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index));
  };

  /**
   * Handles form submission with client-side validation
   * Converts items array to JSON string and appends to FormData
   * 
   * @param {FormData} formData - The form data captured by the form action
   */
  const handleFormSubmit = async (formData: FormData): Promise<void> => {
    // Client-side validation before submission
    if (!title.trim() || !description.trim() || !selectedIcon || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and add at least one item.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Add items as JSON string to FormData since FormData doesn't support arrays directly
    formData.append('items', JSON.stringify(items));

    // Using formAction from useActionState
    await formAction(formData);

    setIsSubmitting(false);
  };
  
  return (
    <div className="mb-10">
      <Button variant={isFormVisible ? "secondary" : "default"} onClick={toggleForm} className="mb-4">
        {isFormVisible ? "Cancel" : "Add New Project"}
      </Button>
      
      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
            <CardDescription>Create a new project to showcase your services</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Using the form action with the handleFormSubmit wrapper */}
            <form action={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input 
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Penetration Testing"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea 
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="icon" className="text-sm font-medium">Icon</label>
                <Select value={selectedIcon} onValueChange={setSelectedIcon} name="icon">
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableIcons).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="items" className="text-sm font-medium">Items</label>
                <div className="flex space-x-2">
                  <Input 
                    id="newItem"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="e.g., Web Application Testing"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                  />
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {items.length > 0 && (
                  <div className="mt-2">
                    <label className="text-sm font-medium">Added Items:</label>
                    <ul className="mt-1 space-y-1">
                      {items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between bg-primary/10 p-2 rounded-md">
                          <span>{item}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeItem(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}