# API Layer

All Supabase access in Anvil goes through one of three patterns. Pick the right one for your case and never bypass them.

## 1. The shared Supabase client

```ts
// shared/supabase/client.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
```

- One singleton. **Never instantiate another.**
- `detectSessionInUrl: false` because we handle auth deep links ourselves in `useAuthBootstrap`.
- `processLock` ensures concurrent JWT refreshes don't stomp each other.

## 2. Direct REST + RPC via `*.api.ts`

For one-shot reads/writes or screen-local queries, write a plain async function:

```ts
// features/workouts/api/clientWorkouts.api.ts
export async function listClientProgramAssignments(params: { clientId: string }) {
  const res = await supabase.rpc("get_my_program_assignments");
  if (res.error) throw res.error;
  // …mapping…
}
```

Convention:

- Filename ends in `.api.ts`.
- Functions are **named exports** (no default export).
- Always **map snake_case DB rows to camelCase domain types** at the boundary. The DB has both casings; we standardize on camelCase in TS.
- Throw on error from these functions; the calling hook catches and shows toast.

## 3. RTK Query slices via `*ApiSlice.ts`

For long-lived, cacheable, cross-screen data, inject endpoints into the shared `api`:

```ts
// features/profile/api/profileApiSlice.ts
export const profileApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getMyUserRow: build.query<UserRow, string>({
      async queryFn(userId) { /* ... */ },
      providesTags: (_r, _e, userId) => [{ type: "User", id: userId }],
    }),
  }),
});
export const { useGetMyUserRowQuery } = profileApiSlice;
```

Choose this when:

- Multiple screens read the same data.
- Mutations need to invalidate cache so other screens refresh.
- You want loading/error/refetch ergonomics for free.

See `state-management.md` for the tag map.

---

## Calling Postgres functions (RPCs)

The backend exposes many `SECURITY DEFINER` RPCs. Always prefer an RPC when one exists for your action — they enforce trainer-link checks and audit fields.

```ts
const { data, error } = await supabase.rpc("anvil_assign_program_to_client", {
  p_client_id: clientId,
  p_program_template_id: templateId,
  p_start_date: startDate,
  p_notes: notes ?? null,
});
```

For a full RPC catalog with signatures + security model, see [`/docs/supabase/rpc-functions.md`](../supabase/rpc-functions.md).

## Calling Edge Functions

```ts
const sessionRes = await supabase.auth.getSession();
const accessToken = sessionRes.data?.session?.access_token;

const { data, error } = await supabase.functions.invoke("anvil-create-client", {
  body: payload,
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

The `anvil-create-client` Edge Function is the canonical example: it requires `verify_jwt: true`, validates the caller, then uses the service role key server-side. See [`/docs/supabase/edge-functions.md`](../supabase/edge-functions.md).

---

## Storage uploads

Use the helpers in `/shared/media/imageUpload.ts` and `/shared/media/useSupabaseImageUpload.ts` (referenced by Profile and Library features). They:

1. Pick an image with `expo-image-picker`.
2. Center-crop to square, resize to ≤ 1024px, and compress to fit the platform's max bytes (1 MB native, 500 KB web).
3. Upload to the right bucket under `{auth.uid()}/…` (RLS requires the first folder segment to be the user's UUID).

Available buckets:

| Bucket    | Public | Use                                                                |
| --------- | ------ | ------------------------------------------------------------------ |
| `avatars` | yes    | User avatars (clients + trainers).                                 |
| `logos`   | yes    | Trainer brand logos.                                               |
| `exercises` | yes  | Exercise images / videos.                                          |
| `pdfs`    | no     | Reserved for private documents (no current frontend usage).        |

> Storage policies are documented in [`/docs/supabase/storage.md`](../supabase/storage.md).

---

## Error handling

- All `*.api.ts` functions throw on Supabase error.
- Hooks catch and convert to a friendly message (often via i18n).
- UI surfaces errors with `appToast.error(message)` or inline.
- For destructive actions, show `useAppAlert().confirm({ title, message, danger: true })` first.
- Never silently swallow errors. If you intentionally ignore one, leave a comment explaining why (see `useAuthBootstrap` URL handling).

## Mapping conventions

Many Supabase tables use **lowercase** column names (`clientid`, `trainerid`, `scheduledfor`) while a few use **camelCase** with quoted identifiers (`"trainerId"`, `"ownerTrainerId"`, `"createdAt"`). The mismatch is historical.

Rules:

- In TypeScript, **always use camelCase**: `clientId`, `trainerId`, `scheduledFor`.
- Mapping happens in `*.api.ts` functions (`toClientWorkoutAssignment`, `normalizeTrainerProfile`, etc.).
- When writing back, send the column names as the DB expects them (`clientid` vs `"trainerId"`).
- `/docs/supabase/tables.md` lists the actual DB casing per column. **Read it before composing queries.**

## Performance

- Prefer the dedicated RPCs (`get_my_workout_schedule`, `get_my_program_assignments`, `get_trainer_requests_inbox`) over raw `select` for client-facing reads — they enforce RLS via `SECURITY DEFINER` and avoid re-evaluating `auth.uid()` per row.
- For trainer reads (`getTrainerClients`), batch related lookups (users, profiles, management) with `Promise.all` and merge in memory rather than chaining many sequential awaits.
- Use indexed columns: see `/docs/supabase/tables.md` for the index per table.
- Always supply date ranges to schedule queries (`p_from`, `p_to`) so the planner can use `idx_client_workout_assignments_client_scheduledfor`.
