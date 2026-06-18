# FanVerse

A production-ready React Native / Expo mobile app — a social platform where football fans represent their favorite national teams and participate in debates, predictions, polls, and community discussions.

## Tech Stack

- **React Native + Expo SDK 52** (web preview via `expo start --web`)
- **Expo Router v4** (file-based routing)
- **@tanstack/react-query** (server state)
- **AsyncStorage** (local persistence)
- **expo-linear-gradient, expo-haptics, expo-secure-store**
- **@expo-google-fonts/poppins** (typography)
- **@expo/vector-icons** (Ionicons)

## Running the App

- Workflow: `Start Frontend` — runs `CI=1 npx expo start --web --port 5000`
- Web preview on port 5000
- Scan QR code from Expo Go on your phone for native preview

## App Structure

```
app/
  _layout.tsx           # Root layout (providers: QueryClient, SafeArea, Keyboard, Auth, App)
  index.tsx             # Redirect based on auth/team state
  (auth)/login.tsx      # Email login screen
  (auth)/register.tsx   # Registration screen
  onboarding.tsx        # Team selection (choose national team)
  (tabs)/index.tsx      # Home feed with XP dashboard + hot debates
  (tabs)/arena.tsx      # Debate Arena (upvote/downvote debates)
  (tabs)/predict.tsx    # Match prediction center
  (tabs)/communities.tsx # Group discovery and management
  (tabs)/profile.tsx    # Fan profile with stats, badges, XP
  create-group.tsx      # Create new group (modal)
  create-debate.tsx     # Create new debate (modal)

context/
  AuthContext.tsx       # Auth state, login/register/logout, team selection
  AppContext.tsx        # Groups, debates, predictions, leaderboard state

data/teams.ts           # 24 national teams with flags, confederations, fan counts
constants/colors.ts     # Dark/light theme tokens
```

## Key Features Built

1. **Authentication** — Email login/register, profile stored in AsyncStorage
2. **Team Selection** — 24 national teams, searchable, filterable by confederation
3. **Home Dashboard** — XP bar, level, reputation/debate/prediction stats
4. **Debate Arena** — Create debates, upvote/downvote, filter by Hot/New/Top
5. **Prediction Center** — Submit score predictions, leaderboard preview
6. **Communities** — Browse/search/join groups, create new groups
7. **Create Group** — Full form with name, description, team picker (modal), privacy toggle, tags
8. **Fan Profile** — Stats grid, badges, XP progress bar, team display

## Design

- Dark navy (`#0a0e1a`) primary background
- Electric gold (`#f5a623`) primary accent
- Electric blue (`#3b82f6`) secondary accent
- Poppins font family (400/500/600/700)
- Dark mode only (automatic)

## User Preferences

- Build production-ready mobile apps with premium UI
- Sports social network inspired by Reddit, Discord, X, and FIFA
