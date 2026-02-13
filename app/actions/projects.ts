"use server";

import { db, projects } from "@/lib/db";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  Project,
  projectCreateInputSchema,
  projectSchema
} from "@/lib/types";
import { logAuditEvent } from "@/lib/security/audit";
import { requireAdminSession } from "@/lib/security/session";
import { sanitizeError } from "@/lib/security/errors";

/**
 * Server action to fetch all projects
 * Uses Drizzle schema types directly
 * Public read - no authentication required (read-only operation)
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
    const sanitized = sanitizeError(error, "DB_003");
    // For read operations, we can throw to indicate failure
    throw new Error(sanitized.publicMessage);
  }
}

/**
 * Server action to create a new project
 * Uses revised server actions pattern with typed responses
 * Requires admin authentication and logs all actions
 */
export async function createProject(
  prevState: { success: boolean; message: string; project: Project | null } | null,
  formData: FormData | z.infer<typeof projectCreateInputSchema>
) {
  let currentUser = null;
  
  try {
    // Require admin session with revalidation
    currentUser = await requireAdminSession();
    
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
          await logAuditEvent({
            userId: currentUser.clerkId,
            userEmail: currentUser.email,
            action: "PROJECT_CREATE",
            resourceType: "project",
            status: "failed",
            metadata: { reason: "Invalid items format", error: String(e) }
          });
          
          return { 
            success: false, 
            message: "Invalid items data format", 
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
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "PROJECT_CREATE",
        resourceType: "project",
        status: "failed",
        metadata: { reason: "Validation error", errors: validatedData.error.errors }
      });
      
      return { 
        success: false, 
        message: "Validation error: " + validatedData.error.errors[0]?.message, 
        project: null 
      };
    }
    
    // Insert the new project into the database
    const inserted = await db.insert(projects).values({
      title: validatedData.data.title,
      description: validatedData.data.description,
      icon: validatedData.data.icon,
      items: validatedData.data.items,
    }).returning();

    if (!inserted || inserted.length === 0) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "PROJECT_CREATE",
        resourceType: "project",
        status: "failed",
        metadata: { reason: "Database insert failed" }
      });
      
      return { 
        success: false, 
        message: "Failed to create project in database.", 
        project: null 
      };
    }

    // Parse the newly inserted project data
    const newProject = projectSchema.parse({
      ...inserted[0],
      items: typeof inserted[0].items === 'string' ? JSON.parse(inserted[0].items) : inserted[0].items,
    });
    
    // Log successful project creation
    await logAuditEvent({
      userId: currentUser.clerkId,
      userEmail: currentUser.email,
      action: "PROJECT_CREATE",
      resourceType: "project",
      resourceId: newProject.id.toString(),
      status: "success",
      metadata: {
        projectTitle: newProject.title,
        projectId: newProject.id
      }
    });
    
    // Revalidate the path to update the cache
    revalidatePath("/projects");

    return { 
      success: true, 
      message: "Project created successfully!", 
      project: newProject
    };
    
  } catch (error) {
    // Log failed project creation
    if (currentUser) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "PROJECT_CREATE",
        resourceType: "project",
        status: "failed",
        metadata: { error: String(error) }
      });
    }
    
    console.error("Error creating project:", error);
    const sanitized = sanitizeError(error, "DB_004");
    return { 
      success: false, 
      message: sanitized.publicMessage, 
      project: null 
    };
  }
}