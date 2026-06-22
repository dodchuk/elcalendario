# Project Structure

## Root
```
elcalendario-mobile/
├── App.tsx                  # Root component: tab navigation, LavaBg, auth flow
├── index.ts                 # Entry point
├── app.json                 # Expo config
├── tsconfig.json
├── package.json
├── assets/                  # Icons, splash images
├── ios/                     # Native iOS project (Expo prebuild)
└── src/
    ├── application/         # Contexts & state management
    ├── domain/              # Business logic & types
    ├── infrastructure/      # Persistence (AsyncStorage)
    └── ui/                  # Presentation layer
        ├── components/      # Reusable UI components
        ├── screens/         # Full-page screens
        └── theme/           # Colors, emoji-to-color mappings
```

## Application Layer (`src/application/`)
- **StoreContext.tsx** — Global state (tags, entries, timeEntries) with useReducer + AsyncStorage persistence
- **AuthContext.tsx** — Auth state (user, signIn, signOut)
- **SettingsContext.tsx** — User preferences (firstDay of week) persisted to AsyncStorage

## Domain Layer (`src/domain/`)
- **vo/types.ts** — Core types: `CalendarState`, `Action`, `TimeSlot`
- **calendarReducer.ts** — Reducer handling TOGGLE_EMOJI, ADD_TAG, DEL_TAG, SET_TIME_SLOT, etc.
- **streaks.ts** — Streak calculation utilities

## Infrastructure Layer (`src/infrastructure/`)
- **calendarRepository.ts** — AsyncStorage read/write for state persistence

## UI Components (`src/ui/components/`)
- **MonthView.tsx** — Month calendar with FlatList, snap scrolling, day focus overlay
- **YearView.tsx** — 12-month mini calendar grid
- **DayFocusBlock.tsx** — Skeleton calendar with BubbleRing for selected day
- **BubbleRing.tsx** — Physics-based emoji ring animation (collision, glow, position-aware)
- **DayTimeline.tsx** — Time slot assignment with floating physics bubbles
- **Dashboard.tsx** — Stats dashboard (heatmap, streaks, trends, projections, aura)
- **TagManager.tsx** — Emoji selection with floating physics bubbles
- **Calendar.tsx** — Legacy calendar component
- **ScreenProgressBar.tsx** — Blue gradient loading bar on navigation

## UI Screens (`src/ui/screens/`)
- **SignInScreen.tsx** — Dark themed sign-in with skeleton logo
- **SignUpScreen.tsx** — Registration
- **FindAccountScreen.tsx** — Forgot password flow
- **WelcomeScreen.tsx** — Splash/loading screen
- **ProfileScreen.tsx** — User profile, settings, change/reset password

## UI Theme (`src/ui/theme/`)
- **colors.ts** — Global theme tokens (bg, fg, fgMuted, accent, etc.)
- **tagColors.ts** — Emoji-to-color mapping with fallback palette

## Navigation Flow
```
Auth: Welcome → SignIn → [FindAccount | SignUp] → Main
Main tabs: Emojis | Calendar | Dashboard | (Profile via header icon)
Calendar: YearView → MonthView → DayFocusBlock (overlay)
```
