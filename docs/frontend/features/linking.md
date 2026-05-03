# Linking (Trainer ↔ Client)

## Status

Implemented.

## Purpose

Establishes the link between a trainer and a client. The link is the spine of every authorization decision (RLS uses `trainerClients.status = 'active'`).

There are four entry paths into a link:

1. **Trainer creates a client by email** (Edge Function `anvil-create-client`).
2. **Trainer issues an invite code** → client redeems it.
3. **Client searches for a trainer's email** and sends a request → trainer accepts/declines from inbox.
4. **Client redeems an invite code** they were given out-of-band.

## User Flow

### Trainer side
- `/(trainer)/add-client` → tab switch between:
  - **By email** — `CreateClientByEmailForm` calls Edge Function `anvil-create-client`.
  - **Invite code** — `InviteCodeSection` shows current open invites, generates a new one (`anvil_create_trainer_invite`).
  - **Requests inbox** — `RequestsInboxList` lists pending `trainerRequests` (`get_trainer_requests_inbox`). Trainer can accept (`anvil_accept_trainer_request`) or decline (`anvil_decline_trainer_request`).

### Client side
- `/(client)/find-trainer` — submit a request via `anvil_create_trainer_request(p_trainer_email, p_message)`.
- `/(client)/link-trainer` — alternate redeeming an invite code (`anvil_redeem_invite_code(p_code)`), which atomically inserts/activates the `trainerClients` row.
- `/(client)/(tabs)/coach` — `ClientCoachScreen` shows the linked coach if any (`useClientCoach`), or `ClientCoachNotLinked` with CTAs to find or link.

### Cancel/Disconnect
- Client can cancel an active link via `anvil_client_cancel_trainer(p_trainer_id)`.
- Client can pause / resume via `anvil_client_set_relationship_status(p_trainer_id, p_status, p_pause_reason)`.
- Trainer can archive / re-activate / delete-archived via the trainer-side detail screen.

## Main Files

- API: `features/linking/api/linkingApiSlice.ts` (RTK Query endpoints).
- Hooks:
  - `features/linking/hooks/find-trainer/useFindTrainer.ts`
  - `features/linking/hooks/link-trainer/useLinkTrainer.ts`
  - `features/linking/hooks/trainer-add-client/useTrainerAddClient.ts`
  - `features/linking/hooks/client-coach/useClientCoach.ts`
- Screens:
  - `features/linking/screens/FindTrainerScreen.tsx`
  - `features/linking/screens/LinkTrainerScreen.tsx`
  - `features/linking/screens/TrainerAddClientScreen.tsx`
  - `features/linking/screens/ClientCoachScreen.tsx`
- Components:
  - `features/linking/components/find-trainer/*` (form, requests list, redeem code, scanner)
  - `features/linking/components/link-trainer/*`
  - `features/linking/components/trainer-add-client/*` (`CreateClientByEmailForm`, `InviteCodeSection`, `RequestsInboxList`, tab switch)
  - `features/linking/components/client-coach/*` (coach card, certs card, avatar, "not linked" state)
- Routes:
  - `app/(client)/find-trainer.tsx`, `app/(client)/link-trainer.tsx`, `app/(client)/(tabs)/coach.tsx`
  - `app/(trainer)/add-client.tsx`
- Types: `features/linking/types/linking.ts`
- Utils: `features/linking/utils/coachFormatting.ts`, `features/linking/utils/linkingErrors.ts`

## Components

- `CreateClientByEmailForm` — calls Edge Function and surfaces success/failure toasts.
- `InviteCodeSection` — generates / lists / revokes invites.
- `RequestsInboxList` — accept/decline pending requests.
- `RedeemCodeForm`, `RedeemCodeScanner` — text input + (optional) camera-based code scan.
- `RequestTrainerForm` — email + message form.
- `RequestTrainerRequestsList` — shows the client's outgoing requests with their status.
- `ClientCoachCard`, `ClientCoachCertsCard`, `CoachAvatar`, `ClientCoachNotLinked`.

