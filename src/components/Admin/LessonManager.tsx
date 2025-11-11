import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lesson, Module, LessonMaterial } from '../../types';
import { Plus, Edit2, Trash2, FileUp, X } from 'lucide-react';

export function LessonManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [showMaterialsFor, setShowMaterialsFor] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    module_id: '',
    order_index: 0,
    duration_seconds: 0,
  });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    file_url: '',
    file_type: '',
  });

  useEffect(() => {
    loadLessons();
    loadModules();
  }, []);

  const loadLessons = async () => {
    const { data } = await supabase.from('lessons').select('*').order('order_index');
    setLessons(data || []);
  };

  const loadModules = async () => {
    const { data } = await supabase.from('modules').select('*').order('order_index');
    setModules(data || []);
  };

  const loadMaterials = async (lessonId: string) => {
    const { data } = await supabase.from('lesson_materials').select('*').eq('lesson_id', lessonId);
    setMaterials(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLesson) {
      await supabase
        .from('lessons')
        .update({
          title: formData.title,
          description: formData.description || null,
          video_url: formData.video_url,
          module_id: formData.module_id,
          order_index: formData.order_index,
          duration_seconds: formData.duration_seconds || null,
        })
        .eq('id', editingLesson.id);
    } else {
      await supabase.from('lessons').insert({
        title: formData.title,
        description: formData.description || null,
        video_url: formData.video_url,
        module_id: formData.module_id,
        order_index: formData.order_index,
        duration_seconds: formData.duration_seconds || null,
      });
    }

    setFormData({ title: '', description: '', video_url: '', module_id: '', order_index: 0, duration_seconds: 0 });
    setShowForm(false);
    setEditingLesson(null);
    loadLessons();
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url,
      module_id: lesson.module_id,
      order_index: lesson.order_index,
      duration_seconds: lesson.duration_seconds || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta aula?')) {
      await supabase.from('lessons').delete().eq('id', id);
      loadLessons();
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMaterialsFor) return;

    await supabase.from('lesson_materials').insert({
      lesson_id: showMaterialsFor,
      title: materialForm.title,
      file_url: materialForm.file_url,
      file_type: materialForm.file_type,
    });

    setMaterialForm({ title: '', file_url: '', file_type: '' });
    loadMaterials(showMaterialsFor);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      await supabase.from('lesson_materials').delete().eq('id', id);
      if (showMaterialsFor) {
        loadMaterials(showMaterialsFor);
      }
    }
  };

  const showMaterialsModal = (lessonId: string) => {
    setShowMaterialsFor(lessonId);
    loadMaterials(lessonId);
  };

  const getModuleName = (moduleId: string) => {
    return modules.find((m) => m.id === moduleId)?.title || 'Módulo não encontrado';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Aulas</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingLesson(null);
            setFormData({ title: '', description: '', video_url: '', module_id: '', order_index: 0, duration_seconds: 0 });
          }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nova Aula
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingLesson ? 'Editar Aula' : 'Nova Aula'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Módulo</label>
              <select
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              >
                <option value="">Selecione um módulo</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Título da Aula</label>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">URL do Vídeo</label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
              <p className="text-slate-500 text-xs mt-1">YouTube, Vimeo ou URL direta</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Duração (segundos)</label>
                <input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition"
              >
                {editingLesson ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingLesson(null);
                  setFormData({ title: '', description: '', video_url: '', module_id: '', order_index: 0, duration_seconds: 0 });
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
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">
                  Aula {lesson.order_index + 1} • {getModuleName(lesson.module_id)}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{lesson.title}</h3>
                {lesson.description && <p className="text-slate-400 text-sm mb-2">{lesson.description}</p>}
                <div className="text-xs text-slate-500">{lesson.video_url}</div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => showMaterialsModal(lesson.id)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition"
                  title="Gerenciar materiais"
                >
                  <FileUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(lesson)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showMaterialsFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Materiais da Aula</h3>
              <button
                onClick={() => {
                  setShowMaterialsFor(null);
                  setMaterialForm({ title: '', file_url: '', file_type: '' });
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4 mb-6 bg-slate-900 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Título do Material</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">URL do Arquivo</label>
                <input
                  type="url"
                  value={materialForm.file_url}
                  onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="https://exemplo.com/arquivo.pdf"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo do Arquivo</label>
                <input
                  type="text"
                  value={materialForm.file_type}
                  onChange={(e) => setMaterialForm({ ...materialForm, file_type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="pdf, zip, docx, etc"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
              >
                Adicionar Material
              </button>
            </form>

            <div className="space-y-2">
              {materials.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Nenhum material adicionado ainda</p>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="text-white font-medium">{material.title}</div>
                      <div className="text-slate-400 text-sm">{material.file_type.toUpperCase()}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
