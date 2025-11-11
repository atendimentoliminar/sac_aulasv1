import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Course, Company } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_id: '',
    is_active: true,
  });

  useEffect(() => {
    loadCourses();
    loadCompanies();
  }, []);

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });
    setCourses(data || []);
  };

  const loadCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('name');
    setCompanies(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourse) {
      await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description || null,
          company_id: formData.company_id || null,
          is_active: formData.is_active,
        })
        .eq('id', editingCourse.id);
    } else {
      await supabase.from('courses').insert({
        title: formData.title,
        description: formData.description || null,
        company_id: formData.company_id || null,
        is_active: formData.is_active,
      });
    }

    setFormData({ title: '', description: '', company_id: '', is_active: true });
    setShowForm(false);
    setEditingCourse(null);
    loadCourses();
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      company_id: course.company_id || '',
      is_active: course.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      await supabase.from('courses').delete().eq('id', id);
      loadCourses();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Cursos</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCourse(null);
            setFormData({ title: '', description: '', company_id: '', is_active: true });
          }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Novo Curso
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingCourse ? 'Editar Curso' : 'Novo Curso'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Título do Curso</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Empresa</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm text-slate-300">
                Curso ativo
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition"
              >
                {editingCourse ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                  setFormData({ title: '', description: '', company_id: '', is_active: true });
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            {course.company?.logo_url && (
              <img src={course.company.logo_url} alt={course.company.name} className="h-10 mb-3 object-contain" />
            )}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex-1">{course.title}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  course.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {course.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {course.description && <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(course)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(course.id)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