## Hooks

- `useFindTrainer()` — find/request trainer by email; handles requests list state.
- `useLinkTrainer()` — submits invite code; deals with errors (expired/invalid/used).
- `useTrainerAddClient()` — owns the trainer-side tabs (email / invite / inbox) and their actions.
- `useClientCoach()` — fetches the linked coach for the client tab.

## State Management

- All endpoints in `linkingApiSlice.ts` use the shared RTK Query `api` instance with tags:
  - `TrainerClients` (and friends).
  - `TrainerInvites`.
  - `TrainerRequests`.
  - `Coach` (used by client-side coach tab).
- Mutations invalidate matching tags so lists refresh automatically.

## API / Supabase Dependencies

### Tables
- `trainerClients` — link table with `status link_status` (`active`/`archived`).
- `trainerClientManagement` — created lazily by `anvil_ensure_management_row` trigger when a `trainerClients` row is inserted.
- `trainerInvites` — invite codes; unique on `code`.
- `trainerRequests` — requests from a client to a trainer email.

### RPCs
- `anvil_create_trainer_invite(p_target_email, p_expires_at)`.
- `anvil_redeem_invite_code(p_code)`.
- `anvil_create_trainer_request(p_trainer_email, p_message)`.
- `anvil_accept_trainer_request(p_request_id)`.
- `anvil_decline_trainer_request(p_request_id)`.
- `anvil_cancel_trainer_request(p_request_id)`.
- `get_trainer_requests_inbox(p_trainer_email)`.
- `anvil_set_trainer_client_status(p_client_id, p_status)`.
- `anvil_client_cancel_trainer(p_trainer_id)`.
- `anvil_client_set_relationship_status(p_trainer_id, p_status, p_pause_reason)`.
- `anvil_delete_archived_client_link(p_client_id)`.

### Edge Functions
- `anvil-create-client` (POST) — creates an auth user (or finds existing) and links them via `trainerClients.upsert`. Validates JWT + role server-side (only `trainer` users can call).

### Storage
- `avatars`, `logos` (used indirectly when displaying the coach).

## Validation Rules

- Email fields: required, normalized to lowercase, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$/i`.
- Invite code: required (server validates length/format / expiry).
- Request message: optional, trimmed.
- The Edge Function rejects non-trainer callers (`role !== 'trainer'`).

## UI / UX Rules

- Tab switches use `LinkTrainerTabSwitch` / `TrainerAddClientTabSwitch` (segmented controls).
- Actions show toasts on success/failure via `appToast`.
- Confirmations (cancel link, decline request) go through `useAppAlert`.
- Use brand-aware accent for the client's "Coach" tab.

## iOS + Android Notes

- Camera-based code scanner uses `expo-camera` — request permission just-in-time.
- Deep link ingress not yet wired for invite codes (i.e. `anvil://invite?code=…` is **Needs verification**).

## SOLID / Architecture Notes

- API endpoints split per use case in `linkingApiSlice.ts` to keep them small.
- Each component file owns one form/list.
- Errors are normalized via `linkingErrors.ts` so screens just render strings.

## Performance Notes

- Inbox endpoint uses `keepUnusedDataFor: 0` so it stays fresh when the trainer pulls down to refresh after accepting elsewhere.
- Other lists rely on tag invalidation.

## Known Issues

- Camera scanner not yet hooked up to a route — `RedeemCodeScanner` exists but flow is incomplete (**Needs verification**).
- Deep link for invite codes — not implemented yet.
- Bulk invite revoke is missing.
- Unique-on-pair for `trainerClients` has duplicate indexes (`trainer_clients_trainer_id_client_id_key` and `trainerclients_trainerid_clientid_key`). Drop one — tracked in tech debt.

## Last Updated

2026-05-03 — initial documentation generated.
