export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  company?: Company;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string;
  order_index: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface LessonMaterial {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}
