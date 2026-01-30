# Technical Design Document
## Digital Twin Team 1 - "Catch Me If You Can"

**Version:** 1.0  
**Date:** January 30, 2026  
**Generated From:** docs/prd.md  
**Status:** Ready for Implementation

---

## 1. System Overview

### 1.1 Architecture Philosophy
This system follows a **modern serverless architecture** pattern with:
- **Server-first rendering** via Next.js 15 App Router
- **Type-safe data layer** using Drizzle ORM + TypeScript
- **Secure authentication** delegated to Clerk
- **Edge-optimized deployment** on Vercel
- **PostgreSQL as single source of truth** via Neon serverless

### 1.2 Design Principles
1. **Security by Default** - All inputs validated, outputs sanitized, least privilege access
2. **Type Safety** - End-to-end TypeScript with Zod runtime validation
3. **Performance First** - Server components, streaming, optimistic updates
4. **Developer Experience** - Clear separation of concerns, reusable components
5. **Scalability** - Serverless functions, connection pooling, horizontal scaling

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │    Mobile    │  │   Crawler    │         │
│  │  (React 19)  │  │  (Responsive)│  │  (SEO/Bots)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTPS (TLS 1.3)
                             │
┌─────────────────────────────┼────────────────────────────────────┐
│                      Edge Network (Vercel)                        │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────┐        │
│  │          Next.js 15 App Router (SSR/SSG)             │        │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │        │
│  │  │   Pages/    │  │  Components  │  │  Middleware│ │        │
│  │  │  Layouts    │  │   (RSC/RCC)  │  │   (Auth)   │ │        │
│  │  └─────────────┘  └──────────────┘  └────────────┘ │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────┐        │
│  │         Server Actions Layer                         │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│        │
│  │  │   Auth   │ │ Projects │ │   Blog   │ │ Admin  ││        │
│  │  │ Actions  │ │ Actions  │ │ Actions  │ │Actions ││        │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘│        │
│  └──────────────────────────┬──────────────────────────┘        │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                    External Services                              │
│                             │                                     │
│  ┌──────────────┐  ┌───────▼────────┐  ┌──────────────┐        │
│  │    Clerk     │  │  Neon Database │  │   OpenAI     │        │
│  │    (Auth)    │  │  (PostgreSQL)  │  │   (Future)   │        │
│  │              │  │                │  │              │        │
│  │ - OAuth      │  │ - Users        │  │ - Chatbot    │        │
│  │ - Sessions   │  │ - Blog Posts   │  │ - MCP Tools  │        │
│  │ - JWT        │  │ - Projects     │  │              │        │
│  └──────────────┘  │ - Subscribers  │  └──────────────┘        │
│                    │ - Attack Logs  │                           │
│                    └────────────────┘                           │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
app/
├── (routes)
│   ├── page.tsx                    → Homepage (Server Component)
│   ├── blog/
│   │   ├── page.tsx               → Blog list (Server Component)
│   │   └── [slug]/page.tsx        → Blog post (Dynamic Server Component)
│   ├── projects/page.tsx          → Projects showcase (Server Component)
│   ├── admin/
│   │   └── page.tsx               → Admin dashboard (Protected Route)
│   ├── resources/
│   │   ├── guides/page.tsx        → Resource guides
│   │   └── tools/page.tsx         → Security tools
│   └── legal/
│       ├── privacy/page.tsx       → Privacy policy
│       ├── terms/page.tsx         → Terms of service
│       └── cookies/page.tsx       → Cookie policy
│
├── layout.tsx                     → Root layout with providers
├── globals.css                    → Global styles
│
└── actions/                       → Server Actions (API layer)
    ├── auth.ts                    → Authentication sync
    ├── admin.ts                   → Admin role verification
    ├── projects.ts                → Project CRUD operations
    ├── newsletter.ts              → Newsletter subscriptions
    └── database.ts                → Generic DB operations
```

### 2.3 Data Flow Architecture

#### Read Flow (Blog Post Example)
```
1. User navigates to /blog/[slug]
   ↓
2. Next.js Server Component renders
   ↓
3. Import db and blogPosts from lib/db.ts
   ↓
4. Execute: db.select().from(blogPosts).where(eq(blogPosts.slug, slug))
   ↓
5. Drizzle ORM generates parameterized SQL
   ↓
6. Neon executes query via serverless driver
   ↓
7. Result parsed with Zod schema (blogPostSchema)
   ↓
8. HTML streamed to client with data
```

#### Write Flow (Project Creation Example)
```
1. Admin clicks "Add Project" button
   ↓
