/*
  # Improve admin authorization policies

  - Introduce helper function `public.is_admin_user()` to check admin flag without RLS recursion
  - Update existing policies to rely on the helper function
  - Allow admins to manage all user profiles
*/

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_flag boolean;
BEGIN
  SELECT is_admin
    INTO is_admin_flag
  FROM user_profiles
  WHERE id = auth.uid();

  RETURN COALESCE(is_admin_flag, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

ALTER POLICY "Admins can manage companies"
  ON companies
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view enrolled courses"
  ON courses
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_course_enrollments
        WHERE user_course_enrollments.course_id = courses.id
        AND user_course_enrollments.user_id = auth.uid()
      )
      OR public.is_admin_user()
    )
  );

ALTER POLICY "Admins can manage courses"
  ON courses
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view modules of enrolled courses"
  ON modules
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE courses.id = modules.course_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

ALTER POLICY "Admins can manage modules"
  ON modules
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view lessons of enrolled courses"
  ON lessons
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON modules.course_id = courses.id
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE modules.id = lessons.module_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

ALTER POLICY "Admins can manage lessons"
  ON lessons
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view materials of enrolled courses"
  ON lesson_materials
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON lessons.module_id = modules.id
      JOIN courses ON modules.course_id = courses.id
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE lessons.id = lesson_materials.lesson_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR public.is_admin_user()
  );

ALTER POLICY "Admins can manage materials"
  ON lesson_materials
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view own enrollments"
  ON user_course_enrollments
  USING (auth.uid() = user_id OR public.is_admin_user());

ALTER POLICY "Admins can manage enrollments"
  ON user_course_enrollments
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

ALTER POLICY "Users can view own progress"
  ON user_progress
  USING (auth.uid() = user_id OR public.is_admin_user());

ALTER POLICY "Admins can view all progress"
  ON user_progress
  USING (public.is_admin_user());

CREATE POLICY "Admins can manage profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

