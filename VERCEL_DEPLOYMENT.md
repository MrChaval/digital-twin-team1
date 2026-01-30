# Vercel Deployment Guide

## Required Environment Variables

You must add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project
- Go to **Settings** → **Environment Variables**

### 2. Add Required Variables

#### Database (REQUIRED)
```
DATABASE_URL=postgresql://neondb_owner:npg_so8gDjr9TEVQ@ep-soft-scene-a7bml9gh-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

#### Clerk Authentication (REQUIRED)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGl2aW5nLWNyb3ctMTMuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_PsLK4Si7GQJ1TRopfJprvjAql90Lilo0TuqH8iESPn
```

### 3. Set Environment for Each Variable
For each variable, select:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. Redeploy
After adding all environment variables:
- Go to **Deployments** tab
- Click the three dots (•••) on the latest deployment
- Select **Redeploy**

## Troubleshooting

### Build Fails with "Missing publishableKey"
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is added in Vercel
- Make sure it's enabled for Production environment
- Redeploy after adding the variable

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Ensure your Neon database allows connections from Vercel
- Check that SSL mode is included: `?sslmode=require`

### After Deployment
Your application should be accessible at: `https://your-project.vercel.app`
