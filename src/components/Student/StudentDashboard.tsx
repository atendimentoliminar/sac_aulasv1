import { useState } from 'react';
import { CourseList } from './CourseList';
import { LessonViewer } from './LessonViewer';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function StudentDashboard() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (selectedCourseId) {
    return (
      <LessonViewer
        courseId={selectedCourseId}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
      <CourseList onSelectCourse={setSelectedCourseId} />
    </div>
  );
}
