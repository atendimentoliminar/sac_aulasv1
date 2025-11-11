import { useState } from 'react';
import { CompanyManager } from './CompanyManager';
import { CourseManager } from './CourseManager';
import { ModuleManager } from './ModuleManager';
import { LessonManager } from './LessonManager';
import { EnrollmentManager } from './EnrollmentManager';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, BookOpen, FolderTree, PlaySquare, Users, LogOut } from 'lucide-react';

type AdminView = 'companies' | 'courses' | 'modules' | 'lessons' | 'enrollments';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<AdminView>('companies');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { id: 'companies' as AdminView, label: 'Empresas', icon: Building2 },
    { id: 'courses' as AdminView, label: 'Cursos', icon: BookOpen },
    { id: 'modules' as AdminView, label: 'Módulos', icon: FolderTree },
    { id: 'lessons' as AdminView, label: 'Aulas', icon: PlaySquare },
    { id: 'enrollments' as AdminView, label: 'Matrículas', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Gerenciamento de Conteúdo</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentView === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'companies' && <CompanyManager />}
          {currentView === 'courses' && <CourseManager />}
          {currentView === 'modules' && <ModuleManager />}
          {currentView === 'lessons' && <LessonManager />}
          {currentView === 'enrollments' && <EnrollmentManager />}
        </div>
      </div>
    </div>
  );
}
