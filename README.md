# CP Progress Tracker

A full-stack competitive programming progress tracking application with MongoDB backend and React frontend.

## Features

- ✅ **Team-based tracking** - Create or join teams with shareable Team IDs
- ✅ **Multi-platform support** - TLE Eliminators, USACO Guide, CSES Problemset
- ✅ **370+ pre-seeded problems** - Automatically loaded when you create a team
- ✅ **Google Sheets-style interface** - See all teammates' progress in one view
- ✅ **Status tracking** - Mark problems as solved, todo, revision, or skipped
- ✅ **Problem reordering** - Rearrange problems within rating groups
- ✅ **Daily streaks** - Track consecutive days of solving problems
- ✅ **Leaderboard** - Weighted scoring based on problem difficulty
- ✅ **Contest notifications** - Add upcoming contests with countdown
- ✅ **Custom sheets** - Create your own problem collections
- ✅ **Search functionality** - Find problems quickly
- ✅ **Dark code-editor theme** - Beautiful, modern UI

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (free tier works perfectly)

## Setup Instructions

### 1. Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)

### 2. Backend Setup

```bash
cd cp-tracker/backend

# The dependencies are already installed, but if needed:
# npm install

# Create .env file (or edit the existing one)
# Add your MongoDB connection string:
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd cp-tracker/frontend

# Dependencies are already installed, but if needed:
# npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Using the Application

1. **Create a Team**:
   - Open `http://localhost:5173`
   - Click "Create Team" tab
   - Enter a username and password
   - You'll get a unique Team ID - **save this!**
   - 370+ problems will be automatically loaded

2. **Invite Teammates**:
   - Share your Team ID with teammates
   - They click "Join Team" and enter:
     - Your Team ID
     - Their username
     - Their password

3. **Track Progress**:
   - Navigate to TLE/USACO/CSES sheets
   - Click dropdowns in your column to update status
   - See teammates' progress in their columns
   - Reorder problems with ⬆⬇ buttons (within rating groups)

4. **View Stats**:
   - Check the Leaderboard for rankings
   - See daily streaks (🔥) next to usernames
   - View individual teammate sheets

5. **Add Contests**:
   - Go to Contests section
   - Click "Add Contest"
   - Nearest upcoming contest shows at the top

## Project Structure

```
cp-tracker/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # JWT authentication
│   ├── utils/           # Seed data (370+ problems)
│   └── server.js        # Express server
└── frontend/
    ├── src/
    │   ├── App.tsx      # Main application
    │   ├── api.ts       # API service layer
    │   ├── types.ts     # TypeScript interfaces
    │   └── index.css    # Dark theme styling
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/create-team` - Create new team
- `POST /api/auth/join-team` - Join existing team
- `POST /api/auth/login` - Login to team
- `GET /api/auth/team-members` - Get all team members

### Problems
- `GET /api/problems/:sheet` - Get problems for a sheet
- `POST /api/problems` - Add new problem
- `PUT /api/problems/:id/reorder` - Reorder problem

### Progress
- `GET /api/progress` - Get all team progress
- `PUT /api/progress/:problemId` - Update problem status
- `GET /api/progress/user/:username` - Get user's progress
- `GET /api/progress/streak/:username` - Get user's streak

### Leaderboard
- `GET /api/leaderboard` - Get team leaderboard

### Contests
- `GET /api/contests` - Get all contests
- `POST /api/contests` - Add contest
- `DELETE /api/contests/:id` - Delete contest

### Custom Sheets
- `GET /api/sheets/custom` - Get custom sheets
- `POST /api/sheets/custom` - Create custom sheet
- `PUT /api/sheets/custom/:id` - Rename sheet
- `DELETE /api/sheets/custom/:id` - Delete sheet

## Technologies Used

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Axios for API calls
- Lucide React for icons
- Custom CSS with dark theme

## Troubleshooting

**Backend won't start:**
- Check if MongoDB connection string is correct in `.env`
- Make sure MongoDB Atlas allows connections from your IP
- Verify port 5000 is not in use

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_BASE_URL in `frontend/src/api.ts`

**Problems not loading:**
- Check browser console for errors
- Verify you're logged in (check localStorage for token)
- Try creating a new team (problems seed automatically)

## Features in Detail

### Problem Reordering
- You can only reorder problems within the same rating group
- Example: You can move "Watermelon" (800) above "Bit++" (800)
- But you cannot move an 800-rated problem into the 900 section

### Streak Calculation
- Counts consecutive days you've solved at least one problem
- Resets if you skip a day
- Displayed with 🔥 icon next to usernames

### Weighted Scoring
- TLE: Rating / 100 (e.g., 1200 = 12 points)
- USACO: Bronze=5, Silver=10, Gold=15, Platinum=20
- CSES: Intro=3, Sorting=6, DP=10, Graph=12

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
# cp-tracker
# cp-tracker
# cp-tracker
# cp-tracker
