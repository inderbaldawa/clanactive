# Security Specification: The Kinetic Vault (ClanActive)

## Data Invariants
1. **User Identity**: Every user must have a profile. A user can only modify their own profile. PII (email) must be protected.
2. **Clan Membership**: Access to clan data is managed by memberships. A user must be a member to see members-only data (if any).
3. **Workout Integrity**: Workouts must belong to the authenticated user. Streats and totals are derived but updated by the client (for now), so rules must validate increments.
4. **Relational Consistency**: A membership cannot exist without a valid group ID. A workout must belong to a valid user.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (User)**: Create a user profile with `uid` of another user.
2. **Streak Hacking**: Update `currentStreak` with a massive number or non-increment value.
3. **PII Leak**: Read another user's profile and extract their `email`.
4. **Group Hijack**: Update a group's `createdBy` to take ownership.
5. **Ghost Membership**: Create a membership for a group that doesn't exist.
6. **Shadow Field Injection**: Update a workout with a `hiddenAdmin: true` field.
7. **ID Poisoning**: Create a group with a 1MB string as the `groupId`.
8. **Bypassing Verification**: Write data as a user with `email_verified: false`.
9. **Workout Forgery**: Create a workout for another user.
10. **Terminal State Break**: Modify a group after it's been "locked" (if applicable).
11. **Query Scraping**: List all workouts without filtering by `userId`.
12. **Relationship Orphan**: Delete a group but leave memberships intact (client-side risk, hard to fully block in rules but can restrict).

## Test Runner (Specification)
Tests will verify that:
- `create` and `update` fail without `isValid[Entity]` checks.
- `list` operations without proper filters are rejected.
- `isValidId()` is enforced on all paths.
- `affectedKeys().hasOnly()` prevents undocumented field updates.
