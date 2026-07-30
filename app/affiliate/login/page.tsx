'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, Smartphone, Loader2, ArrowRight, Users, Check } from 'lucide-react';

type Mode = 'login' | 'register';

// ─── Field défini ICI — hors du composant principal ──────────────────────────
// Si Field était défini DANS AffiliateAuthForm, React le recrée à chaque render
// → démonte/remonte l'input → perte du focus après chaque frappe.
// Sorti ici une fois pour toutes → problème résolu.

const inputCls = 'w-full pl-10 bg-gray-950/50 border border-gray-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-gray-600 transition-all outline-none text-sm';

function Field({
  name, type = 'text', placeholder, icon: Icon,
  required = true, label, value, onChange,
}: {
  name: string; type?: string; placeholder: string;
  icon: React.ElementType; required?: boolean; label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
        </div>
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputCls}
        />
      </div>
    </div>
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

function AffiliateAuthForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode]       = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Un state par champ — évite le re-render complet du formulaire
  const [email, setEmail]                         = useState('');
  const [password, setPassword]                   = useState('');
  const [firstName, setFirstName]                 = useState('');
  const [lastName, setLastName]                   = useState('');
  const [phone, setPhone]                         = useState('');
  const [disbursementPhone, setDisbursementPhone] = useState('');

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/affiliate/login' : '/affiliate/register';
      const body = mode === 'login'
        ? { email, password }
        : {
            email, password,
            firstName, lastName,
            phone,
            disbursementPhone: disbursementPhone || undefined,
          };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');

      localStorage.setItem('affiliate_token', data.token);

      if (mode === 'register') {
        setSuccess(true);
        setTimeout(() => router.push('/affiliate/dashboard'), 1200);
      } else {
        router.push('/affiliate/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-5 border border-indigo-500/30">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Espace Affiliés</h1>
          <p className="text-gray-400 mt-2 text-sm">Konza RH — Commissions PME & Cabinet</p>
        </div>

        {/* Toggle login / register */}
        <div className="flex bg-gray-900/60 border border-gray-800 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button"
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-all ${
                mode === m ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
              }`}>
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-900/30 border border-green-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-white font-semibold mb-1">Compte créé !</p>
              <p className="text-sm text-gray-500">Redirection vers votre tableau de bord…</p>
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        name="firstName" label="Prénom" placeholder="Jean"
                        icon={User} value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                      <Field
                        name="lastName" label="Nom" placeholder="Dupont"
                        icon={User} value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>

                    <Field
                      name="phone" type="tel"
                      label="Téléphone Mobile Money"
                      placeholder="+242 06 123 45 67"
                      icon={Phone} value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    <p className="text-xs text-gray-600 -mt-2 ml-1">
                      Ce numéro sera utilisé pour vos versements.
                    </p>

                    <Field
                      name="disbursementPhone" type="tel" required={false}
                      label="Numéro dédié aux versements (optionnel)"
                      placeholder="Si différent du numéro de contact"
                      icon={Smartphone} value={disbursementPhone}
                      onChange={e => setDisbursementPhone(e.target.value)}
                    />
                  </>
                )}

                <Field
                  name="email" type="email" label="Email"
                  placeholder="jean@exemple.com"
                  icon={Mail} value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Field
                  name="password" type="password" label="Mot de passe"
                  placeholder="••••••••••••"
                  icon={Lock} value={password}
                  onChange={e => setPassword(e.target.value)}
                />

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2">
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : (
                      <>
                        {mode === 'login' ? 'Accéder au tableau de bord' : 'Créer mon compte'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-5">
          Espace réservé aux partenaires affiliés Konza RH.
          {mode === 'register' && (
            <><br /><span className="text-indigo-600">*</span> Le numéro de téléphone est requis pour les versements.</>
          )}
        </p>

      </div>
    </div>
  );
}

export default function AffiliateAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19]" />}>
      <AffiliateAuthForm />
    </Suspense>
  );
}