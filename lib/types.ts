/**
 * This file contains all types used throughout the application
 * aligned with the Drizzle ORM schema definitions.
 * Using Zod for runtime validation.
 */

import { z } from 'zod';
import { users, subscribers, blogPosts, projects } from './db';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

/**
 * Drizzle-inferred types
 * These types are directly generated from the Drizzle schema
 */
export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export type Subscriber = InferSelectModel<typeof subscribers>;
export type SubscriberInsert = InferInsertModel<typeof subscribers>;

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type BlogPostInsert = InferInsertModel<typeof blogPosts>;

export type Project = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;

/**
 * Possible user roles in the system
 */
export const userRoleEnum = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof userRoleEnum>;

/**
 * Base types for React 19 Server Action states
 * These are used with useActionState hook
 */
export type ActionStatus = "idle" | "submitting" | "success" | "error";

export interface ActionState {
  status: ActionStatus;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Zod schemas for validation
 * These schemas are used for runtime validation of data
 */
export const userSchema = createSelectSchema(users).extend({
  role: userRoleEnum,
  // Ensure proper type handling for dates from DB
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});

export const userInsertSchema = createInsertSchema(users).extend({
  role: userRoleEnum,
});

export const subscriberSchema = createSelectSchema(subscribers).extend({
  // Ensure proper type handling for dates from DB
  created_at: z.date().nullable(),
});

export const subscriberInsertSchema = createInsertSchema(subscribers);

export const blogPostSchema = createSelectSchema(blogPosts).extend({
  // Ensure proper type handling for dates from DB
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});

export const blogPostInsertSchema = createInsertSchema(blogPosts);

/**
 * Project schema needs special handling for items field (JSON in database)
 */
export const projectSchema = createSelectSchema(projects).extend({
  // Handle JSON data for items array
  items: z.array(z.string()),
  // Ensure proper type handling for dates from DB - Use camelCase to match Drizzle schema
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const projectInsertSchema = createInsertSchema(projects).extend({
  // Ensure items is always an array of strings
  items: z.array(z.string()),
});

/**
 * Input schema for creating a new project
 */
export const projectCreateInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  items: z.array(z.string()),
});

/**
 * Input type for creating a new project derived from schema
 */
export type ProjectCreateInput = z.infer<typeof projectCreateInputSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSubscriptionSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  name: z.string().optional(),
});

export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;
