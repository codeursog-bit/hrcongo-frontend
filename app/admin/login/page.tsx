'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Shield, CreditCard, User, Mail, Users, BarChart2, AlertTriangle, ShieldAlert, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '@/lib/services/authService';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authService.login({ email, password });
      
      // ✅ Vérifier si SUPER_ADMIN
      if (response.user.role !== 'SUPER_ADMIN') {
        setError('Accès refusé. Seuls les Super Administrateurs peuvent se connecter ici.');
        authService.logout();
        setIsLoading(false);
        return;
      }

      // ✅ Rediriger vers /admin (pas /admin/dashboard)
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-brand-darkRed shadow-[0_0_30px_rgba(220,38,38,0.4)] mb-6 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenue</h1>
          <p className="text-gray-400 mt-2 text-sm">Centre de Contrôle Super Admin</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-brand-red transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red placeholder-gray-600 transition-all outline-none" 
                  placeholder="admin@hrcongo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Mot de passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-brand-red transition-colors" />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 bg-gray-950/50 border border-gray-800 text-white rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red placeholder-gray-600 transition-all outline-none" 
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-brand-red to-brand-darkRed hover:to-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Accéder au Tableau de Bord <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}