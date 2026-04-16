'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight, Users } from 'lucide-react';

type Mode = 'login' | 'register';

export default function AffiliateAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  // Détecter ?mode=register dans l'URL
  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register');
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint =
      mode === 'login'
        ? '/affiliate/login'
        : '/affiliate/register';

    const body =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
          };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      localStorage.setItem('affiliate_token', data.token);
      router.push('/affiliate/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0B0F19]">
      {/* Blobs décoratifs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo / titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-5 border border-indigo-500/30">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Espace Affiliés
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Konza RH — Gérez vos commissions et suivez vos entreprises
          </p>
        </div>

        {/* Onglets */}
        <div className="flex bg-gray-900/60 border border-gray-800 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Formulaire */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Prénom
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="block w-full pl-9 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-gray-600 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Nom
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      name="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Dupont"
                      className="block w-full pl-9 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-gray-600 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jean@exemple.com"
                  className="block w-full pl-10 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-gray-600 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-gray-600 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Accéder au Tableau de Bord' : 'Créer mon compte'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          Cet espace est réservé aux partenaires affiliés Konza RH.
        </p>
      </div>
    </div>
  );
}
