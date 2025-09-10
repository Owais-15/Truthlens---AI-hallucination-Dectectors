# TruthLens Deployment Instructions

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **API Keys**: Obtain Gemini and Exa API keys

## Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Database (Supabase)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# AI APIs
GEMINI_API_KEY=your-gemini-api-key-here
EXA_API_KEY=your-exa-api-key-here

# Environment
NODE_ENV=production
