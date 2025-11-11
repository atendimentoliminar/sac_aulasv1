import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Module, Lesson, LessonMaterial, UserProgress } from '../../types';
import { ChevronLeft, Download, CheckCircle, Circle, Play, FileText, Info } from 'lucide-react';

interface LessonViewerProps {
  courseId: string;
  onBack: () => void;
}

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export function LessonViewer({ courseId, onBack }: LessonViewerProps) {
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesData && modulesData.length > 0) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module) => {
            const { data: lessonsData } = await supabase
              .from('lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index');

            return {
              ...module,
              lessons: lessonsData || [],
            };
          })
        );

        setModules(modulesWithLessons);

        const previouslySelectedLessonId = currentLesson?.id;
        const firstLesson = modulesWithLessons[0]?.lessons[0] ?? null;
        const nextLesson =
          (previouslySelectedLessonId &&
            modulesWithLessons
              .flatMap((module) => module.lessons)
              .find((lesson) => lesson.id === previouslySelectedLessonId)) ||
          firstLesson ||
          null;

        if (nextLesson) {
          setCurrentLesson(nextLesson);
          await loadLessonMaterials(nextLesson.id);
        } else {
          setCurrentLesson(null);
          setMaterials([]);
        }
      }

      const progressQuery = supabase.from('user_progress').select('*');
      if (userId) {
        progressQuery.eq('user_id', userId);
      }
      const { data: progressData, error: progressError } = await progressQuery;

      if (progressError) {
        throw progressError;
      }

      if (progressData) {
        const progressMap: Record<string, UserProgress> = {};
        progressData.forEach((p) => {
          progressMap[p.lesson_id] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonMaterials = async (lessonId: string) => {
    const { data } = await supabase
      .from('lesson_materials')
      .select('*')
      .eq('lesson_id', lessonId);

    setMaterials(data || []);
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    loadLessonMaterials(lesson.id);
  };

  const canAccessLesson = (lesson: Lesson, moduleIndex: number, lessonIndex: number): boolean => {
    if (moduleIndex === 0 && lessonIndex === 0) return true;

    for (let m = 0; m < modules.length; m++) {
      for (let l = 0; l < modules[m].lessons.length; l++) {
        if (m === moduleIndex && l === lessonIndex) {
          return true;
        }

        const lessonToCheck = modules[m].lessons[l];
        if (!progress[lessonToCheck.id]?.completed) {
          return false;
        }
      }
    }

    return false;
  };

  const completeLesson = async () => {
    if (!currentLesson) return;
    setStatusMessage(null);

    setCompletingLesson(true);
    try {
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError) {
        throw sessionError;
      }

      if (!user) {
        throw new Error('Sessão expirada. Faça login novamente para continuar.');
      }

      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const now = new Date().toISOString();
      const payload = {
        user_id: user.id,
        lesson_id: currentLesson.id,
        completed: true,
        completed_at: now,
        last_watched_at: now,
      };

      let updatedProgress: UserProgress | null = null;

      if (existingProgress) {
        const { data, error } = await supabase
          .from('user_progress')
          .update({
            ...payload,
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        updatedProgress = data;
      } else {
        const { data, error } = await supabase.from('user_progress').insert(payload).select().single();

        if (error) {
          throw error;
        }

        updatedProgress = data;
      }

      if (updatedProgress) {
        setProgress((prev) => ({
          ...prev,
          [currentLesson.id]: updatedProgress as UserProgress,
        }));
      }

      setStatusMessage({
        type: 'success',
        message: 'Aula marcada como concluída! Você pode avançar para a próxima.',
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível concluir esta aula.';
      setStatusMessage({
        type: 'error',
        message,
      });
    } finally {
      setCompletingLesson(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando conteúdo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <button
              onClick={onBack}
              className="flex items-center text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Voltar para cursos
            </button>
          </div>

          {currentLesson ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="bg-black aspect-video w-full">
                <iframe
                  src={getEmbedUrl(currentLesson.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-6 bg-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-slate-400 mb-1">
                      MÓDULO {modules.findIndex(m => m.lessons.some(l => l.id === currentLesson.id)) + 1} AULA {
                        modules.find(m => m.lessons.some(l => l.id === currentLesson.id))
                          ?.lessons.findIndex(l => l.id === currentLesson.id)! + 1
                      } de {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {currentLesson.title}
                    </h2>
                  </div>

                  <button
                    onClick={completeLesson}
                    disabled={completingLesson || progress[currentLesson.id]?.completed}
                    className="ml-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {progress[currentLesson.id]?.completed ? 'Concluído' : 'Concluir'}
                  </button>
                </div>

                <div className="mt-4 text-sm text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Marque a aula como concluída para liberar o próximo conteúdo.
                </div>

                {statusMessage && (
                  <div
                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                      statusMessage.type === 'success'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-red-500 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {statusMessage.message}
                  </div>
                )}

                {currentLesson.description && (
                  <div className="mb-6">
                    <h3 className="text-orange-400 font-semibold mb-2">Descrição</h3>
                    <p className="text-slate-300 leading-relaxed">{currentLesson.description}</p>
                  </div>
                )}

                {materials.length > 0 && (
                  <div>
                    <h3 className="text-orange-400 font-semibold mb-3">Materiais</h3>
                    <div className="space-y-2">
                      {materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition group"
                        >
                          <FileText className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition" />
                          <div className="flex-1">
                            <div className="text-white font-medium">{material.title}</div>
                            <div className="text-slate-400 text-sm">{material.file_type.toUpperCase()}</div>
                          </div>
                          <Download className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Selecione uma aula para começar</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 bg-slate-800 border-l border-slate-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-white font-bold text-lg mb-4">Conteúdo do Curso</h3>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 mb-4">
              <CheckCircle className="w-4 h-4 text-orange-400" />
              Use o botão “Concluir” acima do vídeo para avançar nas aulas.
            </div>

            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-slate-700 rounded-lg overflow-hidden">
                  <div className="bg-slate-700 p-3">
                    <div className="text-xs text-slate-400 mb-1">MÓDULO {moduleIndex + 1}</div>
                    <div className="text-white font-semibold">{module.title}</div>
                  </div>

                  <div className="divide-y divide-slate-700">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = progress[lesson.id]?.completed;
                      const isAccessible = canAccessLesson(lesson, moduleIndex, lessonIndex);
                      const isCurrent = currentLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => isAccessible && selectLesson(lesson)}
                          disabled={!isAccessible}
                          className={`w-full p-3 text-left flex items-start gap-3 transition ${
                            isCurrent
                              ? 'bg-orange-500/20 border-l-4 border-orange-500'
                              : isAccessible
                              ? 'hover:bg-slate-700'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm">{lesson.title}</div>
                            <div className="text-slate-400 text-xs mt-1">
                              Aula {lessonIndex + 1 + (moduleIndex > 0 ? modules.slice(0, moduleIndex).reduce((sum, m) => sum + m.lessons.length, 0) : 0)} de {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
