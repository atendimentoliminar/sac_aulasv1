/*
  # Fix user_profiles RLS to allow initial is_admin check
  
  The current "Admins can view all profiles" policy has a circular dependency:
  - It checks if user.is_admin = true
  - But to check is_admin, we need to read the profile
  - This creates a deadlock
  
  Solution: Remove the problematic policy and keep only the user own profile policies.
  This allows users to always read their own profile to check their is_admin status.
*/

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
