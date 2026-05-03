# Edge Functions

Currently one Edge Function is deployed.

---

## `anvil-create-client`

### Type
Edge Function (Deno).

### Purpose
Lets a trainer create a brand-new client by email and link them via `trainerClients`. If the auth user already exists, just upserts the link. Optionally generates a magic link for the new client.

### Inputs

POST JSON body:

```ts
{
  clientEmail: string;        // required, validated against /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  firstName?: string;
  lastName?: string;
  sendMagicLink?: boolean;    // default true
}
```

Headers:

- `Authorization: Bearer <user JWT>` (required).

### Output

```ts
{
  success: true,
  clientId: string,                  // auth.users.id
  trainerClientLink: {                // trainerClients row
    id, trainerId, clientId, status, createdAt
  },
  isNewUser: boolean,
  magicLinkSent: boolean
}
```

Error envelopes:

- `401 { error: "Missing Authorization header" | "Invalid authentication token" }`
- `403 { error: "Only trainers can create clients" }`
- `400 { error: "A valid clientEmail is required" }`
- `405 "Method Not Allowed"` (non-POST).
- `500 { error: "Internal Server Error", details: string }`.

### Tables Used
- `auth.users` (read + admin create).
- `users` (read `role`).
- `trainerClients` (upsert).

### RLS / Security Notes
- Uses `SUPABASE_SERVICE_ROLE_KEY` from the platform env (server-only). **Never** expose this key to the frontend.
- Validates the JWT via `supabaseAdmin.auth.getUser(jwt)`.
- Re-checks role from `public.users.role` (does **not** trust JWT claims).
- Only `role='trainer'` accounts can call this function successfully.
- `verify_jwt: true` is set on the deployed function (verified via `list_edge_functions`).

### Called From
- `features/linking/api/linkingApiSlice.ts` → `createClientByEmail` mutation, used by `CreateClientByEmailForm`.

### Error Cases
- Missing `Authorization` header (`401`).
- JWT invalid or expired (`401`).
- Caller is not a trainer (`403`).
- Invalid email (`400`).
- Email already exists in `auth.users` → returns existing `clientId` and upserts the link.
- Failure to create user / upsert link → propagated as `500` with details.

### Deploy

```bash
supabase functions deploy anvil-create-client --project-ref ekvwvxmpuwscqvfzlpek
```

The function code lives in `supabase/functions/anvil-create-client/index.ts`.

### Last Updated
2026-05-03 — initial documentation generated.
