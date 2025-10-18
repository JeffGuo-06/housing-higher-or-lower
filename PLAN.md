# Higher or Lower - Real Estate Edition

## 🎯 Core Concept

A "Higher or Lower" guessing game where players compare real estate prices from the US and Canada. Guess whether the next property is more or less expensive than the current one. See how long you can keep your streak alive!

---

## 🎨 User Experience Flow

1. **Home Screen**
   - Game title and branding
   - Simple explanation of rules:
     - Compare property prices
     - Guess if the next property is HIGHER or LOWER
     - Keep your streak going as long as possible
     - Submit your score to the leaderboard
   - "PLAY" button to start the game
   - View leaderboard

2. **Game Screen**
   - **Two properties displayed side-by-side**:

     **LEFT Property (Reference)**:
     - Property image
     - Address
     - **Price (VISIBLE)**
     - Bedrooms/Bathrooms
     - Square footage
     - Property type

     **RIGHT Property (Mystery)**:
     - Property image
     - Address
     - **Price (HIDDEN)** - Shows "???"
     - Bedrooms/Bathrooms
     - Square footage
     - Property type
     - Two buttons: **"HIGHER"** or **"LOWER"**

   - **Current Score** displayed prominently at top

3. **After Guessing**
   - Reveal the right property's actual price
   - Show "CORRECT!" or "WRONG!" feedback with animation

   **If CORRECT**:
   - Score increases by 1
   - Right property becomes the new left property (with price visible)
   - Fetch a new random property for the right side
   - Continue playing

   **If WRONG**:
   - Game ends
   - Show final score
   - Display game over screen

4. **Game Over Screen**
   - Final score displayed
   - Input field for player name
   - "Submit to Leaderboard" button
   - "Play Again" button
   - Show top 10 leaderboard scores

---

## 🏗️ Technical Architecture

### Frontend (React + Vite)

- **Framework**: React 18
- **Build Tool**: Vite (fast, modern)
- **Styling**: Plain CSS (custom styles)
- **State**: React hooks (useState, useEffect)
- **Deployment**: Vercel (frontend hosting)

### Backend (Node.js Serverless)

- **Platform**: Vercel Serverless Functions
- **Runtime**: Node.js 18+
- **API Endpoints**:
  - `GET /api/properties?country=US` - Returns random US property from Supabase
  - `GET /api/properties?country=CA` - Returns random CA property from Supabase
  - `GET /api/properties` - Returns random property from any country
  - `POST /api/leaderboard` - Submit score to leaderboard
  - `GET /api/leaderboard` - Get top scores from leaderboard

### Database

- **Platform**: Supabase (PostgreSQL)
- **Purpose**:
  - Store all property data (pre-scraped from Realtor.ca)
  - Store leaderboard scores
  - Random property selection via SQL functions
- **Tables**:
  - `properties` - All property listings with images
  - `leaderboard` - Player scores and stats
- **Migrations**: SQL migration files in `migrations/` folder
- **Functions**:
  - `get_random_property(country)` - Get one random property
  - `get_top_scores(limit)` - Get top N leaderboard entries

### Data Source

- **Property Data**: Pre-scraped from Realtor.ca and stored in Supabase
- **Images**: Stored in Supabase Storage, served via CDN
- **No external API calls during gameplay** (faster, more reliable)

---

## 📁 File Structure

```
higher-or-lower-real-estate/
├── api/
│   ├── properties.js          # Serverless function to fetch random properties
│   └── leaderboard.js         # Serverless function for leaderboard CRUD
├── migrations/
│   ├── 001_initial_schema.sql # Leaderboard table setup
│   └── 002_properties_table_clean.sql # Properties table and functions
├── scripts/
│   └── (Python scripts for scraping - not needed for game)
├── src/
│   ├── App.jsx               # Main game orchestrator
│   ├── components/
│   │   ├── HomeScreen.jsx    # Landing page with rules and play button
│   │   ├── GameScreen.jsx    # Main game with two properties
│   │   ├── PropertyCard.jsx  # Individual property display
│   │   ├── GameOver.jsx      # Game over screen with score submission
│   │   ├── Leaderboard.jsx   # Leaderboard display
│   │   └── LoadingSpinner.jsx # Loading state component
│   ├── styles/
│   │   ├── App.css           # Main app styles
│   │   ├── HomeScreen.css    # Home screen styles
│   │   ├── GameScreen.css    # Game screen styles
│   │   ├── PropertyCard.css  # Property card styles
│   │   ├── GameOver.css      # Game over styles
│   │   ├── Leaderboard.css   # Leaderboard styles
│   │   └── LoadingSpinner.css # Loading spinner styles
│   ├── lib/
│   │   └── supabase.js       # Supabase client configuration
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles and CSS reset
├── public/
│   └── placeholder.jpg       # Fallback image for missing photos
├── .gitignore
├── .env                      # Environment variables (not committed)
├── .env.example              # Example env variables template
├── index.html
├── package.json
├── vite.config.js
├── vercel.json               # Vercel deployment configuration
├── CLAUDE.md                 # Instructions for Claude Code
├── PLAN.md                   # This file
└── README.md
```

