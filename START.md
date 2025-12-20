# How to Start the Application

## The Error Was Fixed!

The issue was that `lib/auth.ts` contained JSX code but had a `.ts` extension instead of `.tsx`. This has been fixed - the file has been renamed to `lib/auth.tsx`.

## To Start the Application

1. Open a new terminal/command prompt

2. Navigate to the project directory:
```bash
cd "e:\Document\Miscellaneous Documents\PBC2025\Learning-Phase-3\Test\paper-discussion-platform"
```

3. Start the development server:
```bash
npm run dev
```

4. Wait for the message:
```
✓ Ready in X.Xs
```

5. Open your browser and visit:
```
http://localhost:3000
```

## If You See Port Conflicts

If port 3000 is in use, Next.js will automatically use another port (like 3001 or 3002). Just use whatever port is shown in the terminal output.

Alternatively, to force kill any process using port 3000:
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Then restart
npm run dev
```

## Demo Login Credentials

Once the application loads, log in with:
- Email: `alice@university.edu`
- Password: `password123`

Or create a new account using the "Sign Up" button.

## What's Fixed

The file `lib/auth.tsx` (previously `lib/auth.ts`) now has the correct extension for TypeScript files containing JSX/TSX code. All imports throughout the application will automatically resolve to the `.tsx` file.

## Next Steps

1. Start the server with `npm run dev`
2. Open http://localhost:3000
3. Log in and explore all six pages:
   - User Entrance (login/signup)
   - Homepage (your threads and archived papers)
   - Search (find and discover papers)
   - Article (view paper details and comments)
   - Comment (create new discussions)
   - Settings (manage your profile)

Enjoy your paper discussion platform!