2. Client component shows form (use client)
   ↓
3. User fills form and submits
   ↓
4. Form calls Server Action: createProject(formData)
   ↓
5. Server Action validates:
   - Checks user is admin (isAdmin())
   - Validates input with Zod (projectCreateInputSchema)
   ↓
6. Server Action executes:
   - db.insert(projects).values({...}).returning()
   ↓
7. Drizzle ORM generates INSERT query
   ↓
8. Neon executes, returns new record
   ↓
9. Server Action calls: revalidatePath("/projects")
   ↓
10. Next.js invalidates cache
   ↓
11. Response returned to client with success/error
   ↓
12. Client shows toast notification
   ↓
13. Page re-renders with new project
```

---

## 3. Component Design

### 3.1 Component Hierarchy

#### Server Components (Default)
- **app/page.tsx** - Homepage with latest blogs
- **app/blog/page.tsx** - Blog listing
- **app/blog/[slug]/page.tsx** - Individual blog post
- **app/projects/page.tsx** - Projects showcase
- **app/layout.tsx** - Root layout with metadata

**Why Server:** No interactivity needed, SEO critical, data fetching on server

#### Client Components ("use client")
- **components/navbar.tsx** - Navigation with state (mobile menu)
- **components/theme-toggle.tsx** - Theme switcher
- **components/auth-sync.tsx** - Auth state synchronization
- **components/newsletter-form.tsx** - Form with validation state
- **components/add-project-form.tsx** - Admin form with input state
- **components/client-project-admin.tsx** - Conditional rendering based on auth
- **hooks/use-admin.tsx** - Admin status hook

**Why Client:** Requires useState, useEffect, event handlers, or Clerk hooks

### 3.2 Key Component Specifications

#### Navbar Component
**File:** `components/navbar.tsx`

**Responsibilities:**
- Display navigation links (Home, About, Blog, Projects)
- Show authentication state (SignIn/SignUp vs UserButton)
- Render admin dashboard link if user is admin
- Responsive mobile menu with Sheet component
- Theme toggle integration

**State:**
- `isMenuOpen` - Mobile menu visibility
- `pathname` - Current route for active link styling
- `isAdmin` - Admin status from useAdmin hook

**Dependencies:**
- Clerk: `SignInButton`, `SignUpButton`, `SignedIn`, `SignedOut`, `UserButton`
- shadcn/ui: `Button`, `Sheet`, `SheetContent`, `SheetTrigger`
- Next.js: `Link`, `usePathname`
- Custom: `useAdmin` hook

**Flow:**
```typescript
1. Component mounts
2. useAdmin() hook checks admin status via Clerk + Server Action
3. Render:
   - Desktop: horizontal nav + auth buttons + theme toggle
   - Mobile: hamburger menu → Sheet with vertical nav
4. If isAdmin: Show "Admin Dashboard" button
5. Active link highlighted based on pathname
```

#### AuthSync Component
**File:** `components/auth-sync.tsx`

**Responsibilities:**
- Automatically sync Clerk users to PostgreSQL
- Assign admin role to first user
- Runs silently on every page load (in root layout)

**Behavior:**
```typescript
useEffect(() => {
  if (isSignedIn && user) {
    syncUser() // Server Action
      - Checks if user exists in DB by clerkId
      - If not exists:
        * Check if any users exist
        * If DB empty → role = "admin", isFirstUser = true
        * Else → role = "user"
      - Insert or update user in DB
      - Return success/error
  }
}, [isSignedIn, user])
```

**Critical:** This ensures first user always becomes admin, no manual intervention

#### Newsletter Form Component
**File:** `components/newsletter-form.tsx`

**Responsibilities:**
- Email input with validation
- Optional name field
- Submit to Server Action
- Show success/error toast

**Validation:**
```typescript
const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().optional()
})
```

**Flow:**
```typescript
1. User enters email
2. Client-side validation on submit
3. If valid → Call subscribeToNewsletter(formData)
4. Server Action:
   - Validates with Zod
   - Checks for duplicate email
   - Inserts into subscribers table
   - Returns success/error
