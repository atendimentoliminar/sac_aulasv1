import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Course, UserProfile } from '../../types';
import { Plus, Trash2, UserCheck } from 'lucide-react';

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  user_profiles?: UserProfile;
}

export function EnrollmentManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    course_id: '',
  });

  useEffect(() => {
    loadEnrollments();
    loadCourses();
    loadUsers();
  }, []);

  const loadEnrollments = async () => {
    const { data } = await supabase
      .from('user_course_enrollments')
      .select('*, user_profiles(*)')
      .order('enrolled_at', { ascending: false });
    setEnrollments(data || []);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').eq('is_active', true).order('title');
    setCourses(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase.from('user_profiles').select('*').order('full_name');
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('user_course_enrollments').insert({
      user_id: formData.user_id,
      course_id: formData.course_id,
    });

    if (error) {
      alert('Erro ao matricular usuário: ' + error.message);
      return;
    }

    setFormData({ user_id: '', course_id: '' });
    setShowForm(false);
    loadEnrollments();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta matrícula?')) {
      await supabase.from('user_course_enrollments').delete().eq('id', id);
      loadEnrollments();
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Curso não encontrado';
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.full_name || 'Usuário não encontrado';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Matrículas</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ user_id: '', course_id: '' });
          }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nova Matrícula
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">Nova Matrícula</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Usuário</label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || 'Sem nome'} {user.is_admin ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Curso</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              >
                <option value="">Selecione um curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition"
              >
                Matricular
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ user_id: '', course_id: '' });
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {enrollments.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma matrícula encontrada</p>
          </div>
        ) : (
          enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-semibold">
                    {enrollment.user_profiles?.full_name || 'Usuário sem nome'}
                  </div>
                  <div className="text-slate-400 text-sm">
                    Curso: {getCourseName(enrollment.course_id)}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Matriculado em: {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(enrollment.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Todos os Usuários</h3>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="bg-slate-900 rounded p-3">
              <div className="text-white font-medium">{user.full_name || 'Sem nome'}</div>
              <div className="text-slate-400 text-sm">
                {user.is_admin ? 'Administrador' : 'Estudante'} • ID: {user.id.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
