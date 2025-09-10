# TruthLens Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **API Keys**: Have your API keys ready:
   - `GEMINI_API_KEY` (Google Gemini AI)
   - `EXA_API_KEY` (Exa search API)
   - `DATABASE_URL` (Supabase PostgreSQL connection string)

## Step 1: Prepare Your Code

Ensure your project has the following files:
- `vercel.json` (deployment configuration)
- `api/index.js` (serverless function entry point)
- All environment variables properly configured

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to your project settings
3. Go to "Database" → "Connection string" → "URI"
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password
5. Save this as your `DATABASE_URL`

## Step 3: Push Database Schema

Before deploying, ensure your database schema is up to date:

```bash
npm run db:push
```

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from your project directory:
```bash
vercel
```

4. Follow the prompts:
   - Link to existing project? **N**
   - Project name: **truthlens** (or your preferred name)
   - Directory: **.** (current directory)
   - Want to override settings? **N**

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub:
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the framework settings from `vercel.json`
6. Click "Deploy"

## Step 5: Configure Environment Variables

After deployment, you need to add environment variables:

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:

```
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]
GEMINI_API_KEY=your_gemini_api_key_here
EXA_API_KEY=your_exa_api_key_here
NODE_ENV=production
```

**Important**: Click "Add" for each variable and make sure they're available for "Production", "Preview", and "Development" environments.

## Step 6: Update CORS Configuration

1. After your first deployment, note your Vercel app URL (e.g., `https://your-app.vercel.app`)
2. Update the `api/index.js` file to include your actual domain:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-actual-app.vercel.app'] // Replace with your actual URL
    : ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));
```

3. Commit and push this change to trigger a new deployment

## Step 7: Test Your Deployment

1. Visit your deployed app URL
2. Test the following features:
   - User registration and login
   - Content analysis functionality
   - PDF report generation
   - Dark/light mode toggle

## Troubleshooting

### Common Issues:

1. **API Routes Not Working**:
   - Check that `vercel.json` rewrites are correctly configured
   - Ensure environment variables are set properly
   - Check function logs in Vercel dashboard

2. **Database Connection Errors**:
   - Verify `DATABASE_URL` is correctly formatted
   - Ensure Supabase allows connections from Vercel
   - Check if database schema is pushed (`npm run db:push`)

3. **CORS Errors**:
   - Update the CORS origin in `api/index.js` with your actual Vercel URL
   - Ensure cookies and credentials are properly configured

4. **Build Failures**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

### Environment Variables Setup:

Make sure you have these exact variable names in Vercel:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
GEMINI_API_KEY=AIza...
EXA_API_KEY=your_exa_key
NODE_ENV=production
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update CORS configuration with your custom domain

## Monitoring

- Check deployment status: Vercel Dashboard → Deployments
- View function logs: Vercel Dashboard → Functions
- Monitor performance: Vercel Dashboard → Analytics

Your TruthLens application should now be live and fully functional on Vercel!