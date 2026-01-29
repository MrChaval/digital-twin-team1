import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, pgTable, serial, text, timestamp, varchar, json } from "drizzle-orm/pg-core";


console.log("Initializing database connection...");
// Determine the database connection string
let connectionString: string;

// If DATABASE_URL is provided, use it directly
if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
}
// Otherwise, construct from individual PG* variables
else if (
  process.env.PGHOST &&
  process.env.PGUSER &&
  process.env.PGDATABASE &&
  process.env.PGPASSWORD
) {
  connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;
}
// Fallback (should not happen if environment variables are properly set)
else {
  console.warn(
    "No database credentials found in environment variables. Using fallback connection string."
  );
  connectionString = process.env.DATABASE_URL || "";
}

// Create a SQL query executor using the Neon serverless driver
const sql = neon(connectionString);

// Create a Drizzle instance
export const db = drizzle(sql);

// Define the subscribers table schema - for newsletter subscribers only
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the users table schema - for authentication and role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  clerkId: text("clerk_id").notNull().unique(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  isFirstUser: boolean("is_first_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define the blog posts table schema
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  author: text("author").notNull(),
  readTime: text("read_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define the projects table schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Store the icon name as a string
  items: json("items").notNull(), // Store items as a JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact submissions table removed as requested
