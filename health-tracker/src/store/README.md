# State Management Guide

This health tracker application uses Zustand for state management with comprehensive offline support, data persistence, and real-time updates.

## Architecture Overview

### Stores

1. **UI Store** (`ui-store.ts`)
   - Global UI state (loading, modals, navigation)
   - No persistence

2. **User Profile Store** (`user-profile-store.ts`)
   - User profile data and preferences
   - Persists preferences to localStorage

3. **Fasting Session Store** (`fasting-session-store.ts`)
   - Active fasting sessions and timer state
   - Real-time timer updates
   - Persists timer state for app restarts

4. **Health Metrics Store** (`health-metrics-store.ts`)
   - Weight records and health metrics
   - Caches recent data

5. **Scheduled Fasts Store** (`scheduled-fasts-store.ts`)
   - Scheduled and recurring fasts
   - Upcoming fast notifications

6. **Offline Store** (`offline-store.ts`)
   - Manages offline state and queued actions
   - Automatic sync when back online

## Usage Examples

### Basic Store Usage

```typescript
import { useUIStore } from '@/store'

function MyComponent() {
  const { isLoading, setLoading } = useUIStore()
  
  // Use the state and actions
}
```

### Using Data Hooks

```typescript
import { useFastingSessions } from '@/hooks'

function FastingTimer() {
  const {
    activeSession,
    timerState,
    startSession,
    endSession,
  } = useFastingSessions()
  
  // Component logic
}
```

### Offline Support

```typescript
import { useHealthMetrics } from '@/hooks'

function WeightTracker() {
  const { addWeight } = useHealthMetrics()
  
  // This automatically handles offline scenarios
  await addWeight(75.5, 'Morning weight')
}
```

### Real-time Timer

```typescript
import { useRealtimeTimer } from '@/hooks'

function TimerDisplay() {
  const { elapsed, remaining, progress } = useRealtimeTimer()
  
  return <div>{elapsed}</div>
}
```

### Auto-save Forms

```typescript
import { useAutoSave } from '@/hooks'

function ProfileForm() {
  const [data, setData] = useState({})
  
  useAutoSave(data, {
    delay: 2000,
    onSave: async (data) => {
      await saveToAPI(data)
    }
  })
}
```

## Key Features

### 1. Offline-First Architecture
- All actions queue when offline
- Automatic sync when back online
- Optimistic UI updates

### 2. Data Persistence
- Selected state persists to localStorage
- Handles app restarts gracefully
- Version migration support

### 3. Real-time Updates
- Fasting timer updates every second
- Auto-save with debouncing
- Immediate UI feedback

### 4. Type Safety
- Full TypeScript support
- Strongly typed stores and actions
- IntelliSense for all hooks

### 5. Performance
- Selective subscriptions
- Memoized selectors
- Minimal re-renders

## Best Practices

1. **Use the provided hooks** instead of accessing stores directly
2. **Handle errors** at the component level
3. **Leverage offline support** for better UX
4. **Use auto-save** for forms with draft data
5. **Clean up subscriptions** in useEffect hooks

## Testing

```typescript
// Reset all stores for testing
import { resetAllStores } from '@/store/utils'

beforeEach(() => {
  resetAllStores()
})
```

## Advanced Usage

### Custom Store Selectors

```typescript
const selectActiveSessionDuration = (state) => {
  if (!state.timerState) return 0
  return state.timerState.elapsedSeconds
}

const duration = useFastingSessionStore(selectActiveSessionDuration)
```

### Middleware

```typescript
// Example: Logger middleware
const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('Previous state:', get())
      set(...args)
      console.log('New state:', get())
    },
    get,
    api
  )
```