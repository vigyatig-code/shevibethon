/*
# Make complaints immutable — no one can modify or delete a filed complaint

## Purpose
The user requirement is that complaints cannot be changed by anyone once submitted.
This migration removes the UPDATE policy and revokes UPDATE/DELETE privileges
from both anon and authenticated roles, making complaints truly immutable.

## Changes
- DROP the existing UPDATE policy (`anon_update_complaints`) so RLS blocks all updates.
- REVOKE UPDATE and DELETE privileges from `anon` and `authenticated` roles.
- SELECT and INSERT policies remain unchanged (people can file and view complaints).
- DELETE was never allowed (no DELETE policy existed), but the privilege is now
  explicitly revoked for clarity.

## Security
- RLS remains enabled on `complaints`.
- SELECT: anon + authenticated can read (track complaints).
- INSERT: anon + authenticated can insert (file new complaints).
- UPDATE: BLOCKED for all roles (no policy + revoked privilege).
- DELETE: BLOCKED for all roles (no policy + revoked privilege).

## Notes
1. Complaints are now truly immutable from the application/frontend.
2. Status changes (e.g. Pending → Resolved) would require a server-side admin
   tool with the service role key, which bypasses RLS. This is intentional —
   only a trusted admin can change a complaint's status, never a public user.
3. This migration is safe to re-run (DROP POLICY IF EXISTS, REVOKE is idempotent).
*/

-- Drop the UPDATE policy so RLS blocks all updates
DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;

-- Explicitly revoke UPDATE and DELETE privileges from public-facing roles
REVOKE UPDATE ON complaints FROM anon, authenticated;
REVOKE DELETE ON complaints FROM anon, authenticated;