5. Client shows toast notification
6. Form resets on success
```

### 3.3 shadcn/ui Components Used

**Form Components:**
- Button, Input, Textarea, Label
- Checkbox, Radio Group, Select, Switch
- Form (react-hook-form wrapper)

**Layout Components:**
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Separator, Accordion, Collapsible
- Tabs, Sheet, Dialog, Drawer

**Feedback Components:**
- Toast/Sonner (notifications)
- Alert, AlertDialog
- Progress, Skeleton

**Navigation:**
- Navigation Menu, Menubar, Breadcrumb
- DropdownMenu, ContextMenu

**Utility:**
- Tooltip, HoverCard, Popover
- ScrollArea, ResizablePanels
- Avatar, Badge

**Customization:** All components use Tailwind CSS and support dark/light themes

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK, serial)         │
│ email (unique)          │
│ name                    │
│ clerkId (unique)        │◄─────────── Synced from Clerk
│ role (varchar)          │
│ isFirstUser (boolean)   │
│ createdAt (timestamp)   │
│ updatedAt (timestamp)   │
└─────────────────────────┘
          │
          │ (No FK, but logical relationship)
          │
          ▼
┌─────────────────────────┐
│      blogPosts          │
├─────────────────────────┤
│ id (PK, serial)         │
│ title                   │
│ slug (unique)           │
│ excerpt                 │
│ content (text)          │
│ coverImage              │
│ author (string)         │◄─────────── Could be user.name
│ readTime                │
│ createdAt (timestamp)   │
│ updatedAt (timestamp)   │
└─────────────────────────┘

┌─────────────────────────┐
│       projects          │
├─────────────────────────┤
│ id (PK, serial)         │
│ title                   │
│ description             │
│ icon (text)             │
│ items (json)            │◄─────────── JSON array of strings
│ createdAt (timestamp)   │
│ updatedAt (timestamp)   │
└─────────────────────────┘

┌─────────────────────────┐
│     subscribers         │
├─────────────────────────┤
│ id (PK, serial)         │
│ email (unique)          │
│ name                    │
│ createdAt (timestamp)   │
└─────────────────────────┘

┌─────────────────────────┐
│    attackLogs (Future)  │
├─────────────────────────┤
│ id (PK, serial)         │
│ timestamp               │
│ attackType (varchar)    │
│ severity (varchar)      │
│ sourceIp                │
│ targetEndpoint          │
│ payload (text)          │
│ blocked (boolean)       │
│ detectionMethod         │
│ userAgent               │
│ geoLocation (json)      │◄─────────── {country, city}
│ metadata (json)         │◄─────────── Additional data
└─────────────────────────┘
```

### 4.2 Table Specifications

#### users Table
```typescript
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
```

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email` (for quick lookups)
- UNIQUE on `clerkId` (for auth sync)
- INDEX on `role` (for admin queries)

**Constraints:**
- `email` must be valid email format (validated by Zod)
- `role` must be "admin" or "user"
- `clerkId` synced from Clerk, never null

#### blogPosts Table
```typescript
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
```

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `slug` (for URL routing)
- INDEX on `createdAt` (for sorting latest posts)

**Constraints:**
- `slug` must be URL-safe (lowercase, hyphens only)
- `content` can be very long (Markdown or HTML)
- `coverImage` is optional (fallback to placeholder)

#### projects Table
```typescript
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  items: json("items").notNull(), // Array of strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**JSON Structure for `items`:**
```json
[
  "Web Application Testing",
  "Network Infrastructure Testing",
  "Mobile Application Testing",
  "Social Engineering Assessments"
]
```

**Icon Values:** "Shield", "Lock", "Server", "AlertTriangle", "FileCode", "Users"

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `createdAt` (for display order)

### 4.3 Data Migration Strategy

**Initial Setup:**
```bash
npm run db:generate  # Generate SQL from Drizzle schema
npm run db:migrate   # Apply migrations to Neon database
```

**Migration Script:** `scripts/migrate.ts`
```typescript
1. Connect to Neon database
2. Read schema from lib/db.ts
3. Generate CREATE TABLE statements
4. Execute migrations in transaction
5. Log success/failure
```

**Future Migrations:**
- Drizzle Kit tracks schema changes
- Generates incremental migration files
- Version controlled in `drizzle/` folder
- Applied via `npm run db:migrate`

---

## 5. API Design (Server Actions)

### 5.1 Server Actions Architecture

**Why Server Actions over API Routes:**
- ✅ Type-safe end-to-end (client → server → database)
- ✅ No need to define REST endpoints
- ✅ Automatic request/response serialization
- ✅ Built-in error handling
- ✅ Progressive enhancement (works without JS)

**File Organization:**
```
app/actions/
├── auth.ts         → syncUser()
├── admin.ts        → checkIsAdmin()
├── projects.ts     → getProjects(), createProject()
├── newsletter.ts   → subscribeToNewsletter()
└── database.ts     → Generic DB utilities
```

### 5.2 Server Action Specifications

#### syncUser() - Authentication Sync
**File:** `app/actions/auth.ts`

