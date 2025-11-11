/*
  # Video Learning Platform Database Schema

  ## Overview
  Complete database structure for a video course platform with progress tracking,
  material downloads, and admin management capabilities.

  ## New Tables

  ### user_profiles
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text, nullable) - User full name
  - `is_admin` (boolean) - Admin flag
  - `created_at` (timestamptz) - Creation timestamp

  ### companies
  - `id` (uuid, primary key) - Company unique identifier
  - `name` (text) - Company name
  - `logo_url` (text, nullable) - Company logo URL
  - `created_at` (timestamptz) - Creation timestamp

  ### courses
  - `id` (uuid, primary key) - Course unique identifier
  - `company_id` (uuid, foreign key) - Associated company
  - `title` (text) - Course title
  - `description` (text, nullable) - Course description
  - `is_active` (boolean) - Course active status
  - `created_at` (timestamptz) - Creation timestamp

  ### modules
  - `id` (uuid, primary key) - Module unique identifier
  - `course_id` (uuid, foreign key) - Associated course
  - `title` (text) - Module title
  - `description` (text, nullable) - Module description
  - `order_index` (integer) - Module ordering
  - `created_at` (timestamptz) - Creation timestamp

  ### lessons
  - `id` (uuid, primary key) - Lesson unique identifier
  - `module_id` (uuid, foreign key) - Associated module
  - `title` (text) - Lesson title
  - `description` (text, nullable) - Lesson description
  - `video_url` (text) - Video URL (YouTube, Vimeo, or direct)
  - `order_index` (integer) - Lesson ordering within module
  - `duration_seconds` (integer, nullable) - Video duration
  - `created_at` (timestamptz) - Creation timestamp

  ### lesson_materials
  - `id` (uuid, primary key) - Material unique identifier
  - `lesson_id` (uuid, foreign key) - Associated lesson
  - `title` (text) - Material title
  - `file_url` (text) - File storage URL
  - `file_type` (text) - File type (pdf, zip, etc)
  - `file_size` (integer, nullable) - File size in bytes
  - `created_at` (timestamptz) - Creation timestamp

  ### user_progress
  - `id` (uuid, primary key) - Progress record identifier
  - `user_id` (uuid, foreign key) - User reference
  - `lesson_id` (uuid, foreign key) - Lesson reference
  - `completed` (boolean) - Completion status
  - `completed_at` (timestamptz, nullable) - Completion timestamp
  - `last_watched_at` (timestamptz) - Last watch timestamp

  ### user_course_enrollments
  - `id` (uuid, primary key) - Enrollment identifier
  - `user_id` (uuid, foreign key) - User reference
  - `course_id` (uuid, foreign key) - Course reference
  - `enrolled_at` (timestamptz) - Enrollment timestamp

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to view their enrolled courses
  - Policies for admins to manage all content
  - Policies for users to track their own progress
*/

-- Create user_profiles table FIRST
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create user_course_enrollments table
CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  order_index integer NOT NULL,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create lesson_materials table
CREATE TABLE IF NOT EXISTS lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  last_watched_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.is_admin = true
    )
  );

-- Policies for companies
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for courses
CREATE POLICY "Users can view enrolled courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_course_enrollments
        WHERE user_course_enrollments.course_id = courses.id
        AND user_course_enrollments.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
      )
    )
  );

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for user_course_enrollments
CREATE POLICY "Users can view own enrollments"
  ON user_course_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments"
  ON user_course_enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for modules
CREATE POLICY "Users can view modules of enrolled courses"
  ON modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE courses.id = modules.course_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage modules"
  ON modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for lessons
CREATE POLICY "Users can view lessons of enrolled courses"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON modules.course_id = courses.id
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE modules.id = lessons.module_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for lesson_materials
CREATE POLICY "Users can view materials of enrolled courses"
  ON lesson_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON lessons.module_id = modules.id
      JOIN courses ON modules.course_id = courses.id
      JOIN user_course_enrollments ON courses.id = user_course_enrollments.course_id
      WHERE lessons.id = lesson_materials.lesson_id
      AND user_course_enrollments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage materials"
  ON lesson_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON user_course_enrollments(course_id);