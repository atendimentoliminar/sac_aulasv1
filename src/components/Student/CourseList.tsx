import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Course } from '../../types';
import { BookOpen, Clock } from 'lucide-react';

interface CourseListProps {
  onSelectCourse: (courseId: string) => void;
}

export function CourseList({ onSelectCourse }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: enrollments } = await supabase
        .from('user_course_enrollments')
        .select('course_id');

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map((e) => e.course_id);
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*, company:companies(*)')
          .in('id', courseIds)
          .eq('is_active', true);

        setCourses(coursesData || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando cursos...</div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Nenhum curso disponível</h2>
          <p className="text-slate-400">Entre em contato com o administrador para ter acesso aos cursos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Meus Cursos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-orange-500 transition cursor-pointer group"
            >
              <div className="p-6">
                {course.company?.logo_url && (
                  <img
                    src={course.company.logo_url}
                    alt={course.company.name}
                    className="h-12 mb-4 object-contain"
                  />
                )}

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                  {course.title}
                </h3>

                {course.description && (
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center text-slate-500 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Continue assistindo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