---

## 🔑 Environment Variables Needed

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Note**: Property data is already in Supabase, so no external API keys are needed!

---

## 📋 Features

### MVP (Phase 1) ✅

- [ ] Home screen with game rules and play button
- [ ] Game screen with two properties side-by-side
- [ ] Hide right property price, show left property price
- [ ] Higher/Lower guess buttons
- [ ] Score tracking (consecutive correct guesses)
- [ ] Reveal answer with visual feedback (correct/wrong)
- [ ] Game over screen when player guesses wrong
- [ ] Leaderboard score submission with player name
- [ ] Display top 10 leaderboard scores
- [ ] Play again functionality
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design (mobile + desktop)
- [ ] Deploy to Vercel

### Future Enhancements (Phase 2) 🚀

- [ ] Country selection (US only, CA only, or mixed)
- [ ] Difficulty modes (easy/medium/hard based on price ranges)
- [ ] Streak animations and celebrations
- [ ] Share score on social media
- [ ] Daily challenges
- [ ] Time-based mode (score as many as possible in 60 seconds)
- [ ] Sound effects and music
- [ ] Property image carousel
- [ ] Hint system (show price range)

---

## 🎨 Design Mockup (Text Description)

### Home Screen
```
┌─────────────────────────────────────────────┐
│                                             │
│      🏠 HIGHER or LOWER                     │
│         Real Estate Edition                 │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │  📊 HOW TO PLAY:                  │    │
│   │                                   │    │
│   │  • Compare property prices        │    │
│   │  • Guess if the next property is  │    │
│   │    HIGHER or LOWER in price       │    │
│   │  • Keep your streak alive!        │    │
│   │  • Submit your score              │    │
│   └───────────────────────────────────┘    │
│                                             │
│        ┌─────────────────────┐             │
│        │                     │             │
│        │    🎮 PLAY NOW      │             │
│        │                     │             │
│        └─────────────────────┘             │
│                                             │
│        [View Leaderboard]                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Game Screen
```
┌─────────────────────────────────────────────────────────┐
│                      SCORE: 5                           │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ┌────────────────────┐      ┌────────────────────┐   │
│  │  [Property Image]  │      │  [Property Image]  │   │
│  │                    │  VS  │                    │   │
│  │ 123 Main St        │      │ 456 Oak Ave        │   │
│  │ Austin, TX         │      │ Seattle, WA        │   │
│  │                    │      │                    │   │
│  │ 💰 $450,000        │      │ 💰 ???            │   │
│  │                    │      │                    │   │
│  │ 🛏️ 3 beds          │      │ 🛏️ 4 beds          │   │
│  │ 🚿 2 baths         │      │ 🚿 3 baths         │   │
│  │ 📏 1,800 sqft      │      │ 📏 2,400 sqft      │   │
│  │ 🏡 Single Family   │      │ 🏡 Single Family   │   │
│  └────────────────────┘      │                    │   │
│                               │  ┌──────────────┐ │   │
│                               │  │   HIGHER ⬆️  │ │   │
│                               │  └──────────────┘ │   │
│                               │  ┌──────────────┐ │   │
│                               │  │   LOWER ⬇️   │ │   │
│                               │  └──────────────┘ │   │
│                               └────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Game Over Screen
```
┌─────────────────────────────────────────────┐
│                                             │
│           ❌ GAME OVER!                     │
│                                             │
│         Your Final Score: 12                │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │  Enter your name:                 │    │
│   │  [________________]               │    │
│   │                                   │    │
│   │  [Submit to Leaderboard]          │    │
│   └───────────────────────────────────┘    │
│                                             │
│        ┌─────────────────────┐             │
│        │   🔄 PLAY AGAIN     │             │
│        └─────────────────────┘             │
│                                             │
│   🏆 TOP 10 LEADERBOARD:                   │
│   1. PlayerOne........... 45               │
│   2. RealEstateKing...... 38               │
│   3. HouseFlipper........ 29               │
│   ...                                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 Deployment Steps

### 1. Setup Supabase Database

1. Create account at supabase.com
2. Create new project
3. Run migrations in SQL Editor:
   - First: `migrations/001_initial_schema.sql` (leaderboard table)
   - Second: `migrations/002_properties_table_clean.sql` (properties table)
4. Import property data (already done - 100+ properties loaded)
5. Copy your Supabase URL and keys from Settings > API

### 2. Setup Repository

```bash
git init
git add .
git commit -m "Initial commit - Higher or Lower Real Estate Game"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to vercel.com
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Framework Preset: **Vite**
5. Click "Deploy"
6. Done! Your game is live

