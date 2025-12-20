# Quick Start Guide

## Your Application is Running!

The development server is running at:
- **Local**: http://localhost:3000
- **Network**: http://10.2.44.46:3000

## How to Use the Application

### 1. Login or Sign Up
Visit http://localhost:3000 and you'll see the login page.

**Demo Accounts** (already created):
- Email: `alice@university.edu` / Password: `password123`
- Email: `bob@research.org` / Password: `password123`
- Email: `carol@institute.edu` / Password: `password123`

Or click "Sign Up" to create a new account.

### 2. Explore the Homepage
After logging in, you'll see:
- Your discussion threads
- Archived papers
- Navigation to search for papers

### 3. Search for Papers
Click "Search" in the navigation bar to:
- Browse recommended papers based on your interests
- Search for specific papers
- Filter by rating and sort by date or rating

### 4. View Article Details
Click on any paper to see:
- Full paper information with collapsible sections
- Community ratings and AI-generated discussion summary
- Existing comments and discussions
- Option to archive the paper
- Rate the paper (1-5 stars)

### 5. Start a Discussion
On an article page:
- Click "Start New Thread" to create a top-level comment
- Click "Reply" on any comment to respond
- Your comment will be analyzed by AI for quality labels

### 6. Edit Your Profile
Click "Settings" to:
- Update your username and personal information
- Add your ORCID (optional)
- Set your research interests (improves recommendations)
- Configure institution and demographic info

## Application Flow

```
Login/Signup → Homepage → Search → Article Details → Comment
                  ↓                      ↓
              Settings ←────────────────┘
```

## Key Features Demonstrated

### Thread-Based Comments
- Root comments start new discussion threads
- Replies nest under parent comments
- Show/hide reply threads for better organization

### AI Comment Analysis
Comments are automatically labeled as:
- ✅ meaningful, critical, helpful (positive)
- ❌ non-sense, useless, irrational (negative)

### Personalized Recommendations
Based on:
- Your research interests (set in Settings)
- Paper ratings from the community
- Your previous activity

### Paper Management
- Archive papers for quick access later
- Rate papers to help the community
- View AI summaries of community discussions

## Sample Data Included

The application comes with sample data:
- 3 users (alice, bob, carol)
- 3 scientific papers (Transformer, BERT, AlexNet)
- 8 comments with various quality labels
- Ratings and archived papers

## Development Commands

```bash
# Stop the server (if needed)
Ctrl+C in the terminal

# Restart the server
npm run dev

# Build for production
npm run build

# Run production build
npm run start
```

## Next Steps

1. **Test all pages**: Login, Home, Search, Article, Comment, Settings
2. **Try all features**:
   - Create a new comment
   - Rate an article
   - Archive/unarchive papers
   - Update your settings
   - Search for papers
3. **Prepare for Supabase**: See README.md for migration instructions
4. **Add ChatGPT API**: See README.md for AI integration steps

## Troubleshooting

### Port 3000 already in use?
```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Changes not showing?
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check terminal for compilation errors

### TypeScript errors?
```bash
# Check for errors
npm run build
```

## Application Architecture

- **Frontend**: Next.js 15 with React Server Components and Client Components
- **Styling**: Tailwind CSS for responsive design
- **State**: React Context for authentication, local state for components
- **Data**: JSON files simulating database (easily replaceable with Supabase)
- **Routing**: Next.js App Router with dynamic routes

## Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 120+
- Edge 120+
- Safari 17+

Enjoy exploring your scientific paper discussion platform!
