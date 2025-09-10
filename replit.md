# TruthLens

## Overview

TruthLens is a comprehensive AI-powered fact-checking application that analyzes content for factual accuracy, identifies potential issues, and provides detailed verification results. The application combines multiple AI services to deliver accurate content analysis with source verification and generates detailed reports for users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query for server state and React Context for authentication
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful endpoints with comprehensive error handling middleware

### Data Storage
- **Primary Database**: PostgreSQL (configured for Supabase)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development/testing
- **Database Tables**: Users, analyses, and usage tracking with proper foreign key relationships

### Authentication & Authorization
- **Strategy**: JWT token-based authentication
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Token verification middleware for protected routes
- **User Management**: Registration, login, and profile management with email validation

### AI Services Integration
- **Primary Analysis**: Google Gemini API for content fact-checking and analysis
- **Fact Verification**: Exa API for external source verification and research
- **Analysis Pipeline**: Multi-step verification process combining AI analysis with external source validation
- **Content Scoring**: Factuality scoring system with severity classification (low, medium, high)

### Report Generation
- **PDF Generation**: jsPDF for creating downloadable analysis reports
- **Data Visualization**: Recharts for analytics charts and usage statistics
- **Export Features**: Comprehensive reporting with source citations and recommendations

### Development & Deployment
- **Development**: Vite dev server with HMR and error overlay
- **Build Process**: Separate client and server builds with esbuild for server bundling
- **Deployment**: Vercel-ready configuration with proper routing setup
- **Environment**: Environment-specific configurations for development and production

## External Dependencies

### Core AI Services
- **Google Gemini API**: Primary content analysis and fact-checking engine
- **Exa API**: External source verification and fact validation service

### Database & Infrastructure
- **Supabase**: PostgreSQL database hosting with connection pooling
- **Vercel**: Application hosting and deployment platform

### Authentication & Security
- **JWT**: JSON Web Token implementation for secure authentication
- **bcrypt**: Password hashing library for secure credential storage

### UI & Visualization Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Recharts**: Data visualization library for analytics and reporting
- **jsPDF**: Client-side PDF generation for report exports
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Drizzle ORM**: Type-safe database operations and schema management
- **TanStack Query**: Server state management and caching solution