**Signature:**
```typescript
"use server";
export async function syncUser(): Promise<{
  success: boolean;
  user?: { id, email, name, role, isAdmin };
  error?: string;
}>
```

**Implementation:**
```typescript
1. Get current user from Clerk: await currentUser()
2. Extract email and name from Clerk user object
3. Call syncUserWithDatabase(email, name) from lib/auth.ts
   - Check if user exists by email
   - If not exists:
     * Check if database is empty (COUNT users)
     * If empty → role = "admin", isFirstUser = true
     * Else → role = "user", isFirstUser = false
   - INSERT or UPDATE user
4. Return user data with role and isAdmin flag
```

**Error Handling:**
- No authenticated user → `{ success: false, error: "No authenticated user" }`
- Database error → `{ success: false, error: "Failed to sync user" }`

**Called By:** `components/auth-sync.tsx` (useEffect on mount)

#### checkIsAdmin() - Admin Verification
**File:** `actions/admin.ts`

**Signature:**
```typescript
"use server";
export async function checkIsAdmin(): Promise<{
  isAdmin: boolean;
  error?: string;
}>
```

**Implementation:**
```typescript
1. Get authenticated user ID from Clerk: await auth()
2. Query database: db.select().from(users).where(eq(users.clerkId, userId))
3. Check if user.role === "admin"
4. Return { isAdmin: boolean }
```

**Called By:** `hooks/use-admin.ts` (client hook)

#### getProjects() - Fetch All Projects
**File:** `app/actions/projects.ts`

**Signature:**
```typescript
"use server";
export async function getProjects(): Promise<Project[]>
```

**Implementation:**
```typescript
1. Query: db.select().from(projects).orderBy(asc(projects.id))
2. Parse each project with projectSchema (Zod validation)
3. Return array of validated Project objects
```

**Error Handling:**
- Database error → throw Error("Failed to fetch projects")
- Parsing error → filter out invalid projects, log warning

**Called By:** `app/projects/page.tsx` (Server Component)

#### createProject() - Admin Create Project
**File:** `app/actions/projects.ts`

**Signature:**
```typescript
"use server";
export async function createProject(
  prevState: { success, message, project } | null,
  formData: FormData | ProjectCreateInput
): Promise<{ success, message, project }>
```

**Implementation:**
```typescript
1. Check if user is admin: await isAdmin()
2. If not admin → return error
3. Parse formData (handle both FormData and object)
4. Validate with projectCreateInputSchema (Zod)
5. If invalid → return validation errors
6. Insert: db.insert(projects).values({...}).returning()
7. Parse returned project with projectSchema
8. Revalidate: revalidatePath("/projects")
9. Return { success: true, message, project }
```

**Validation:**
```typescript
const projectCreateInputSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().min(1, "Description required"),
  icon: z.string().min(1, "Icon required"),
  items: z.array(z.string()).min(1, "At least one item required")
});
```

**Called By:** `components/add-project-form.tsx` (Client Component form)

#### subscribeToNewsletter() - Newsletter Signup
**File:** `app/actions/newsletter.ts`

**Signature:**
```typescript
"use server";
export async function subscribeToNewsletter(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState>
```

**Implementation:**
```typescript
1. Extract email and name from FormData
2. Validate with newsletterSubscriptionSchema
3. Check if email already exists: db.select().from(subscribers).where(eq(email))
4. If exists → return { status: "error", message: "Already subscribed" }
5. Insert: db.insert(subscribers).values({ email, name })
6. Return { status: "success", message: "Subscribed successfully!" }
```

**Error Handling:**
- Duplicate email → user-friendly message
- Database error → generic error message
- Validation error → field-specific errors

**Called By:** `components/newsletter-form.tsx` (Client Component)

### 5.3 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Authentication Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Sign In" button
   ↓
2. Clerk modal opens (SignInButton component)
   ↓
3. User enters credentials or uses OAuth
   ↓
4. Clerk authenticates user
   ↓
5. Clerk sets JWT token in cookies
   ↓
6. Page redirects/reloads
   ↓
7. middleware.ts (Clerk middleware) runs
   - Verifies JWT token
   - Adds auth() to request context
   ↓
8. Root layout renders
   ↓
9. AuthSync component mounts
   ↓
10. useEffect triggers syncUser() Server Action
    ↓
11. Server Action:
    - Gets current user from Clerk
    - Checks if user exists in DB by clerkId
    - If not exists:
      * Query: SELECT COUNT(*) FROM users
      * If count = 0 → first user → role = "admin"
      * Else → role = "user"
    - INSERT or UPDATE user in DB
    ↓
