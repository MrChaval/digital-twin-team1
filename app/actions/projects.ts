"use server";

import { db, projects } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  Project,
  projectCreateInputSchema,
  projectSchema
} from "@/lib/types";

/**
 * Server action to fetch all projects
 * Uses Drizzle schema types directly
 */
export async function getProjects(): Promise<Project[]> {
  try {
    // Fetch all projects from the database
    const allProjects = await db.select().from(projects).orderBy(asc(projects.id));
    
    // Parse with Zod schema to ensure type safety, using correct camelCase field names
    return allProjects.map(project => projectSchema.parse({
      id: project.id,
      title: project.title,
      description: project.description,
      icon: project.icon,
      items: project.items, // items should already be parsed correctly if stored as JSON
      createdAt: project.createdAt, // Use camelCase
      updatedAt: project.updatedAt  // Use camelCase
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    // Consider re-throwing a more specific error or returning an empty array
    // depending on how you want the frontend to handle this failure.
    // For now, re-throwing to indicate failure.
    throw new Error("Failed to fetch projects due to data parsing or DB error.");
  }
}

/**
 * Server action to create a new project
 * Uses revised server actions pattern with typed responses
 */
export async function createProject(
  prevState: { success: boolean; message: string; project: Project | null } | null,
  formData: FormData | z.infer<typeof projectCreateInputSchema>
) {
  try {
    // Check if the user is an admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return { 
        success: false, 
        message: "Unauthorized. Only admins can create projects.", 
        project: null 
      };
    }
    
    // Handle both FormData and direct object submission
    let data: z.infer<typeof projectCreateInputSchema>;
    
    if (formData instanceof FormData) {
      // Extract data from FormData
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const icon = formData.get('icon') as string;
      
      // Handle items array from FormData - assuming it's JSON string
      let items: string[] = [];
      const itemsData = formData.get('items');
      if (itemsData) {
        try {
          items = JSON.parse(itemsData as string);
        } catch (e) {
          return { 
            success: false, 
            message: "Invalid items data format" + (e instanceof Error ? `: ${e.message}` : ""), 
            project: null 
          };
        }
      }
      
      data = { title, description, icon, items };
    } else {
      // Direct object submission
      data = formData;
    }
    
    // Validate input data using Zod schema
    const validatedData = projectCreateInputSchema.safeParse(data);
    if (!validatedData.success) {
      return { 
        success: false, 
        message: "Validation error: " + validatedData.error.message, 
        project: null 
      };
    }
    
    // Insert the new project into the database
    // Drizzle handles createdAt/updatedAt automatically if defaultNow() is set in schema
    const inserted = await db.insert(projects).values({
      title: validatedData.data.title,
      description: validatedData.data.description,
      icon: validatedData.data.icon,
      items: validatedData.data.items, // Ensure items are correctly formatted JSON for DB if needed
    }).returning(); // Add returning() to get the inserted project data

    if (!inserted || inserted.length === 0) {
      return { 
        success: false, 
        message: "Failed to create project in database.", 
        project: null 
      };
    }

    // Parse the newly inserted project data to ensure it matches the Project type
    const newProject = projectSchema.parse({
      ...inserted[0],
      // Ensure items is parsed correctly if it comes back from DB differently
      items: typeof inserted[0].items === 'string' ? JSON.parse(inserted[0].items) : inserted[0].items,
    });
    
    // Revalidate the path to update the cache
    revalidatePath("/projects");

    return { 
      success: true, 
      message: "Project created successfully!", 
      project: newProject // Return the parsed new project
    };
    
  } catch (error) {
    console.error("Error creating project:", error);
    // Provide a more generic error message to the client
    return { 
      success: false, 
      message: "An unexpected error occurred while creating the project.", 
      project: null 
    };
  }
}