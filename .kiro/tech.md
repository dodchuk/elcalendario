# Tech Stack & Conventions

## Stack
- **Runtime**: React Native 0.81 + Expo 54 (managed workflow)
- **Language**: TypeScript 5.9
- **State**: React Context + useReducer (no Redux)
- **Persistence**: @react-native-async-storage/async-storage
- **Animation**: react-native-reanimated 4.1 (worklets, useFrameCallback, shared values)
- **Gestures**: react-native-gesture-handler (Swipeable)
- **Icons**: @expo/vector-icons (Ionicons)
- **Gradients**: expo-linear-gradient
- **Web**: react-native-web (runs on web via Expo)

## Architecture
- Clean architecture layers: domain → application → ui
- No navigation library — manual tab/screen state in App.tsx
- Physics animations run on UI thread via `useFrameCallback` worklets
- State persisted to AsyncStorage on every change

## Conventions

### Styling
- Dark theme: `#000` base, `rgba(255,255,255,...)` for surfaces
- StyleSheet.create at bottom of each file
- Inline styles only for dynamic/conditional values
- Box shadows and glow via `boxShadow` CSS string (web-compatible)
- Emoji colors mapped in `tagColors.ts` — every emoji has a unique glow color

### Components
- Functional components only, no class components
- `useMemo` for expensive computations
- `useCallback` for handlers passed as props
- `useRef` for values that shouldn't trigger re-renders
- SharedValues for animation state (never useState for per-frame data)

### Physics Animations
- `useFrameCallback` with `"worklet"` directive
- Positions stored in SharedValue arrays (`xs`, `ys`, `vxs`, `vys`)
- Array `.slice()` + reassign pattern for worklet-compatible updates
- Collision detection only for small sets (<20 items)
- Viewport culling for large sets (TagManager emojis)

### Data Model
```typescript
type CalendarState = {
  tags: { id: string; emoji: string }[];
  entries: Record<string, string[]>;      // "YYYY-MM-DD" → tagId[]
  timeEntries: Record<string, TimeSlot[]>; // "YYYY-MM-DD" → slots
};
type TimeSlot = { tagId: string; time: string }; // time = "HH:MM"
```

### Date Format
- All dates stored as `"YYYY-MM-DD"` strings
- Month is 0-indexed internally (JS Date), 1-indexed in strings
- `pad()` helper for zero-padding

### UI Patterns
- FlatList with `snapToOffsets` / `pagingEnabled` for calendar scrolling
- Animated overlays with `opacity` + `translateY` transitions
- Skeleton states: `rgba(255,255,255,0.03-0.08)` fills
- Active states: emoji's mapped color with `boxShadow` glow
- Section separators: `StyleSheet.hairlineWidth` borders

### Settings
- First day of week: stored in AsyncStorage, applied to MonthView/YearView/DayFocusBlock
- Nickname: debounced save to AsyncStorage (ready for API)

### Build & Run
```bash
npx expo start --web    # Web development
npx expo run:ios        # iOS native
npx tsc --noEmit        # Type check
```