12. User data now in PostgreSQL
    ↓
13. Subsequent requests can check admin status
    - hooks/use-admin.ts calls checkIsAdmin()
    - Returns isAdmin boolean
    ↓
14. UI conditionally renders admin features
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

#### Clerk Integration
**Authentication Provider:** Clerk handles:
- User registration (email/password, OAuth, magic links)
- Session management (JWT tokens)
- Password hashing and security
- Multi-factor authentication (optional)
- Account verification

**Authorization Strategy:**
- Clerk provides user identity (`userId`, `email`)
- PostgreSQL stores user roles (`admin` or `user`)
- Server Actions check roles before sensitive operations
- Middleware protects routes

**JWT Token Flow:**
```
1. User authenticates → Clerk issues JWT
2. JWT stored in httpOnly cookies (XSS protection)
3. Every request includes JWT
4. middleware.ts (Clerk) validates JWT
5. auth() helper available in Server Components/Actions
6. Server Actions query DB for user role
7. Operations authorized based on role
```

#### Protected Routes
**File:** `middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/resources(.*)',
  '/projects'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})
```

**Behavior:**
- Unauthenticated users redirected to sign-in
- Authenticated users allowed through
- Admin-only features checked in Server Actions (secondary check)

### 6.2 Input Validation & Sanitization

#### Multi-Layer Validation
```
Layer 1: Client-Side (React Hook Form + Zod)
  ↓
Layer 2: Server Action (Zod schema re-validation)
  ↓
Layer 3: Database Constraints (NOT NULL, UNIQUE, etc.)
```

#### Zod Schemas
**File:** `lib/types.ts`

```typescript
// Newsletter validation
export const newsletterSubscriptionSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  name: z.string().optional(),
});

// Project creation validation
export const projectCreateInputSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  description: z.string().min(1, "Description required"),
  icon: z.string().min(1, "Icon required"),
  items: z.array(z.string()).min(1, "At least one item required")
});

// User data validation
export const userSchema = createSelectSchema(users).extend({
  role: z.enum(['admin', 'user']),
});
```

**Validation Process:**
```typescript
const result = schema.safeParse(input);
if (!result.success) {
  // Extract field-level errors
  const errors = result.error.flatten().fieldErrors;
  return { success: false, errors };
}
// Proceed with validated data
const validData = result.data;
```

#### SQL Injection Prevention
**Drizzle ORM Parameterization:**
```typescript
// ✅ SAFE - Parameterized query
db.select().from(users).where(eq(users.email, userEmail))

// Generated SQL:
// SELECT * FROM users WHERE email = $1
// Parameters: [userEmail]

// ❌ UNSAFE - String concatenation (NEVER DO THIS)
// db.execute(`SELECT * FROM users WHERE email = '${userEmail}'`)
```

**All queries use Drizzle's query builder** → automatic parameterization

#### XSS Prevention
**React Built-in Protection:**
- React escapes all dynamic content by default
- No need for manual sanitization in most cases

**Example:**
```tsx
// ✅ SAFE - React escapes html
<h1>{blogPost.title}</h1>
// If title = "<script>alert('xss')</script>"
// Renders as: &lt;script&gt;alert('xss')&lt;/script&gt;

// ⚠️ ONLY USE dangerouslySetInnerHTML for trusted content
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

**Content Security Policy (Future):**
```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://api.clerk.com https://db.neon.tech;
`;
```

### 6.3 Attack Detection Architecture (Planned)

#### Detection Pipeline
```
Request → [Rate Limiter] → [Input Validator] → [Pattern Matcher] → [AI Guardrails] → Application
                ↓               ↓                    ↓                     ↓
          Log if limit    Log if invalid      Log if attack       Log if prompt injection
               exceeded         input             pattern              detected
                                                    ↓
                                              attackLogs table
```

#### Attack Types & Detection

**1. SQL Injection Detection**
```typescript
const sqlInjectionPatterns = [
  /(\bOR\b|\bAND\b).*=.*/, // OR 1=1
  /UNION\s+SELECT/i,
  /DROP\s+TABLE/i,
  /;.*--/, // Comment injection
  /xp_cmdshell/i,
];

function detectSQLInjection(input: string): boolean {
  return sqlInjectionPatterns.some(pattern => pattern.test(input));
}
```

**2. XSS Detection**
```typescript
const xssPatterns = [
  /<script.*?>.*?<\/script>/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
];

function detectXSS(input: string): boolean {
  return xssPatterns.some(pattern => pattern.test(input));
}
```

