---
name: anvil-edge-function
description: Create or modify a Supabase Edge Function for Anvil following the canonical JWT-validation + role-recheck pattern from `anvil-create-client`. Use when the user asks to add, edit, or deploy an Edge Function, or asks for "an admin endpoint", "a server-side action", or "service-role logic". Always uses the `plugin-supabase-supabase` MCP server.
---

# Anvil Edge Function

Generates a new Edge Function under `/supabase/functions/<name>/index.ts` following the project's canonical security pattern (validate JWT → re-check DB role → privileged action).

Use when the action genuinely needs service-role access (e.g., `auth.admin.createUser`, cross-user reads/writes that RLS can't express). For everything else, prefer a `SECURITY DEFINER` RPC.

## Pre-flight

Read these first:

- `/AGENTS.md` (Edge Function security rules)
- `/docs/supabase/edge-functions.md`
- `/docs/decisions/architecture-decisions.md` — **ADR-006** ("Edge Functions only for cross-user privileged writes"). Adding a new Edge Function should be justified against this ADR.
- `supabase/functions/anvil-create-client/index.ts` — the canonical pattern.
- `.cursor/rules/20-supabase-mcp.mdc`

If the use case isn't clearly cross-user / service-role, **stop and ask** the user whether an RPC would be sufficient.

## Inputs to gather first

1. **Name**: `kebab-case`, prefer `anvil-<verb>-<noun>` (e.g., `anvil-archive-program`).
2. **Method**: usually `POST`. State it explicitly.
3. **Body shape** (TypeScript type).
4. **Allowed caller role**: `trainer` / `client` / either / specific custom check.
5. **Tables it reads or writes** (and why service role is required vs an RPC).
6. **Success and error envelopes**.

## Steps

### 1. Author the function

Create `supabase/functions/<name>/index.ts` modeled on `anvil-create-client`. Skeleton:

```ts
// @ts-nocheck
/* eslint-disable import/no-unresolved */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
/* eslint-enable import/no-unresolved */

type Payload = {
  // …
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. JWT validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
    }
    const jwt = authHeader.slice("Bearer ".length).trim();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), { status: 401 });
    }

    // 2. Role re-check from DB (DO NOT trust JWT claims)
    const { data: callerRow, error: callerError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (callerError || callerRow?.role !== "<expected-role>") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // 3. Validate body
    const body = (await req.json()) as Payload;
    // … input validation, return 400 with { error } on bad input …

    // 4. Privileged action
    // … perform the action with supabaseAdmin …

    // 5. Success envelope
    return new Response(JSON.stringify({ success: true /* … */ }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
```

### 2. Mandatory checklist

- [ ] Reads `Authorization: Bearer <jwt>`; rejects `401` if missing.
- [ ] Validates JWT via `supabaseAdmin.auth.getUser(jwt)`; rejects `401` if invalid.
- [ ] Re-checks role from `public.users.role` against the DB; rejects `403` if not allowed.
- [ ] Validates body shape; rejects `400` on bad input.
- [ ] Returns JSON for success and for every error (except `405`).
- [ ] No secret leak in error details.
- [ ] No frontend-callable mutation in the function that could be done in a `SECURITY DEFINER` RPC instead.

### 3. Deploy

```bash
supabase functions deploy <name> --project-ref ekvwvxmpuwscqvfzlpek
```

Verify:

```
list_edge_functions
```

`verify_jwt` should be `true` for the new function.

### 4. Wire from the frontend

- Place the call in a feature `*.api.ts` or RTK Query slice. Never `fetch(...)` directly from a screen.
- Use `supabase.functions.invoke('<name>', { body })`. The user's JWT is attached automatically.
- Map errors to `ApiError` (`{ message: string }`).

### 5. Document — in the same change

- Add a section to `/docs/supabase/edge-functions.md` using the function template in `/AGENTS.md`. Required: Type, Purpose, Inputs, Output, Tables Used, RLS / Security Notes, Called From, Error Cases, Last Updated.
- Append to `/docs/decisions/changelog.md`.
- Write an ADR in `/docs/decisions/architecture-decisions.md` extending ADR-006 with the new function's justification.

### 6. Run advisors

```
get_advisors(type: "security")
```

Capture any new findings. Log to `technical-debt.md` if not fixed.

## What to NOT do

- Do not skip the role re-check from the DB. JWT claims (`user_metadata`) are user-editable and not trustworthy for authz.
- Do not return the service role key, internal errors with stack traces, or DB constraint names that leak internals.
- Do not turn off `verify_jwt` without an ADR.
- Do not put `SUPABASE_SERVICE_ROLE_KEY` anywhere near the frontend.

## Done definition

The function is deployed, `list_edge_functions` confirms `verify_jwt: true`, the doc and changelog are updated, and a frontend call site exists (or is explicitly deferred and documented).
