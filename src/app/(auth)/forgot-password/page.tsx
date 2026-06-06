'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validations';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthContext();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch {
      toast.error('Erro ao enviar e-mail. Verifique o endereço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-violet-500/25">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
        <p className="text-slate-400 text-sm mt-1">Enviaremos um link para o seu e-mail</p>
      </div>

      {sent ? (
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-4">Verifique sua caixa de entrada.</p>
          <Link href="/login" className="text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
            <input
              {...register('email')}
              type="email"
              className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              placeholder="seu@email.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Enviando...' : 'Enviar e-mail'}
          </button>

          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 justify-center transition">
            <ArrowLeft className="w-3 h-3" /> Voltar ao login
          </Link>
        </form>
      )}
    </div>
  );
}