---

## 📊 API Response Format

### Property Response (GET /api/properties):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "address": "123 Main Street",
  "city": "Toronto",
  "province": "ON",
  "country": "CA",
  "price": 1250000,
  "bedrooms": "3+1",
  "bathrooms": "2",
  "sqft": 1800,
  "property_type": "Semi-Detached",
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/property-images/...",
  "listing_url": "https://www.realtor.ca/...",
  "latitude": 43.6532,
  "longitude": -79.3832
}
```

### Leaderboard Submission (POST /api/leaderboard):

```json
{
  "player_name": "PlayerOne",
  "score": 15,
  "correct_guesses": 15,
  "total_guesses": 16
}
```

### Leaderboard Response (GET /api/leaderboard):

```json
[
  {
    "id": "abc123...",
    "player_name": "PlayerOne",
    "score": 45,
    "correct_guesses": 45,
    "total_guesses": 46,
    "created_at": "2025-01-15T10:30:00Z"
  },
  ...
]
```

---

## 🧪 Testing Plan

### Manual Testing

1. **Home Screen**
   - Rules display correctly
   - Play button navigates to game

2. **Game Flow**
   - Two properties load on game start
   - Left property shows price, right property hides price
   - Higher/Lower buttons work
   - Correct guess: score increments, right becomes left, new property loads
   - Wrong guess: game ends, shows game over screen

3. **Leaderboard**
   - Score submission works with player name
   - Top 10 scores display correctly
   - Scores ordered by highest first

4. **UI/UX**
   - Mobile responsive design
   - Loading states during property fetch
   - Error handling for failed requests
   - Play again resets game state

### Edge Cases

- No properties in database
- Database connection error
- Missing property images (fallback image)
- Very long property addresses
- Duplicate consecutive properties (should be avoided)
- Same price on both properties
- Empty player name on leaderboard submission

---

## 💰 Cost Estimate

### Development

- **Time**: 6-8 hours for MVP
- **Cost**: Free (DIY)

### Hosting

- **Vercel Hosting**: Free tier (unlimited hobby projects)
- **Supabase**: Free tier
  - 500MB database storage
  - 1GB file storage
  - 50K monthly active users
  - Unlimited API requests
- **No external API costs** (all data pre-loaded in Supabase)

### Total Estimated Monthly Cost: $0

Perfect for MVP and personal projects!

---

## 🎯 Success Metrics

### MVP Goals

- Deploy successfully to Vercel
- Smooth gameplay with no lag
- Leaderboard submissions working
- Mobile responsive design
- Game logic works correctly (score tracking, win/lose conditions)
- Load time < 2 seconds (all data from Supabase)
- Zero external API failures (self-contained)

### Future Goals

- 100+ unique players
- Average streak of 5+ correct guesses
- < 1% error rate
- Positive user feedback
- Viral sharing on social media

---

## 🔒 Security Considerations

1. **Environment Variables**: Store Supabase keys in environment variables (never commit)
2. **Row Level Security**: Use Supabase RLS policies for data protection
3. **Service Role Key**: Only use in backend serverless functions, never expose to client
4. **Input Validation**:
   - Sanitize player names (max length, no XSS)
   - Validate score values (non-negative integers)
   - Validate correct_guesses <= total_guesses
5. **Rate Limiting**: Consider implementing rate limiting on leaderboard submissions
6. **CORS**: Configure properly in serverless functions
7. **Error Messages**: Don't expose sensitive database info to client

---

## 📝 Implementation Order

### Step 1: Project Setup (30 min)

- ✅ Initialize Vite + React project
- ✅ Install dependencies (@supabase/supabase-js, react, react-dom)
- ✅ Setup folder structure
- ✅ Configure vite.config.js and vercel.json
- [ ] Create .env file with Supabase credentials

### Step 2: Backend & Database (45 min)

- ✅ Migrations already created and run
- ✅ Property data already loaded
- [ ] Create Supabase client lib (src/lib/supabase.js)
- [ ] Create /api/properties.js (fetch random properties)
- [ ] Create /api/leaderboard.js (CRUD operations)

### Step 3: Core Components (2 hours)

- [ ] Create HomeScreen component with rules
- [ ] Create PropertyCard component (shows/hides price)
- [ ] Create GameScreen component (game logic)
- [ ] Create LoadingSpinner component
- [ ] Create main App.jsx (game state orchestration)

### Step 4: Game Over & Leaderboard (1 hour)

- [ ] Create GameOver component
- [ ] Create Leaderboard component
- [ ] Integrate score submission
- [ ] Integrate leaderboard display

### Step 5: Styling (1.5 hours)

- [ ] Create global styles (index.css)
- [ ] Style HomeScreen
- [ ] Style GameScreen (side-by-side layout)
- [ ] Style PropertyCard
- [ ] Style GameOver screen
- [ ] Mobile responsive design

### Step 6: Testing & Polish (1 hour)

- [ ] Test full game flow
- [ ] Test edge cases
- [ ] Add loading states
- [ ] Add error handling
- [ ] Fix bugs

### Step 7: Deploy (30 min)

- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Test production build

---

## 🤔 Technical Decisions

### Why React + Vite?

- Fast development experience with hot module replacement
- Modern tooling with excellent DX
- Perfect for interactive games and SPAs
- Easy Vercel deployment with zero config
- Lightweight and fast production builds

### Why Serverless Functions?

- No server management required
- Auto-scaling based on traffic
- Cost-effective (free tier sufficient for MVP)
- Built into Vercel (seamless integration)
- Cold start times acceptable for this use case

### Why Supabase Instead of External APIs?

- **Reliability**: No dependency on external API uptime
- **Speed**: Direct database queries much faster than API calls
- **Cost**: Free tier vs. pay-per-request APIs
- **Control**: Full control over data and schema
- **Offline-first**: Could enable offline play in future
- **Data quality**: Pre-scraped and validated data
- **Row Level Security**: Built-in data protection

### Why Plain CSS?

- Full control over styling without framework constraints
- No extra dependencies to manage
- Better for learning CSS fundamentals
- Smaller bundle size
- No build step for styles (faster dev)
- Easy to customize and theme

### Why "Higher or Lower" Game Mechanic?

- Proven engaging gameplay (popular format)
- Simple to understand, hard to master
- Encourages replay for high scores
- Natural fit for real estate price data
- Viral potential (share scores)
- Competitive element via leaderboard

---

## 🎓 Learning Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Docs](https://react.dev)
- [React Hooks Reference](https://react.dev/reference/react)

---

## 🎮 Game Logic Summary

### Initial State
1. Load two random properties from Supabase
2. Left property = visible price (reference)
3. Right property = hidden price (mystery)
4. Score = 0

### Player Makes Guess (HIGHER or LOWER)
1. User clicks "HIGHER" or "LOWER" button
2. Reveal right property's actual price
3. Compare: is right price higher/lower than left price?

### If Guess is CORRECT ✅
1. Show "CORRECT!" feedback
2. Score += 1
3. Right property → becomes new Left property
4. Fetch new random property for Right
5. Continue game loop

### If Guess is WRONG ❌
1. Show "WRONG!" feedback
2. Game Over
3. Display final score
4. Prompt for player name
5. Submit to leaderboard
6. Show leaderboard
7. Offer "Play Again" option

---

## ✅ Ready to Build!

The plan has been updated to reflect the **"Higher or Lower"** game mechanic.

**Next Steps:**
1. Build all React components (HomeScreen, GameScreen, PropertyCard, GameOver, Leaderboard)
2. Create serverless API endpoints
3. Style with plain CSS
4. Test and deploy to Vercel

Let's build this game! 🚀
