# Frontend Features

Per-feature documentation. One file per feature — including unimplemented placeholders, so the gap is visible.

## Doc → folder mapping

The on-disk feature folders don't always map 1:1 to feature docs. Some docs cover sub-features.

| Doc | Code folder(s) | Status | Notes |
| --- | --- | --- | --- |
| [auth](./auth.md) | `features/auth/` | Implemented | Email/password + magic link via Supabase Auth |
| [onboarding](./onboarding.md) | `features/onboarding/` | Implemented | Profile then role selection |
| [trainer-dashboard](./trainer-dashboard.md) | `features/dashboard/` (trainer screens) | Implemented | `NoProgramCard` + `CheckInsCard`; stat row is Active + Check-ins today; full-width Add client |
| [client-dashboard](./client-dashboard.md) | `features/dashboard/` (client screens) | Implemented | Fixed, non-scrolling daily/weekly snapshot dashboard |
| [clients](./clients.md) | `features/clients/` | Implemented | Trainer client list, details, assignments tab |
| [linking](./linking.md) | `features/linking/` | Implemented | Trainer ↔ client linking, invites, requests |
| [programs](./programs.md) | `features/library/` (program templates) | Implemented | Program template builder + assignment |
| [exercise-library](./exercise-library.md) | `features/library/` (exercises) | Implemented | List, edit, picker for builder |
| [builder](./builder.md) | `features/builder/` | Implemented | Workout builder + exercise picker / detail |
| [workouts](./workouts.md) | `features/workouts/` (schedule + assignment) | Partially implemented | Schedule + assignment details |
| [workout-runner](./workout-runner.md) | `features/workouts/` (runner screen) | Partially implemented | Screen exists, persistence WIP |
| [profile](./profile.md) | `features/profile/` | Implemented | Trainer + client profile editing |
| [checkins](./checkins.md) | `features/checkins/` | Implemented | Trainer check-in timeline (`clientCheckIns` + RPCs); uses `TimelineBoard` |
| [assignments](./assignments.md) | `features/assignments/` | Implemented | Cross-feature read helpers (no own screens) |
| [settings](./settings.md) | *(not implemented)* | Not implemented | Placeholder |
| [notifications](./notifications.md) | *(not implemented)* | Not implemented | Placeholder |

Each file follows the template in [`.cursor/rules/30-feature-docs.mdc`](../../../.cursor/rules/30-feature-docs.mdc) (also reproduced in [`/AGENTS.md`](../../../AGENTS.md)). Update `Last Updated` whenever you touch the feature.

When adding a new feature, follow [`/docs/frontend/how-to-add-a-feature.md`](../how-to-add-a-feature.md).