**3. Prompt Injection Detection (AI Chatbot)**
```typescript
const promptInjectionPatterns = [
  /ignore (previous|all) instructions/i,
  /system prompt/i,
  /you are now/i,
  /jailbreak/i,
  /DAN mode/i,
];

function detectPromptInjection(input: string): boolean {
  return promptInjectionPatterns.some(pattern => pattern.test(input));
}
```

**4. Rate Limiting (Per IP)**
```typescript
// Future: Implement with Redis or Vercel KV
const rateLimiter = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// Track requests per IP
// Block if exceeded
// Log to attackLogs with type: "rate_limit_exceeded"
```

#### Attack Logging
```typescript
async function logAttack(attackData: {
  attackType: 'sql_injection' | 'xss' | 'prompt_injection' | 'brute_force' | 'bot_traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  targetEndpoint: string;
  payload: string;
  blocked: boolean;
  detectionMethod: string;
  userAgent: string;
  geoLocation: { country: string; city: string };
}) {
  await db.insert(attackLogs).values({
    timestamp: new Date(),
    ...attackData
  });
}
```

---

## 7. State Management

### 7.1 State Architecture

**Stateless by Default:** Server Components have no state
- Data fetched fresh on each render
- No useState, useEffect needed
- Automatic cache revalidation

**Client State for Interactivity:**
- Form inputs (controlled components)
- UI toggles (mobile menu, theme, modals)
- Optimistic UI updates
- Local-only state (no server sync)

**Server State (Database):**
- Single source of truth: PostgreSQL
- Accessed via Server Actions
- Revalidated with `revalidatePath()` or `revalidateTag()`

### 7.2 State Management Patterns

#### Pattern 1: Server Component + Database (Read-Only)
**Use Case:** Blog posts, projects showcase, homepage

```tsx
// app/blog/page.tsx (Server Component)
export default async function BlogPage() {
  // Direct database access
  const posts = await db.select().from(blogPosts).orderBy(createdAt);
  
  return (
    <div>
      {posts.map(post => <BlogCard key={post.id} post={post} />)}
    </div>
  );
}
```

**No state management needed** - data fetched on server, rendered to HTML

#### Pattern 2: Client Component + Server Action (Write)
**Use Case:** Forms, admin actions

```tsx
// components/add-project-form.tsx (Client Component)
"use client";

export function AddProjectForm() {
  const [state, formAction] = useActionState(createProject, null);
  
  return (
    <form action={formAction}>
      <input name="title" />
      {state?.errors?.title && <span>{state.errors.title}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

**State managed by:**
- `useActionState` for form state
- Server Action handles validation
- Automatic revalidation on success

#### Pattern 3: Custom Hook + Server Action (Derived State)
**Use Case:** Admin status check

```tsx
// hooks/use-admin.ts
"use client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkIsAdmin().then(result => {
      setIsAdmin(result.isAdmin);
      setIsLoading(false);
    });
  }, []);
  
  return { isAdmin, isLoading };
}
```

**Usage:**
```tsx
const { isAdmin } = useAdmin();

if (isAdmin) {
  return <AdminDashboard />;
}
```

### 7.3 Cache Revalidation Strategy

#### On-Demand Revalidation
```typescript
// After creating a project
await db.insert(projects).values({...});
revalidatePath("/projects"); // Invalidate projects page cache
```

#### Time-Based Revalidation
```typescript
// app/blog/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

#### Tag-Based Revalidation (Future)
```typescript
// Fetch with tag
const posts = await fetch('...', { next: { tags: ['blog-posts'] } });

// Revalidate all blog-related caches
revalidateTag('blog-posts');
```

---

## 8. Deployment Architecture

### 8.1 Vercel Deployment

**Architecture:**
```
                        ┌──────────────────────────┐
                        │   GitHub Repository      │
                        │  (main branch)           │
                        └───────────┬──────────────┘
                                    │
                              Push to main
                                    │
                                    ▼
                        ┌──────────────────────────┐
                        │  Vercel CI/CD            │
                        │  1. Install deps         │
                        │  2. Run build            │
                        │  3. Generate static HTML │
                        │  4. Deploy to Edge       │
                        └───────────┬──────────────┘
                                    │
                                    ▼
                        ┌──────────────────────────┐
                        │  Vercel Edge Network     │
                        │  (Global CDN)            │
                        │                          │
                        │  - Static assets cached  │
                        │  - Serverless functions  │
                        │  - Edge middleware       │
                        └──────────────────────────┘
```

**Build Process:**
```bash
1. npm install
2. npm run build --turbo
   - Compile TypeScript
   - Bundle components
   - Generate static pages (SSG)
   - Prepare serverless functions
3. Deploy to Edge
   - Upload static assets to CDN
   - Deploy serverless functions to regions
   - Configure routing
```

