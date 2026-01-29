# CyberShield: Cybersecurity Portfolio Application

## Purpose of the app 

This is a demonstrator app that is intended to be used by the Ausbiz Cyber Security Bootcamp to teach the foundations of building, shipping, and securing a modern web application. It serves as a professional portfolio for cybersecurity specialists to showcase their expertise and services.

## Product Vision 

A web-based digital solution that allows cybersecurity professionals to showcase their experience and expertise. The application demonstrates how to secure and protect resources that require authentication, and includes SaaS features that allow authorized users to perform sensitive CRUD operations.

## Application Overview

CyberShield is a comprehensive cybersecurity portfolio application built with Next.js, featuring:

- **Modern UI Components**: Built with a comprehensive UI component library (shadcn/ui)
- **Authentication**: Secure user authentication via Clerk with social login options
- **Role-Based Access Control**: Different privileges for visitors, authenticated users, and administrators
- **Database Integration**: PostgreSQL (Neon) for persistent data storage
- **Server Actions**: Secure server-side operations for data manipulation

## Functional Features

### For Unauthenticated Users
1. **Home Page**: Visually appealing landing page with a high-impact hero section showcasing cybersecurity services
2. **Newsletter Subscription**: Simple form to collect user contact information
3. **Blog Access**: Public access to cybersecurity articles and insights
4. **About Page**: Information about the cybersecurity specialist/company
5. **Legal Pages**: Access to privacy policy, terms of service, and cookie policy

### For Authenticated Users
1. **Project Showcase**: View secured cybersecurity project portfolios and case studies
2. **Resource Access**: View specialized cybersecurity resources, tools, guides, and checklists
3. **Personalized Experience**: User-specific content and interactions

### For Admin Users
1. **User Management**: Control user permissions and roles
2. **Project Administration**: Create, read, update, and delete project entries
3. **Newsletter Management**: View and manage newsletter subscribers
4. **Debugging Tools**: Special admin interfaces for system monitoring

## UI Components and Features

1. **Responsive Design**: Fully responsive layout for all device sizes
2. **Theming Support**: Light/dark mode toggle with system preference detection
3. **Modern UI Elements**: Cards, forms, modals, and other interactive components
4. **Navigation System**: Intuitive navbar and footer for easy site navigation


## Technical Architecture

### Frontend
- **Framework**: Next.js (App Router architecture)
- **Styling**: Tailwind CSS for responsive, utility-first styling
- **Components**: Comprehensive shadcn/ui component library
- **State Management**: React hooks and context for client-side state

### Backend
- **Database**: Vercel Neon PostgreSQL for data persistence
- **ORM**: Drizzle for type-safe database operations
- **Authentication**: Clerk authentication service with social login providers (Google)
- **Server-Side Rendering**: Leveraging Next.js App Router for dynamic server-rendered pages
- **Server Actions**: Implementation of secure server-side operations for data mutations

### Application Structure
- **Middleware**: Route protection and authorization checks
- **Components**: Reusable UI components with clear separation of concerns
- **Hooks**: Custom React hooks for shared functionality
- **Actions**: Server actions for secure data operations
- **Public Assets**: Static images and resources

### Code Organization
- **/app**: Next.js App Router pages and layouts
- **/components**: UI components (both custom and shadcn/ui)
- **/lib**: Utility functions, database connections, and type definitions
- **/hooks**: Custom React hooks for shared functionality
- **/actions**: Server-side actions for data operations
- **/public**: Static assets and images

### Security Features
- **Authentication**: Secure user authentication via Clerk
- **Role-Based Access Control**: Restricted access based on user roles
- **Protected Routes**: Server-side route protection with middleware
- **Server Actions**: Server-side data operations for sensitive transactions

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- pnpm package manager
- PostgreSQL database (Neon)
- Clerk account for authentication

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Clerk Authentication
CLERK_SECRET_KEY="clerk_secret_key_here"
CLERK_PUBLISHABLE_KEY="clerk_publishable_key_here"

# Additional Clerk Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Vercel (Optional for deployment)
VERCEL_URL="your-app.vercel.app"
```

#### Database URL Format
For Neon PostgreSQL, your `DATABASE_URL` should follow this format:
```
postgresql://[user]:[password]@[neon-hostname]/[database]?sslmode=require
```

### Drizzle ORM Configuration

The project uses Drizzle ORM for database operations with the following configuration:

#### drizzle.config.ts
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL as string,
  },
} satisfies Config;
```

#### Database Schema
The schema is defined in `lib/db.ts` and includes tables for:
- Users
- Projects
- Newsletter subscribers
- Role management

#### Migrations
To set up your database:

1. **Initialize the database**:
   ```powershell
   pnpm run db:generate
   ```

2. **Run migrations**:
   ```powershell
   pnpm run db:migrate
   ```

3. **Push schema changes** (during development):
   ```powershell
   pnpm run db:push
   ```

### Installation
1. Clone the repository
2. Install dependencies with `pnpm install`
3. Set up environment variables in `.env` file
4. Initialize and migrate database with `pnpm run db:generate` and `pnpm run db:migrate`
5. Start the development server with `pnpm run dev`

## Licensing

Ausbiz Consulting Pty Ltd provides licenses for non-commercial use only.

### Copyright

© Ausbiz Consulting. All rights reserved.