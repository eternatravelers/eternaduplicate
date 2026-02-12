/*
  # Cleanup Orphaned Invitations

  1. Purpose
    - Remove invitation records where the user has been deleted
    - Allow these emails to be invited again

  2. Changes
    - Delete invitations with used_at set but no corresponding user in auth.users
    - This enables re-inviting previously deleted users

  3. Safety
    - Only affects invitations where the user no longer exists
    - Does not affect active user invitations
*/

-- Delete invitations where used_at is set but the user no longer exists
DELETE FROM invitations
WHERE used_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.email = invitations.email
  );
