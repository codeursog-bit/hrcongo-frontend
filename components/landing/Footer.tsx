// ============================================================================
// 📁 components/landing/Footer.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Hexagon, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B1121] border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Hexagon size={24} fill="white" />
              </div>
              <span className="text-2xl font-bold text-white">HRCongo</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Simplifiez la gestion des RH grâce à une plateforme moderne tout-en-un.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:contact@hrcongo.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Mail size={18} />
                <span className="text-sm">contact@hrcongo.com</span>
              </a>
              <a href="tel:+242053079107" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Phone size={18} />
                <span className="text-sm">+242 053 079 107</span>
              </a>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={18} />
                <span className="text-sm">Pointe-Noire, Congo-Brazzaville</span>
              </div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-white font-bold mb-4">Produit</h3>
            <ul className="space-y-3">
              <li><a href="#fonctionnalités" className="text-slate-400 hover:text-white transition-colors text-sm">Caractéristiques</a></li>
              <li><a href="#tarifs" className="text-slate-400 hover:text-white transition-colors text-sm">Tarification</a></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="text-white font-bold mb-4">Entreprise</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">À propos de nous</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Soutien & Légal */}
          <div>
            <h3 className="text-white font-bold mb-4">Légal</h3>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors text-sm">FAQ</Link></li>
              <li><Link href="/cgu" className="text-slate-400 hover:text-white transition-colors text-sm">Conditions d'utilisation</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Politique de confidentialité</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Restez Informé</h3>
            <p className="text-slate-400 mb-6">
              Inscrivez-vous à notre newsletter pour recevoir des conseils RH et les dernières actualités
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Saisissez votre adresse e-mail"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 HRCongo. Tous droits réservés.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-slate-500 text-sm">Suivez-nous:</span>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}