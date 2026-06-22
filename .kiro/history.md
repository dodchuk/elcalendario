# Development History

## Phase 1: Foundation
1. **Project setup** — Expo 54 + React Native 0.81, TypeScript, basic folder structure
2. **Auth flow** — Welcome screen, Sign In, Sign Up, Forgot Password screens
3. **Store context** — useReducer + AsyncStorage persistence for tags/entries/timeEntries
4. **Auth context** — User state management (signIn, signOut)
5. **Tab navigation** — Manual tab system in App.tsx (no library)

## Phase 2: Calendar Core
6. **Calendar component** — Basic month calendar grid
7. **MonthView** — FlatList with snap scrolling, paginated month navigation
8. **YearView** — 12-month mini calendar grid with year navigation
9. **Day focus overlay** — Animated overlay (opacity + translateY) over calendar, not a separate screen
10. **DayFocusBlock** — Skeleton calendar grid showing selected day context

## Phase 3: Emoji System
11. **Tag system** — Add/remove emoji tags with unique IDs
12. **tagColors.ts** — Unique glow color mapped to every emoji (~90 emojis)
13. **BubbleRing** — Physics-based emoji ring for day page:
    - Collision detection between bubbles
    - Boundary-aware positioning (half-circles at edges)
    - 2-bubble edge case handling
    - Flower positioning algorithm
14. **DayTimeline** — Time slot assignment:
    - Floating emojis with physics animation
    - Tap to assign emoji to time slot
    - Emoji-colored row highlights

## Phase 4: Emoji Tab (TagManager)
15. **TagManager** — Full emoji selection interface:
    - All ~90 emojis displayed as floating physics bubbles
    - Scrollable grid with viewport culling for performance
    - Tap to toggle active/inactive state
    - Physics simulation per visible bubble

## Phase 5: Visual Design
16. **Dark theme** — #000 backgrounds, acid glow colors throughout
17. **Auth screen redesign** — Dark gradient backgrounds, skeleton logo, all buttons blue (#0a84ff)
18. **Lava lamp background** — Calendar tab background:
    - 12 blobs with heat-based buoyancy physics
    - Day-phase colors (morning/day/evening/night via getDayPhase())
    - Gentle random glow pulses
    - useFrameCallback worklet for UI thread animation
    - SharedValue arrays for positions/velocities
19. **Screen progress bar** — Blue multicolor gradient bar on tab transitions

## Phase 6: Settings & Profile
20. **Settings context** — First day of week (Sun–Sat), AsyncStorage persistence
21. **First day applied** — MonthView, YearView, DayFocusBlock all respect firstDay setting
22. **Profile screen** — Tab-based (not overlay), returns to previous tab on close:
    - Gradient background
    - Auto-save nickname (debounced)
    - Subscription section
    - Account section
    - Change password flow

## Phase 7: Dashboard Analytics
23. **Dashboard component** (~850 lines) with synced month/year from calendar:
    - **HUD cards** — Tracked Today, This Week (hidden for past months)
    - **Energy ball (AuraCircle)** — Pulsating + rotating aura with emoji colors
    - **Weekly trends** — TradingView-style bar charts with colored % badges
    - **Heatmap** — 12 mini calendars, month/year toggle, Less→More legend
    - **Days tracked + Peak day/month** — Stats cards
    - **Streak cards** — Current/longest streaks (no motivational labels)
    - **Habit formation** — 21-day tracker
    - **Established habits** — Habits that passed 21-day threshold
    - **Routine score** — Consistency metric
    - **Always together combos** — Emoji pairs frequently used together
    - **Weekend warrior** — Weekend vs weekday comparison
    - **Replaced patterns** — Emojis that replaced others
    - **New/Dropped/Inactive emojis** — Lifecycle tracking
    - **"By end of year" projections** — Progress bars with extrapolation
24. **Dashboard ↔ Calendar sync** — Shared year/month/viewMode state via props

## Phase 8: Polish & Fixes
25. **YearView ↔ Dashboard sync** — onYearChange callback so year nav propagates to parent
26. **Nav arrow styling** — Matched YearView arrows to Dashboard (28px circles, 14px icons, gap:10, fontSize:15)
27. **Fixed-width nav labels** — YearView `width:50`, Dashboard `minWidth:80` to prevent layout jumps
28. **Disabled state** — opacity:0.3 on forward arrow when at current year
29. **Section separators** — Hairline borders between dashboard sections
30. **Unused code cleanup** — Removed old WaveBg, replaced with LavaBg
