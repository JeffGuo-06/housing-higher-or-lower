# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Random Property Finder - A web app that displays random property listings in the US or Canada with one click. Users can browse properties by clicking country-specific buttons to discover random listings.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Vercel Serverless Functions (Node.js 18+)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Plain CSS (no framework)
- **Deployment**: Vercel
- **APIs**: RentCast API (US properties), Houski API (Canada properties)

## Project Structure

```
property-finder-mvp/
├── api/
│   ├── properties.js          # Serverless function for property fetching
│   └── leaderboard.js         # Serverless function for leaderboard
├── migrations/
│   └── 001_initial_schema.sql # Database schema (run in Supabase SQL Editor)
├── src/
│   ├── App.jsx               # Main React component
│   ├── components/
│   │   ├── PropertyCard.jsx  # Property display component
│   │   ├── LoadingSpinner.jsx
│   │   └── Leaderboard.jsx   # Leaderboard component
│   ├── styles/               # Component-specific CSS files
│   ├── lib/
│   │   └── supabase.js       # Supabase client configuration
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── public/
│   └── placeholder.jpg       # Fallback image for properties
├── .gitignore                # Git ignore file (.env is excluded)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json               # Vercel configuration
└── .env.example              # Example environment variables
```

## Development Commands

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting (if configured)
```bash
npm run lint
```

## Environment Variables

Required environment variables (store in `.env` locally, configure in Vercel for production):

```bash
# Property APIs
RENTCAST_API_KEY=your_rentcast_key_here
HOUSKI_API_KEY=your_houski_key_here

# Supabase (for leaderboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Never commit actual API keys to the repository. The `.env` file is excluded via `.gitignore`.

## API Architecture

### Backend Endpoints

**Property Endpoints:**
- `GET /api/properties?country=US` - Returns random US property
- `GET /api/properties?country=CA` - Returns random Canada property

**Leaderboard Endpoints:**
- `POST /api/leaderboard` - Submit a new score
- `GET /api/leaderboard` - Get top scores (default: top 10)

### Expected Response Formats

**Property Response:**
```json
{
  "address": "123 Main Street",
  "city": "Austin",
  "state": "TX",
  "country": "US",
  "price": "$450,000",
  "bedrooms": 3,
  "bathrooms": 2,
  "sqft": 1800,
  "propertyType": "Single Family",
  "imageUrl": "https://...",
  "listingUrl": "https://..."
}
```

**Leaderboard Submission (POST body):**
```json
{
  "player_name": "John Doe",
  "score": 1500,
  "correct_guesses": 10,
  "total_guesses": 12
}
```

### Error Handling
- Validate country parameter (US/CA only)
- Handle API rate limits gracefully
- Handle missing property data fields
- Validate leaderboard data (positive scores, correct <= total guesses)
- Don't expose sensitive information in error messages

## Frontend Architecture

### State Management
- Uses React hooks (useState, useEffect)
- No global state management library
- Component-level state for simplicity

### Key Components
- **App.jsx**: Contains country selection buttons and orchestrates property fetching
- **PropertyCard.jsx**: Displays property details (image, address, price, specs)
- **LoadingSpinner.jsx**: Shows loading state during API calls
- **Leaderboard.jsx**: Displays top scores from Supabase database

### Styling Approach
- Plain CSS files (no Tailwind or CSS-in-JS)
- Component-specific CSS files in `src/styles/`
- Mobile-first responsive design

## Database Setup (Supabase)

### Initial Setup
1. Create a Supabase account at supabase.com
2. Create a new project
3. Navigate to the SQL Editor in Supabase dashboard
4. Copy and run the migration from `migrations/001_initial_schema.sql`
5. Copy your project URL and anon key from Settings > API

### Database Schema
- **leaderboard** table: Stores player scores with RLS (Row Level Security) enabled
- Public read access for viewing scores
- Public insert access for submitting scores
- Includes function `get_top_scores(limit_count)` for efficient queries

### Migrations
All database migrations are stored in the `migrations/` folder. Run them in order in the Supabase SQL Editor.

## Deployment

### Supabase Deployment
1. Run migrations in Supabase SQL Editor
2. Enable Row Level Security policies (included in migration)
3. Copy API credentials

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard (including Supabase credentials)
3. Vercel auto-detects Vite configuration and deploys

## Security Considerations

1. API keys must be stored in environment variables (never in code)
2. Validate and sanitize the country parameter in serverless function
3. Implement client-side request throttling to avoid API abuse
4. Configure CORS properly in serverless function
5. Use Supabase Row Level Security (RLS) to protect database access
6. Use anon key on frontend, service role key only in backend serverless functions
7. Validate all leaderboard submissions (name length, score ranges, etc.)

## Implementation Status

Project is in initial planning phase. Core implementation needs to be built following the architecture defined in PLAN.md.