**Environment Variables (Vercel Dashboard):**
```
DATABASE_URL=postgres://...          # Neon connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Clerk public key
CLERK_SECRET_KEY=                    # Clerk secret (server-only)
```

### 8.2 Database Deployment (Neon)

**Connection Strategy:**
- **Serverless Driver:** `@neondatabase/serverless`
- **HTTP Protocol:** No persistent connections (stateless)
- **Connection Pooling:** Handled by Neon (not Prisma)
- **SSL:** Always enabled

**Connection String Format:**
```
postgres://[user]:[password]@[host]/[database]?sslmode=require
```

**Performance Optimization:**
- Queries executed via HTTP (low latency)
- Auto-scaling based on load
- Read replicas (future)

### 8.3 Monitoring & Observability (Future)

**Vercel Analytics:**
- Page views and user sessions
- Web Vitals (LCP, FID, CLS)
- Geographic distribution

**Error Tracking:**
- Server errors logged to Vercel
- Client errors (window.onerror)
- Database query failures

**Security Monitoring:**
- Attack logs in PostgreSQL
- Dashboard for real-time threats
- Alerts for critical attacks (email/Slack)

---

## 9. Testing Strategy (Future)

### 9.1 Testing Pyramid

```
               ┌──────────────┐
               │     E2E      │  ← Playwright (10%)
               │   (UI Flow)  │
               └──────────────┘
              ┌────────────────┐
              │  Integration   │  ← Server Actions + DB (30%)
              └────────────────┘
           ┌──────────────────────┐
           │   Unit Tests         │  ← Components + Utils (60%)
           └──────────────────────┘
```

### 9.2 Test Coverage Goals

**Unit Tests:**
- Utility functions (lib/utils.ts)
- Zod schemas validation
- Component rendering (React Testing Library)

**Integration Tests:**
- Server Actions with mock database
- Authentication flow
- Form submissions

**E2E Tests:**
- User registration → admin assignment
- Blog post viewing
- Project creation (admin)
- Newsletter signup

---

## 10. Performance Optimization

### 10.1 React Server Components Benefits

**Automatic Optimization:**
- ✅ Zero JavaScript for server components
- ✅ Streaming HTML (faster TTFB)
- ✅ Automatic code splitting
- ✅ No hydration overhead for static content

**Example:**
```tsx
// Server Component (NO JS sent to client)
async function BlogList() {
  const posts = await db.select().from(blogPosts);
  return <div>{posts.map(p => <Card>{p.title}</Card>)}</div>;
}

// Client Component (JS sent to client)
"use client";
function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 10.2 Image Optimization

**Next.js Image Component:**
```tsx
import Image from "next/image";

<Image
  src="/blog-cover.jpg"
  alt="Blog post"
  width={600}
  height={400}
  loading="lazy"        // Lazy load below fold
  quality={75}          // Compress to 75% quality
  sizes="(max-width: 768px) 100vw, 600px" // Responsive sizes
/>
```

**Benefits:**
- Automatic WebP conversion
- Responsive images
- Lazy loading
- Blur placeholder

### 10.3 Database Query Optimization

**Indexed Queries:**
```typescript
// Fast - uses index on slug (unique)
db.select().from(blogPosts).where(eq(blogPosts.slug, slug))

// Fast - uses index on createdAt
db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(3)

// Fast - uses unique index on email
db.select().from(users).where(eq(users.clerkId, clerkId))
```

**Avoid N+1 Queries:**
```typescript
// ❌ BAD - Runs 1 query per post
for (const post of posts) {
  const author = await db.select().from(users).where(eq(users.id, post.authorId));
}

// ✅ GOOD - Single query with JOIN
const postsWithAuthors = await db
  .select()
  .from(blogPosts)
  .leftJoin(users, eq(blogPosts.authorId, users.id));
```

---

## 11. Error Handling & Resilience

### 11.1 Error Boundaries (Client)

**React Error Boundary:**
```tsx
// app/error.tsx
"use client";

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 11.2 Server Action Error Handling

**Pattern:**
```typescript
export async function createProject(formData) {
  try {
    const validated = schema.parse(formData);
    const project = await db.insert(projects).values(validated).returning();
    revalidatePath("/projects");
    return { success: true, project };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error.flatten() };
    }
    console.error("Unexpected error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
```

### 11.3 Database Error Handling

