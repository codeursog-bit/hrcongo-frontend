'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, User, Mail, Lock, Key, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0B0F19]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-0 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 m-4 animate-slide-up">
        
        {/* Left Side: Info */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-gray-900 to-gray-950 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red opacity-50"></div>
           
           <div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 bg-brand-red/10 rounded-lg border border-brand-red/20">
                    <Shield className="w-6 h-6 text-brand-red" />
                 </div>
                 <span className="font-bold text-white text-lg tracking-wide">HRCongo</span>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                 Admin Access <br/>
                 <span className="text-gray-500">Registration</span>
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                 Create a high-privilege account to manage tenants, oversee billing, and monitor system health across the HRCongo platform.
              </p>

              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-green-500">
                       <Shield className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-white text-sm font-medium">Root Level Access</div>
                       <div className="text-gray-500 text-xs">Full control over all subsystems</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500">
                       <Lock className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-white text-sm font-medium">Audit Logged</div>
                       <div className="text-gray-500 text-xs">All actions are recorded for security</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-xs">
                 <span className="text-brand-gold">Note:</span> This registration form is restricted. You must have a valid Organization Secret Key to proceed.
              </p>
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 bg-gray-900/20">
           <h2 className="text-xl font-bold text-white mb-6">Create Account</h2>
           
           <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute top-3 left-3 text-gray-500 group-focus-within:text-white transition-colors"><User className="w-5 h-5"/></div>
                    <input type="text" placeholder="Full Name" className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all" />
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute top-3 left-3 text-gray-500 group-focus-within:text-white transition-colors"><Mail className="w-5 h-5"/></div>
                    <input type="email" placeholder="Work Email" className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all" />
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute top-3 left-3 text-gray-500 group-focus-within:text-white transition-colors"><Lock className="w-5 h-5"/></div>
                    <input type="password" placeholder="Password" className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all" />
                 </div>

                 {/* Secret Key Field */}
                 <div className="pt-2">
                    <label className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-2 flex items-center gap-1">
                       <Key className="w-3 h-3" /> Organization Secret Key
                    </label>
                    <div className="relative group">
                        <input 
                           type="password" 
                           placeholder="Enter Admin Key (e.g. HR-SUPER-2025)" 
                           value={secretKey}
                           onChange={(e) => setSecretKey(e.target.value)}
                           className="w-full bg-gray-950 border border-brand-gold/30 rounded-xl py-3 pl-4 pr-4 text-brand-gold placeholder-gray-700 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all font-mono text-sm tracking-wider" 
                           required
                        />
                    </div>
                 </div>
              </div>

              <div className="pt-2">
                  <button 
                     type="submit" 
                     disabled={isLoading}
                     className="w-full bg-white hover:bg-gray-200 text-gray-900 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Administrator'}
                  </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                 Already have access? <Link href="/login" className="text-white hover:underline font-medium">Sign in</Link>
              </p>
           </form>
        </div>

      </div>
    </div>
  );
}
