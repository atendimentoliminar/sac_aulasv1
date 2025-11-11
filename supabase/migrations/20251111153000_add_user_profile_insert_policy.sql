/*
  # Allow users to create their profile

  Ensures newly autenticados via OAuth consigam criar automaticamente
  o registro correspondente em `user_profiles`.
*/

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