**Graceful Degradation:**
```tsx
// app/page.tsx
let latestPosts = [];
let dbError = false;

try {
  latestPosts = await db.select().from(blogPosts).limit(3);
} catch (error) {
  console.error("Database error:", error);
  dbError = true;
}

return (
  <div>
    {dbError ? (
      <Alert>Unable to load blog posts. Please try again later.</Alert>
    ) : (
      latestPosts.map(post => <BlogCard post={post} />)
    )}
  </div>
);
```

---

## 12. Accessibility

### 12.1 WCAG 2.1 Compliance

**Semantic HTML:**
```tsx
<nav>          ← Navigation
<main>         ← Main content
<article>      ← Blog post
<section>      ← Sections
<button>       ← Interactive actions (not divs)
```

**ARIA Labels:**
```tsx
<button aria-label="Toggle mobile menu">
  <Menu className="h-5 w-5" />
</button>
```

**Keyboard Navigation:**
- All interactive elements focusable
- Tab order logical
- Focus indicators visible

**Color Contrast:**
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Checked by shadcn/ui defaults

---

## 13. Technology Justification

### 13.1 Why Next.js 15 App Router?

**Rationale:**
- ✅ Server Components → Zero JS for static content
- ✅ Server Actions → Type-safe API without REST
- ✅ File-based routing → Intuitive organization
- ✅ Automatic code splitting → Faster loads
- ✅ Built-in image optimization
- ✅ Vercel deployment optimization
- ✅ React 19 features (useActionState, etc.)

### 13.2 Why Drizzle ORM?

**Rationale:**
- ✅ Type-safe queries (TypeScript end-to-end)
- ✅ SQL-like syntax (easy to learn)
- ✅ Lightweight (no runtime overhead like Prisma)
- ✅ Excellent Neon integration
- ✅ Zod integration for validation
- ✅ Migration management

### 13.3 Why Clerk for Auth?

**Rationale:**
- ✅ Production-ready (99.9% SLA)
- ✅ Multiple auth methods (OAuth, magic links, email/password)
- ✅ Pre-built UI components
- ✅ Automatic security (JWT, CSRF protection)
- ✅ Free tier sufficient for portfolio
- ✅ Easy role-based access integration

### 13.4 Why shadcn/ui?

**Rationale:**
- ✅ Copy-paste components (no npm dependency bloat)
- ✅ Full customization (source code in project)
- ✅ Tailwind CSS based (consistent styling)
- ✅ Accessible by default
- ✅ Dark/light theme support
- ✅ 40+ production-ready components

---

## 14. Future Enhancements Architecture

### 14.1 AI Chatbot Integration

**Architecture:**
```
User Input (Chat UI)
    ↓
Prompt Injection Detection
    ↓
Server Action: sendChatMessage()
    ↓
OpenAI API (GPT-4)
    ↓
MCP Tools (Read Portfolio Data)
    ↓
Response Validation
    ↓
Stream to Client
```

**MCP Tools:**
- `get_blog_posts()` - Retrieve blog content
- `get_projects()` - Retrieve project data
- `get_profile()` - Team information
- `get_security_stats()` - Attack statistics

### 14.2 Security Dashboard

**Components:**
- Real-time attack feed (Server-Sent Events)
- Attack frequency chart (Recharts)
- Geographic map (Leaflet or Mapbox)
- Severity distribution pie chart
- Recent attacks table (DataTable)

**Data Flow:**
```
attackLogs table
    ↓
Server Action: getAttackStats()
    ↓
Aggregation queries (GROUP BY type, severity)
    ↓
Return to client
    ↓
Charts render with Recharts
```

---

## 15. Approval & Next Steps

### 15.1 Document Status
**Version:** 1.0  
**Status:** ✅ Ready for Implementation  
**Generated:** January 30, 2026  
**AI Model:** Claude Opus 4.5  
**Based On:** docs/prd.md v1.0

### 15.2 Implementation Readiness
This design document provides sufficient detail for:
- ✅ Component implementation
- ✅ Database schema creation
- ✅ Server Actions development
- ✅ Authentication setup
- ✅ Deployment configuration

### 15.3 Next Deliverable
**Create:** `docs/implementation-plan.md`
- Break down design into actionable tasks
- Assign time estimates
- Define dependencies
- Create sprint plan for Weeks 3-6

---

**AI Attribution:** This technical design document was generated using Claude Opus 4.5 from the approved PRD (docs/prd.md). It translates requirements into implementable architecture and serves as the blueprint for development.

**Document Metadata:**
- AI Model: Claude Opus 4.5
- Generation Method: PRD analysis + codebase structure + architecture best practices
- Human Review: Required before implementation
- Last Updated: January 30, 2026
