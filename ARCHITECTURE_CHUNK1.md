# Architecture Pack - Chunk 1: Foundation & Structure

## 1. Folder Tree

```
anvil/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Entry point (role gate)
│   │
│   ├── (auth)/                  # Auth flow (unauthenticated)
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   │
│   ├── (onboarding)/            # Post-auth onboarding
│   │   ├── role.tsx             # Role selection
│   │   └── profile.tsx          # Initial profile setup
│   │
│   ├── (trainer)/               # Trainer routes
│   │   ├── _layout.tsx          # Trainer layout guard
│   │   │
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── _layout.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── clients.tsx
│   │   │   └── profile.tsx
│   │   │
│   │   ├── programs/            # Program Builder
│   │   │   ├── index.tsx        # Program list
│   │   │   └── [programId].tsx  # Builder shell
│   │   │
│   │   ├── clients/
│   │   │   ├── [clientId].tsx   # Client detail
│   │   │   └── [clientId]/
│   │   │       └── assign-program.tsx  # Assign program
│   │   │
│   │   └── add-client.tsx
│   │
│   └── (client)/                # Client routes
│       ├── _layout.tsx          # Client layout guard
│       │
│       ├── (tabs)/              # Tab navigation
│       │   ├── _layout.tsx
│       │   ├── dashboard.tsx
│       │   ├── coach.tsx
│       │   ├── profile.tsx
│       │   └── history.tsx      # Workout history (tab)
│       │
│       ├── program/             # Active program
│       │   ├── index.tsx        # Program overview
│       │   └── schedule.tsx     # Schedule view
│       │
│       ├── runner/              # Workout execution
│       │   └── [workoutDayId].tsx
│       │
│       ├── find-trainer.tsx
│       └── link-trainer.tsx
│
├── src/
│   ├── features/                # Feature modules (domain logic)
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   ├── authApiSlice.ts      # RTK Query endpoints
│   │   │   │   └── authApiTypes.ts      # RPC contract types
│   │   │   ├── components/
│   │   │   │   └── AuthBootstrap.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuthActions.ts
│   │   │   │   └── useAuthBootstrap.ts
│   │   │   ├── store/
│   │   │   │   └── authSlice.ts         # UI state only
│   │   │   └── types/
│   │   │       └── auth.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── api/
│   │   │   │   ├── profileApiSlice.ts   # RTK Query endpoints
│   │   │   │   └── profileApiTypes.ts   # RPC contract types
│   │   │   ├── hooks/
│   │   │   │   └── useMyProfile.ts
│   │   │   └── types/
│   │   │       └── profile.ts
│   │   │
│   │   ├── linking/
│   │   │   ├── api/
│   │   │   │   ├── linkingApiSlice.ts
│   │   │   │   └── linkingApiTypes.ts   # RPC contract types
│   │   │   ├── types/
│   │   │   │   └── linking.ts
│   │   │   └── utils/
│   │   │       └── linkingErrors.ts
│   │   │
│   │   ├── programBuilder/      # Program creation/editing
│   │   │   ├── api/
│   │   │   │   ├── programBuilderApiSlice.ts
│   │   │   │   └── programBuilderApiTypes.ts  # RPC contract types
│   │   │   ├── components/      # Feature-specific components
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   │   └── programBuilderSlice.ts  # UI state (selectedExerciseIds, activeTab) - minimal
│   │   │   └── types/
│   │   │       └── programBuilder.ts
│   │   │
│   │   ├── assignment/          # Program assignment to clients
│   │   │   ├── api/
│   │   │   │   ├── assignmentApiSlice.ts
│   │   │   │   └── assignmentApiTypes.ts  # RPC contract types
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   │   └── assignmentSlice.ts    # UI state (filters, selected client, etc.)
│   │   │   └── types/
│   │   │       └── assignment.ts
│   │   │
│   │   ├── runner/              # Workout execution
│   │   │   ├── api/
│   │   │   │   ├── runnerApiSlice.ts
│   │   │   │   └── runnerApiTypes.ts     # RPC contract types
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   │   └── runnerSlice.ts        # UI state (current set, timer, etc.)
│   │   │   └── types/
│   │   │       └── runner.ts
│   │   │
│   │   └── exercises/           # Exercise management
│   │       ├── api/
│   │       │   ├── exercisesApiSlice.ts
│   │       │   └── exercisesApiTypes.ts  # RPC contract types
│   │       ├── components/
│   │       │   ├── ExercisePicker.tsx   # Reusable picker widget
│   │       │   └── ExerciseForm.tsx     # CRUD forms
│   │       ├── hooks/
│   │       ├── store/
│   │       │   └── exercisesSlice.ts    # UI state (filters, search, etc.)
│   │       └── types/
│   │           └── exercises.ts
│   │
│   ├── shared/                  # Shared utilities & primitives
│   │   ├── api/
│   │   │   └── api.ts           # Single shared RTK Query base API (createApi)
│   │   │
│   │   ├── components/          # Reusable widgets (no feature imports)
│   │   │   ├── AppErrorBoundary.tsx
│   │   │   ├── AppInput.tsx
│   │   │   ├── BottomSheetPicker.tsx
│   │   │   ├── FullscreenState.tsx
│   │   │   └── KeyboardScreen.tsx
│   │   │
│   │   ├── ui/                  # Primitive UI components only
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Chip.tsx
│   │   │   │   ├── Divider.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── StickyHeader.tsx
│   │   │   │   └── Text.tsx
│   │   │   ├── layout/
│   │   │   │   ├── KeyboardScreen.tsx
│   │   │   │   └── Stack.tsx
│   │   │   ├── theme/
│   │   │   │   ├── index.ts
│   │   │   │   ├── ThemeProvider.tsx
│   │   │   │   └── tokens.ts
│   │   │   ├── alert/
│   │   │   │   └── AppAlertProvider.tsx
│   │   │   ├── toast/
│   │   │   │   ├── toast.ts
│   │   │   │   └── ToastProvider.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAppDispatch.ts
│   │   │   └── useAppSelector.ts
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── imageUpload.ts
│   │   │
│   │   ├── constants/
│   │   │   └── countries.ts
│   │   │
│   │   └── i18n/
│   │       ├── i18n.ts
│   │       ├── rtl.ts
│   │       ├── useAppTranslation.ts
│   │       └── resources/
│   │           ├── en.json
│   │           ├── ar.json
│   │           └── fr.json
│   │
│   └── store/
│       ├── store.ts             # Redux store config
│       └── rootReducer.ts       # Combined reducers
│
├── assets/
├── scripts/
├── .gitignore
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## 2. Route Map

### Authentication & Onboarding
- `/` → `app/index.tsx` - Role gate (redirects based on auth state)
- `/(auth)/sign-in` → Sign in
- `/(auth)/sign-up` → Sign up
- `/(auth)/forgot-password` → Password reset request
- `/(auth)/reset-password` → Password reset form
- `/(onboarding)/role` → Role selection (trainer/client)
- `/(onboarding)/profile` → Initial profile setup

### Trainer Routes
- `/(trainer)/(tabs)/dashboard` → Trainer dashboard
- `/(trainer)/(tabs)/clients` → Client list
- `/(trainer)/(tabs)/profile` → Trainer profile
- `/(trainer)/programs` → **Program list** (NEW)
- `/(trainer)/programs/[programId]` → **Program builder shell** (NEW)
- `/(trainer)/clients/[clientId]` → Client detail
- `/(trainer)/clients/[clientId]/assign-program` → **Assign program to client** (NEW)
- `/(trainer)/add-client` → Add new client

### Client Routes
- `/(client)/(tabs)/dashboard` → Client dashboard
- `/(client)/(tabs)/coach` → Coach info
- `/(client)/(tabs)/profile` → Client profile
- `/(client)/(tabs)/history` → **Workout history** (NEW - tab)
- `/(client)/program` → **Active program overview** (NEW)
- `/(client)/program/schedule` → **Program schedule view** (NEW)
- `/(client)/runner/[workoutDayId]` → **Workout execution** (NEW)
- `/(client)/find-trainer` → Find trainer
- `/(client)/link-trainer` → Link trainer via QR/code

## 3. Data Flow Plan

### Core Principles

1. **Server State → RTK Query Only**
   - All server data lives in RTK Query cache
   - No Redux slices for server state
   - RTK Query handles caching, invalidation, refetching

2. **UI State → Redux Slices (Minimal)**
   - Redux slices only for client-side UI state that must persist across screens or be shared widely:
     - Filters, search terms (if shared across screens)
     - Selected IDs (selected exercise, selected client) - only if needed across screens
     - Modal open/closed state (if shared)
   - **Do NOT create slices for:**
     - Form/draft state (use react-hook-form/local state)
     - Single-screen UI state (use local useState)
     - Pagination state (usually local or RTK Query)

3. **Form State → react-hook-form / Local State**
   - Forms use `react-hook-form` for local state management
   - No Redux for form state
   - Submit handlers call RTK Query mutations

4. **Auth State → Hybrid Approach**
   - **Access tokens**: NOT stored in Redux
     - Retrieved from Supabase client session: `supabase.auth.getSession()`
     - Supabase client manages token refresh automatically
   - **Redux auth slice stores**:
     - `userId: string | null`
     - `role: UserRole | null`
     - `roleConfirmed: boolean`
     - `bootstrapStatus: 'idle' | 'loading' | 'ready' | 'error'`
     - `errorMessage: string | null`
   - Session changes trigger Redux updates via auth listener

5. **RPC Contract Typing**
   - Each feature's `api/*ApiTypes.ts` file defines:
     - Exact argument shapes for each RPC endpoint
     - Exact return/result shapes
     - No invented fields - must match database schema
   - **RPC Args Rules:**
     - Do NOT include `trainerId`/`userId` in args unless RPC requires it
     - Backend uses `auth.uid()` in most RPCs, so user context is implicit
     - Only pass IDs when required: `programId`, `workoutDayId`, `clientId`, `programPhaseId`, etc.
   - **Field Names:**
     - Use DB/RPC names exactly: `title` (not `name`), `trainerId` (camelCase), `createdAt`/`updatedAt` if present
     - No invented fields
   - Example structure:
     ```typescript
     // programBuilderApiTypes.ts
     // RPC: anvil_create_program(title, description)
     export type CreateProgramArgs = { 
       title: string; 
       description: string | null; 
     };
     export type CreateProgramResult = { id: string };
     
     // RPC: anvil_list_exercises_for_trainer()
     export type ListExercisesArgs = void; // or {}
     export type ListExercisesResult = Exercise[];
     
     // RPC: anvil_get_program(programId)
     export type GetProgramArgs = { programId: string };
     export type GetProgramResult = {
       id: string;
       trainerId: string;
       title: string;
       description: string | null;
       createdAt: string;
       updatedAt: string;
     };
     ```

### Feature Data Flow Examples

#### Profile Feature
- **Server State**: `useGetMyUserRowQuery(userId)`, `useGetClientProfileQuery(userId)`
- **UI State**: None (no filters/modals needed)
- **Form State**: `react-hook-form` in profile edit screens
- **No profile slice** - removed, data only in RTK Query cache

#### Program Builder Feature
- **Server State**: 
  - `useGetProgramQuery(programId)`
  - `useListExercisesQuery()` - exercise library (no filters in args, backend handles)
- **UI State** (programBuilderSlice - minimal):
  - `selectedExerciseIds: string[]` (only if needed across screens)
  - `activeTab: 'overview' | 'exercises' | 'schedule'` (only if persists across navigation)
- **Form State**: `react-hook-form` for program metadata forms (local state, not Redux)
- **Note**: `draftProgram` should be local form state, not Redux

#### Runner Feature
- **Server State**:
  - `useGetWorkoutDayQuery(workoutDayId)`
  - `useGetExerciseDetailsQuery(exerciseId)`
- **UI State** (runnerSlice):
  - `currentSetIndex: number`
  - `timerState: 'idle' | 'running' | 'paused'`
  - `timerSeconds: number`
  - `completedSets: CompletedSet[]`
- **Form State**: `react-hook-form` for set input (weight, reps, etc.)

#### Exercises Feature
- **Server State**:
  - `useListExercisesQuery()` - backend handles filtering
  - `useGetExerciseQuery(exerciseId)`
- **UI State** (exercisesSlice - only if needed):
  - `pickerOpen: boolean` (only if picker state must persist across screens)
- **Form State**: `react-hook-form` for exercise CRUD forms
- **Note**: `searchTerm`, `selectedCategory` should be local state unless shared across screens

### Auth Flow

```typescript
// Auth slice (UI state only)
type AuthState = {
  userId: string | null;
  role: UserRole | null;
  roleConfirmed: boolean;
  bootstrapStatus: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage: string | null;
};

// Access token retrieved from Supabase session
const session = await supabase.auth.getSession();
const accessToken = session.data.session?.access_token;

// RTK Query endpoints use Supabase client directly
// Supabase client automatically includes access token in requests
```

### RPC Contract Typing Structure

Each feature's `*ApiTypes.ts` file must define:

```typescript
// Example: programBuilderApiTypes.ts

// RPC: anvil_create_program(title, description)
export type CreateProgramArgs = {
  title: string;
  description: string | null;
};
export type CreateProgramResult = { id: string };

// RPC: anvil_list_programs_for_trainer()
export type ListProgramsArgs = void; // or {}
export type ListProgramsResult = {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_get_program(programId)
export type GetProgramArgs = { programId: string };
export type GetProgramResult = {
  id: string;
  trainerId: string;
  title: string; // NOT "name" - use exact DB field name
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// RPC: anvil_update_program(programId, title, description)
export type UpdateProgramArgs = {
  programId: string;
  title?: string;
  description?: string | null;
};
export type UpdateProgramResult = null;
```

**Key Rules:**
- No `trainerId` in args unless RPC signature requires it
- Use exact DB field names: `title` not `name`, `trainerId` (camelCase), `createdAt`/`updatedAt`
- Match RPC signature exactly

## 4. Shared Components Guidelines

### `shared/ui/` - Primitives Only
- Basic building blocks: Button, Input, Card, Text, etc.
- No business logic
- No feature imports
- Theme-aware, reusable across all features

### `shared/components/` - Reusable Widgets
- Composite components that combine primitives
- Can have some logic (e.g., BottomSheetPicker, AppInput)
- **MUST NOT import from `src/features/*`**
- Can import from `shared/ui`, `shared/hooks`, `shared/api`
- Examples: AppErrorBoundary, KeyboardScreen, FullscreenState

### Feature Components
- Live in `src/features/{feature}/components/`
- Can import from shared, their own feature, and other features if needed
- Business logic specific to the feature

## 5. API Architecture

### Single Shared Base API
- **One base RTK Query API**: `src/shared/api/api.ts` uses `createApi()`
- **Feature endpoints**: Each feature injects endpoints via `api.injectEndpoints()`
- **No separate API instances**: All features share the same base API instance
- **Example structure:**
  ```typescript
  // src/shared/api/api.ts
  export const api = createApi({
    baseQuery: /* ... */,
    tagTypes: ['Auth', 'User', 'Profile', 'Program', 'Exercise', ...],
    endpoints: () => ({}),
  });
  
  // src/features/programBuilder/api/programBuilderApiSlice.ts
  export const programBuilderApiSlice = api.injectEndpoints({
    endpoints: (build) => ({
      // ...
    }),
  });
  ```

## 6. Implementation Notes

### Stub Routes
All new routes should be created as minimal stubs:
- Basic layout structure
- Placeholder text indicating the feature
- Route guards (auth/role checks)
- Navigation structure ready for implementation

### Stub Features
All new feature folders should include:
- Basic folder structure (api/, components/, hooks/, store/, types/)
- Empty or minimal stub files
- RPC contract type files with placeholder types matching exact RPC signatures
- RTK Query slice stubs with empty endpoints (injecting into shared base API)
- Redux slice stubs for UI state (only if needed for cross-screen state)

### Next Steps
After Chunk 1 implementation:
- Chunk 2: Store + API wiring + endpoint definitions only
- Chunk 3: Implement Program Builder UI
- Chunk 4: Implement Runner UI
- Chunk 5: Implement Assignment flow
- Chunk 6: Implement Exercises CRUD
