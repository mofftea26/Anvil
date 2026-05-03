# Storage

## Buckets

| Bucket | Public | Notes |
| --- | --- | --- |
| `avatars` | yes | User-uploaded profile pictures. Folder = `auth.uid()`. |
| `exercises` | yes | Exercise images uploaded by trainers. Folder convention = `<exerciseId>` or `<auth.uid()>` (**Needs verification**). |
| `logos` | yes | Trainer brand logos. Folder = `auth.uid()`. |
| `pdfs` | no | Future: PDF reports / handouts. No RLS policies currently configured (no public read), so it is effectively unreadable until policies are added. |

## RLS policies on `storage.objects`

Verified via `pg_policies` (May 2026):

### `avatars`

| Policy | CMD | USING | WITH CHECK |
| --- | --- | --- | --- |
| `avatars_read` | SELECT | `bucket_id = 'avatars'` | — |
| `avatars_insert_own` | INSERT | — | `bucket_id='avatars' AND foldername(name)[1] = auth.uid()::text` |
| `avatars_update_own` | UPDATE | same as insert | same |
| `avatars_delete_own` | DELETE | same | — |

### `logos`

Same pattern as `avatars` (`logos_read`, `logos_insert_own`, `logos_update_own`, `logos_delete_own`).

### `exercises`

No policies are currently configured for the `exercises` bucket in `storage.objects` (verified via `pg_policies`). Because the bucket is `public`, files at known paths are still readable via the CDN, but uploads/updates/deletes by authenticated users will fail until policies are added. **Needs verification** — if exercise images are not actually uploadable today, add policies before the next release.

### `pdfs`

No policies. The bucket is private and effectively inaccessible from the client. Add owner-write + recipient-read policies when this feature ships.

## Frontend usage

- `shared/media/imageUpload.ts` — `pickAndPrepareSquareImage` (uses `expo-image-picker` + `expo-image-manipulator` to resize/compress).
- `shared/media/useSupabaseImageUpload.ts` — uploads a prepared image to a bucket and returns the public URL.
- `shared/ui/components/ImagePickerField.tsx` — wraps the picker + uploader in a single field used by profile editors.

Convention for paths:

- Avatars: `<auth.uid()>/avatar.jpg`.
- Logos: `<auth.uid()>/logo.jpg`.
- Exercises: **Needs verification**.

## Public URL strategy

Public buckets serve files at:

```
https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
```

Anonymous users can list `avatars` and `logos` (broad SELECT policy) — flagged by `public_bucket_allows_listing`. If listing is undesirable, change the SELECT policy to require knowing the path, e.g. `(bucket_id='avatars' AND name = current_setting('request.path', true))` or a more conservative model. Tracked in tech debt.

## Quotas & limits

Supabase Storage default per-file limit: 50 MB (configurable). Anvil never uploads anything close to that — images are compressed to ~200KB. PDFs (when added) should be capped at a sensible size in the upload UI.

## Last Updated

2026-05-03 — initial documentation generated.
