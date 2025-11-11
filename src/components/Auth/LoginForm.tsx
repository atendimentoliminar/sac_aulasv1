import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export function LoginForm() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao conectar com o Google.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-500 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">Bem-vindo!</h1>
        <p className="text-slate-400 text-center mb-8">
          Acesse a plataforma usando sua conta Google corporativa ou pessoal.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/90 hover:bg-white text-slate-900 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Redirecionando…' : 'Entrar com Google'}</span>
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          Ao continuar, você será redirecionado ao Google para autenticação segura.
        </p>
      </div>
    </div>
  );
}
