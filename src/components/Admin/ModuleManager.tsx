import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Module, Course } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    order_index: 0,
  });

  useEffect(() => {
    loadModules();
    loadCourses();
  }, []);

  const loadModules = async () => {
    const { data } = await supabase.from('modules').select('*').order('order_index');
    setModules(data || []);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').eq('is_active', true).order('title');
    setCourses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingModule) {
      await supabase
        .from('modules')
        .update({
          title: formData.title,
          description: formData.description || null,
          course_id: formData.course_id,
          order_index: formData.order_index,
        })
        .eq('id', editingModule.id);
    } else {
      await supabase.from('modules').insert({
        title: formData.title,
        description: formData.description || null,
        course_id: formData.course_id,
        order_index: formData.order_index,
      });
    }

    setFormData({ title: '', description: '', course_id: '', order_index: 0 });
    setShowForm(false);
    setEditingModule(null);
    loadModules();
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      course_id: module.course_id,
      order_index: module.order_index,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este módulo?')) {
      await supabase.from('modules').delete().eq('id', id);
      loadModules();
    }
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Curso não encontrado';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Módulos</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingModule(null);
            setFormData({ title: '', description: '', course_id: '', order_index: 0 });
          }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Novo Módulo
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Título do Módulo</label>
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
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ordem</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition"
              >
                {editingModule ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingModule(null);
                  setFormData({ title: '', description: '', course_id: '', order_index: 0 });
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
        {modules.map((module) => (
          <div key={module.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">
                  Módulo {module.order_index + 1} • {getCourseName(module.course_id)}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                {module.description && <p className="text-slate-400 text-sm">{module.description}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(module)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(module.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
