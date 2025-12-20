# Scientific Review - Scientific Paper Discussion Platform

A web platform for discussing scientific papers and research with community-driven comments and ratings.

## Features

### 1. User Entrance Page
- Login and signup functionality
- Dynamic switching between login and signup forms
- Session management with localStorage

### 2. Homepage
- View your discussion threads
- Browse archived papers
- Quick access to search functionality

### 3. Article Page
- Detailed paper information (title, authors with ORCID, abstract, citation)
- Collapsible content sections
- PDF link when available
- 5-star rating system with average ratings
- AI-generated summary of community discussions
- Thread-based comment system
- Comment filtering by quality labels
- Archive/unarchive papers

### 4. Comment Page
- Create new discussion threads
- Reply to existing comments
- AI-powered comment quality analysis
- Anonymous commenting option
- Reference paper sections
- Labels: meaningful, critical, helpful, non-sense, useless, irrational

### 5. Settings Page
- Update username, ORCID, institution
- Set nationality, age, gender
- Manage research interests
- ORCID matching for published papers

### 6. Search Page
- Search papers by title, author, or keywords
- Filter by minimum rating
- Sort by rating or publication date
- Personalized recommendations based on:
  - User research interests
  - Overall paper ratings
  - Community engagement

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context (Authentication)
- **Database**: Local JSON files (prepared for Supabase migration)

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Navigate to the project directory:
```bash
cd Test/paper-discussion-platform
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:3000
```

### Demo Accounts

Use these credentials to log in:
- Email: `alice@university.edu` / Password: `password123`
- Email: `bob@research.org` / Password: `password123`
- Email: `carol@institute.edu` / Password: `password123`

Or create a new account via signup.

## Project Structure

```
paper-discussion-platform/
├── app/                      # Next.js app router pages
│   ├── page.tsx             # Login/Signup page
│   ├── home/                # Homepage
│   ├── article/[id]/        # Article detail page
│   ├── comment/new/         # Comment creation page
│   ├── settings/            # User settings
│   ├── search/              # Search and recommendations
│   └── layout.tsx           # Root layout with AuthProvider
├── components/              # Reusable React components
│   ├── Navbar.tsx          # Navigation bar
│   └── StarRating.tsx      # Star rating component
├── lib/                     # Core logic and utilities
│   ├── auth.ts             # Authentication context
│   ├── db/                 # Database abstraction layer
│   ├── types.ts            # TypeScript type definitions
│   └── ai.ts               # AI integration (ChatGPT placeholders)
└── data/                    # Local JSON databases
    ├── users.json
    ├── articles.json
    ├── comments.json
    ├── ratings.json
    └── archived.json
```

## Database Structure

### Local Static Databases
All data is stored in JSON files in the `data/` directory:
- `users.json` - User accounts and profiles
- `articles.json` - Scientific papers with content
- `comments.json` - User comments and discussions
- `ratings.json` - Paper ratings by users
- `archived.json` - User-archived papers

### Database Abstraction Layer
The `lib/db/index.ts` file provides a clean API for database operations:
- All database functions are async (ready for Supabase)
- Operations return promises
- Easy to swap local JSON for Supabase client

### Migration to Supabase

When ready to migrate to Supabase:

1. Set up Supabase project and get credentials
2. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

3. Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Update `lib/db/index.ts` to use Supabase client:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Example: Replace local findById with Supabase query
export const articleDB = {
  async findById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    return error ? null : data;
  },
  // ... other methods
};
```

## AI Integration

### Current Implementation
AI features currently use mock implementations in `lib/ai.ts`:
- Comment quality analysis
- Article summary generation
- Recommendation descriptions

### ChatGPT API Integration

To enable real AI features:

1. Get OpenAI API key from https://platform.openai.com/

2. Add to `.env.local`:
```
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

3. Uncomment the `callOpenAI` function in `lib/ai.ts`

4. Update analysis functions to use real API calls

## Features Implementation Details

### Comment Quality Analysis
- AI analyzes comments for relevance and quality
- Assigns labels: meaningful, critical, helpful, non-sense, useless, irrational
- Users can filter comments by these labels

### Rating System
- 5-star ratings per paper
- Average rating calculated automatically
- One rating per user per paper (updates replace previous)

### Recommendation System
- Matches user research interests with paper content
- Boosts papers with higher ratings
- Returns top N recommendations

### Thread-Based Comments
- Root comments (no parentId) start threads
- Replies reference parent comments
- Supports unlimited nesting depth
- Show/hide reply threads

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features

1. Update types in `lib/types.ts`
2. Add database operations in `lib/db/index.ts`
3. Create UI components in `components/`
4. Build pages in `app/`

## Known Limitations (Test Stage)

- No real authentication (passwords stored in plain text)
- No database persistence (resets on server restart)
- Mock AI analysis (requires OpenAI API for real implementation)
- No image uploads for comments (placeholder)
- No actual ORCID verification
- No email verification

## Future Enhancements

- Real authentication with JWT/sessions
- Image upload support for comments
- Export discussion threads
- Email notifications
- Advanced search with filters
- User reputation system
- Moderation tools
- Paper submission workflow
- Citation graph visualization

## License

This is a test project for educational purposes.
