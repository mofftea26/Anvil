# State Management

Anvil uses **Redux Toolkit 2** + **RTK Query** as the single source of truth for shared state and server cache. Local UI state stays in components.

## Store wiring

```ts
// store/store.ts
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
```

```ts
// store/rootReducer.ts
export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth:    authReducer,
  profile: profileReducer,
});
```

The `<Provider />` wraps the entire app at `app/_layout.tsx`.

## Slices

### `auth` (`features/auth/store/authSlice.ts`)

Tracks the auth lifecycle. Updated only by `useAuthBootstrap` and the auth API slice.

```ts
type AuthState = {
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  userId: string | null;
  accessToken: string | null;
  role: "trainer" | "client" | null;
  errorMessage: string | null;
};
```

Reducers: `setLoading`, `setUnauthenticated`, `setAuthenticated`, `setRole`, `setError`, `resetAuth`.

### `profile` (`features/profile/store/profileSlice.ts`)

Holds the current user's `users` row, plus `clientProfile` or `trainerProfile` (whichever applies). Kept in sync by `useMyProfile()`. Lets the UI read profile data synchronously without re-querying RTK Query in every component.

> Reducer surface and exact field names: see the file. Update this section if the slice changes.

## RTK Query — single shared API

```ts
// shared/api/api.ts
export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: [
    "User", "Profile", "Auth",
    "TrainerClients", "TrainerInvites", "TrainerRequests",
    "Coach",
  ],
  endpoints: () => ({}),
});
```

Feature folders **inject** endpoints into this single instance — they never create a second `createApi`. This keeps tag invalidation coherent and the cache deduplicated.

Pattern:

```ts
// features/<feature>/api/<feature>ApiSlice.ts
export const myFeatureApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getThing: build.query<Thing, { id: string }>({
      async queryFn({ id }) {
        const { data, error } = await supabase.from("things").select("*").eq("id", id).single();
        if (error) return { error: { message: error.message } };
        return { data: data as Thing };
      },
      providesTags: (_r, _e, arg) => [{ type: "Thing", id: arg.id }],
    }),
  }),
});
export const { useGetThingQuery } = myFeatureApiSlice;
```

### Why `fakeBaseQuery`?

Because the actual transport is `supabase-js` (not raw `fetch`). Each endpoint implements its own `queryFn` that returns `{ data }` or `{ error: { message } }`.

### Tag map

| Tag             | Used by                                                         | Invalidated by                                                                                              |
| --------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `User`          | `getMyUserRow(userId)`, `getUserRole(userId)`                   | `updateMyUserRow`                                                                                           |
| `Profile`       | `getClientProfile`, `getTrainerProfile`                         | `updateMyUserRow`, `upsertClientProfile`, `upsertTrainerProfile`                                            |
| `Auth`          | (reserved by auth slice)                                        | All auth mutations (`signIn*`, `signUp`, `signOut`, `updatePassword`, `sendPasswordReset`)                  |
| `TrainerClients`| `getTrainerClients`                                             | `setTrainerClientStatus`, `upsertTrainerClientManagement`, `markClientCheckIn`, `deleteArchivedClientLink`, `acceptTrainerRequest`, `declineTrainerRequest`, `createClientByEmail` |
| `TrainerInvites`| `getTrainerInvites`                                             | `createTrainerInvite`                                                                                       |
| `TrainerRequests` (with `id: "inbox"` for trainer view, or per `clientId` for client view) | `getClientRequests`, `getTrainerRequestsInbox` | `createTrainerRequest`, `cancelTrainerRequest`, `acceptTrainerRequest`, `declineTrainerRequest`               |
| `Coach`         | `getMyCoach(clientId)`                                          | All linking mutations + `setTrainerClientStatus`                                                            |

When you add a new endpoint or mutation, **always** wire its tags into both `providesTags` and `invalidatesTags`. Forgetting this causes stale UI.

## When NOT to use RTK Query

Use plain async functions (`*.api.ts`) and a feature hook when:

- The data is **screen-local** (e.g. the schedule for a single day in the runner).
- The query has **dynamic SQL composition** that doesn't fit a stable cache key (long lists with many filters).
- You need **manual control** of refetch timing (pull-to-refresh, long-poll, etc.).

Examples in this codebase:

- `features/workouts/api/clientWorkouts.api.ts`
- `features/clients/api/assignments.api.ts`
- `features/library/api/programTemplates.api.ts`

These functions still use the shared `supabase` client. They are consumed by feature hooks (`features/workouts/hooks/useClientProgramAssignments.ts`, etc.) that own loading/error state.

## Local UI state

Use `useState` / `useReducer`. Do not put per-screen state in Redux unless it must be shared across screens.

## Persistence

- **Supabase session** is persisted by `@supabase/supabase-js` itself, using `AsyncStorage` (configured in `shared/supabase/client.ts`). The `processLock` helper prevents concurrent token refreshes.
- **Schedule time overrides** (workaround for missing `scheduledtime` column on older deployments) are persisted to `AsyncStorage` via `shared/utils/scheduleTimeOverrides.ts`.
- **Redux store itself is not persisted.** On cold start, `useAuthBootstrap` rehydrates `auth` and `useMyProfile` rehydrates `profile`.
