# TruthLens - AI-Powered Fact-Checking Platform

**TruthLens** is a comprehensive AI-powered fact-checking application that analyzes content for factual accuracy, identifies potential hallucinations, and provides detailed verification results with source citations.

---

## 📚 Research & Publication

This repository contains the official source code implementation for the research paper: 
**"TruthLens: A Real-Time Neuro-Symbolic Approach to Hallucination Detection in Large Language Models"**

- **Authors:** Sairaj Shinde, Khushi Shukla, Sayed Mohammad Owais Hussain, Minakshi Ghorpade
- **Conference:** Presented at the International Conference on Informatics, Computing and Network (IC-ICN) during MultiCon-W 2026.
- **Recognition:** Awarded a *Certificate of Appreciation* by the conference committee. [View Presentation Certificate](./docs/IC-ICN_MultiCon_Presentation_Certificate.pdf)
- **Read the Paper:** [Available on Zenodo](https://doi.org/10.5281/zenodo.20721200)

---
## 🚀 Features

- **AI-Powered Analysis**: Uses Google Gemini AI for intelligent content analysis
- **External Verification**: Leverages Exa API for real-world source verification
- **Hallucination Detection**: Advanced algorithms to identify false or misleading information
- **User Authentication**: Secure JWT-based authentication system
- **Subscription Management**: Tiered access with usage tracking
- **Real-time Analysis**: Fast processing with streaming results
- **Source Citations**: Provides credible sources for fact verification
- **Export Reports**: Generate detailed PDF reports of analysis results

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database with Drizzle ORM
- **JWT** authentication with bcrypt
- **Google Gemini API** for AI analysis
- **Exa API** for source verification

## 🧠 How Hallucination Detection Works

### 1. Multi-Layer Analysis Pipeline

```
Content Input → Gemini Analysis → External Verification → Source Validation → Final Score
```

### 2. Detection Process

**Step 1: Initial AI Analysis**
- Google Gemini AI analyzes the content using advanced language models
- Identifies potentially problematic claims and statements
- Assigns severity levels (low, medium, high) to each issue
- Generates initial factuality score (0-100)

**Step 2: External Verification**
- Each identified claim is cross-referenced using Exa API
- Searches authoritative sources and databases
- Verifies facts against real-world information
- Calculates confidence scores for each verification

**Step 3: Source Validation**
- Finds additional credible sources for each claim
- Evaluates source reliability and authority
- Provides direct links and snippets for verification

**Step 4: Score Adjustment**
- Adjusts initial factuality score based on verification results
- Penalizes unverified or contradicted claims
- Generates final comprehensive assessment

### 3. Hallucination Categories Detected

- **Factual Inaccuracies**: False statements about real-world facts
- **Temporal Errors**: Incorrect dates, timelines, or chronological claims
- **Statistical Misrepresentations**: Wrong numbers, percentages, or data
- **Attribution Errors**: Misquoted sources or false attributions
- **Logical Inconsistencies**: Self-contradictory statements
- **Unverifiable Claims**: Statements that cannot be fact-checked

## 🔐 Authentication & Token System

### JWT Token Architecture

**Token Structure:**
```javascript
{
  "userId": "unique-user-id",
  "email": "user@example.com",
  "iat": 1234567890,  // Issued at
  "exp": 1234567890   // Expiration
}
```

**Authentication Flow:**
1. User registers/logs in with email and password
2. Password is hashed using bcrypt with salt rounds
3. JWT token is generated with user information
4. Token is sent to client and stored securely
5. Each API request includes token in Authorization header
6. Server verifies token and extracts user information

**Security Features:**
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with expiration
- Protected routes require valid authentication
- Rate limiting and request validation
- Secure session management

### Usage Tracking System

**Token-Based Usage:**
- Each analysis request is tied to authenticated user
- Usage is tracked per month per user
- Subscription tiers determine analysis limits:
  - **Free**: 100 analyses/month
  - **Pro**: 1000 analyses/month  
  - **Enterprise**: 10,000 analyses/month

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Analysis
- `POST /api/analysis` - Analyze content for hallucinations
- `GET /api/analysis/history` - Get user's analysis history
- `GET /api/analysis/:id` - Get specific analysis result

### User Management
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/usage` - Get current usage information
- `PUT /api/user/profile` - Update user profile

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key
- Exa API key

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Owais-15/TruthLens-AI-Fact-Checker.git
cd TruthLens-AI-Fact-Checker
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env file with:
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
EXA_API_KEY=your_exa_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. **Set up database:**
```bash
npm run db:push
```

5. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📈 Usage Examples

### Basic Analysis
```javascript
// Analyze content for hallucinations
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: "Your content to analyze here..."
  })
});

const result = await response.json();
// Returns: factualityScore, issues, summary, recommendations
```

### Get Analysis History
```javascript
const history = await fetch('/api/analysis/history', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🏗️ Architecture Overview

```
Frontend (React) ↔ Backend (Express) ↔ Database (PostgreSQL)
                      ↓
              External APIs (Gemini + Exa)
```

### Key Components
- **Authentication Service**: JWT-based user management
- **Analysis Engine**: Core fact-checking and hallucination detection
- **Verification Service**: External source validation
- **Storage Layer**: PostgreSQL with Drizzle ORM
- **API Gateway**: Express.js with middleware

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key for AI analysis
- `EXA_API_KEY`: Exa API key for source verification
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 5000)

### Database Schema
- **Users**: Authentication and profile information
- **Analyses**: Stored analysis results and metadata
- **Subscriptions**: User subscription and usage tracking
- **Verification Tokens**: Email verification and password reset

## 🚀 Deployment

### Cloud Run Deployment
The application is optimized for Google Cloud Run deployment:

```bash
# Build for production
npm run build

# Deploy to Cloud Run
gcloud run deploy truthlens \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Setup
Ensure all required environment variables are configured in your deployment environment.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- **Thakur College of Engineering & Technology** for institutional support.
- **Research Team:** Sairaj Shinde, Khushi Shukla, and Faculty Guide Minakshi Ghorpade.
- Google Gemini AI for advanced language model capabilities.
- Exa API for reliable source verification.
- Google Gemini AI for advanced language model capabilities
- Exa API for reliable source verification
- Replit for development and deployment platform
- Open source community for various libraries and tools

---

**Built by Sayed Mohammad Owais Hussain**
