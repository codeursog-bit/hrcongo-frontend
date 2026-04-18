'use client';

// ============================================================================
// 📁 app/docs/page.tsx
// Centre d'aide Konza RH — Next.js
// - Même fond sombre que la landing (#020617)
// - Header et Footer identiques à la landing
// - Sidebar sticky de navigation
// - Sections mises à jour (paie simplifiée, entreprise/PME, cabinet)
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Hexagon, ArrowRight, Menu, X, Mail, Phone, MapPin,
  Facebook, Twitter, Linkedin,
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

// ─── Navbar identique à la landing ───────────────────────────────────────────
// function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16 sm:h-20">
//           <div className="flex items-center gap-2 sm:gap-3">
//             <div className="relative group cursor-pointer">
//               <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
//               <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white border border-white/20">
//                 <Hexagon size={20} className="sm:w-6 sm:h-6" fill="currentColor" />
//               </div>
//             </div>
//             <Link href="/" className="text-xl sm:text-2xl font-bold text-white tracking-tight">HRCongo</Link>
//           </div>

//           <div className="hidden md:flex items-center gap-8 lg:gap-10">
//             {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
//               <a key={item} href={`/#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
//                 {item}
//                 <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
//               </a>
//             ))}
//             <Link href="/docs" className="text-sm font-medium text-cyan-400 relative group">
//               Documentation
//               <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-cyan-500"></span>
//             </Link>
//           </div>

//           <div className="hidden md:flex items-center gap-3 lg:gap-4">
//             <Link href="/auth/login" className="text-white font-bold hover:text-cyan-400 transition-colors px-3 lg:px-4 text-sm lg:text-base">
//               Connexion
//             </Link>
//             <Link
//               href="/auth/register"
//               className="group relative px-4 lg:px-6 py-2 lg:py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:scale-105 overflow-hidden text-sm lg:text-base"
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <span className="relative z-10 flex items-center gap-2">Essai Gratuit <ArrowRight size={16} /></span>
//             </Link>
//           </div>

//           <div className="md:hidden">
//             <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
//               {isOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>

//         {isOpen && (
//           <div className="md:hidden py-4 border-t border-white/5 space-y-4">
//             {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
//               <a
//                 key={item}
//                 href={`/#${item.toLowerCase()}`}
//                 className="block text-slate-300 hover:text-white transition-colors"
//                 onClick={() => setIsOpen(false)}
//               >
//                 {item}
//               </a>
//             ))}
//             <Link href="/docs" className="block text-cyan-400 font-bold" onClick={() => setIsOpen(false)}>
//               Documentation
//             </Link>
//             <Link
//               href="/auth/register"
//               className="w-full py-3 bg-cyan-500 text-slate-900 rounded-xl font-bold text-center block"
//             >
//               Essai Gratuit
//             </Link>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }

// ─── Footer identique à la landing ───────────────────────────────────────────
// function Footer() {
//   return (
//     <footer className="bg-[#0B1121] border-t border-white/5">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
//           <div className="lg:col-span-2">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
//                 <Hexagon size={24} fill="white" />
//               </div>
//               <span className="text-2xl font-bold text-white">HRCongo</span>
//             </div>
//             <p className="text-slate-400 mb-6 leading-relaxed">
//               Simplifiez la gestion des RH grâce à une plateforme moderne tout-en-un.
//             </p>
//             <div className="space-y-3">
//               <a href="mailto:contact@hrcongo.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
//                 <Mail size={18} /><span className="text-sm">contact@hrcongo.com</span>
//               </a>
//               <a href="tel:+242053079107" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
//                 <Phone size={18} /><span className="text-sm">+242 053 079 107</span>
//               </a>
//               <div className="flex items-center gap-3 text-slate-400">
//                 <MapPin size={18} /><span className="text-sm">Pointe-Noire, Congo-Brazzaville</span>
//               </div>
//             </div>
//           </div>
//           <div>
//             <h3 className="text-white font-bold mb-4">Produit</h3>
//             <ul className="space-y-3">
//               <li><a href="/#fonctionnalités" className="text-slate-400 hover:text-white transition-colors text-sm">Caractéristiques</a></li>
//               <li><a href="/#tarifs" className="text-slate-400 hover:text-white transition-colors text-sm">Tarification</a></li>
//               <li><Link href="/docs" className="text-cyan-400 hover:text-white transition-colors text-sm">Documentation</Link></li>
//             </ul>
//           </div>
//           <div>
//             <h3 className="text-white font-bold mb-4">Entreprise</h3>
//             <ul className="space-y-3">
//               <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">À propos de nous</Link></li>
//               <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link></li>
//             </ul>
//           </div>
//           <div>
//             <h3 className="text-white font-bold mb-4">Légal</h3>
//             <ul className="space-y-3">
//               <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors text-sm">FAQ</Link></li>
//               <li><Link href="/cgu" className="text-slate-400 hover:text-white transition-colors text-sm">Conditions d'utilisation</Link></li>
//               <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Politique de confidentialité</Link></li>
//             </ul>
//           </div>
//         </div>
//       </div>
//       <div className="border-t border-white/5">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="max-w-2xl mx-auto text-center">
//             <h3 className="text-2xl font-bold text-white mb-4">Restez Informé</h3>
//             <p className="text-slate-400 mb-6">Inscrivez-vous à notre newsletter pour recevoir des conseils RH et les dernières actualités</p>
//             <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
//               <input type="email" placeholder="Saisissez votre adresse e-mail"
//                 className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
//               <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors">S'abonner</button>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="border-t border-white/5">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//             <p className="text-slate-500 text-sm">© 2025 HRCongo. Tous droits réservés.</p>
//             <div className="flex items-center gap-4">
//               <span className="text-slate-500 text-sm">Suivez-nous:</span>
//               <a href="#" className="text-slate-400 hover:text-white transition-colors"><Facebook size={20} /></a>
//               <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter size={20} /></a>
//               <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }

// ─── Sidebar items ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Démarrage',
    links: [
      { href: '#onboarding', text: 'Guide de démarrage' },
      { href: '#roles', text: 'Rôles & permissions' },
    ],
  },
  {
    label: 'Configuration',
    links: [
      { href: '#entreprise', text: 'Entreprise / PME' },
      { href: '#cabinet', text: 'Mode Cabinet' },
      { href: '#departements', text: 'Départements' },
      { href: '#utilisateurs', text: 'Utilisateurs' },
    ],
  },
  {
    label: 'Employés',
    links: [
      { href: '#employes', text: 'Créer un employé' },
      { href: '#import', text: 'Import Excel' },
      { href: '#contrats', text: 'Contrats' },
    ],
  },
  {
    label: 'Présences',
    links: [
      { href: '#pointage', text: 'Pointage GPS' },
      { href: '#pointage-manuel', text: 'Pointage manuel' },
      { href: '#shifts', text: 'Planning shifts' },
    ],
  },
  {
    label: 'Paie',
    links: [
      { href: '#paie', text: 'Bulletin individuel' },
      { href: '#paie-masse', text: 'Paie en masse' },
      { href: '#loans', text: 'Prêts & avances' },
      { href: '#impayes', text: 'Impayés' },
    ],
  },
  {
    label: 'Autres modules',
    links: [
      { href: '#conges', text: 'Congés' },
      { href: '#cnss', text: 'Déclaration CNSS' },
      { href: '#recrutement', text: 'Recrutement' },
      { href: '#formation', text: 'Formation' },
      { href: '#materiel', text: 'Matériel' },
    ],
  },
  {
    label: 'FAQ',
    links: [
      { href: '#faq', text: 'Questions fréquentes' },
    ],
  },
];

// ─── Reusable doc components ──────────────────────────────────────────────────
function SectionHeader({ num, title, badge }: { num: string; title: string; badge?: { text: string; type: 'required' | 'optional' | 'critical' } }) {
  const badgeColors = {
    required: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    optional: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    critical: 'bg-red-500/15 text-red-400 border border-red-500/20',
  };
  return (
    <div className="flex items-end gap-3 mb-6 pb-3 border-b border-white/8">
      <div>
        <div className="text-xs font-mono text-slate-500 mb-1">{num}</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {badge && (
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded mb-1 ${badgeColors[badge.type]}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function PathCrumb({ path }: { path: string }) {
  return (
    <div className="inline-flex items-center font-mono text-xs bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-slate-400 mb-4">
      {path.split('→').map((part, i, arr) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-600 mx-1">›</span>}
          <span className={i === arr.length - 1 ? 'text-cyan-400' : ''}>{part.trim()}</span>
        </span>
      ))}
    </div>
  );
}

function GuideCard({ icon, title, steps }: { icon: string; title: string; steps: string[] }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
        <span className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-sm">{icon}</span>
        {title}
      </h3>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-400 py-2 border-b border-white/5 last:border-0">
            <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-mono text-cyan-400 mt-0.5">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: step }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBlock({ type, title, children }: { type: 'tip' | 'warn' | 'info'; title: string; children: React.ReactNode }) {
  const styles = {
    tip: 'bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-300',
    warn: 'bg-amber-500/10 border-l-2 border-amber-500 text-amber-300',
    info: 'bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-300',
  };
  return (
    <div className={`rounded-lg px-4 py-3 text-sm my-4 ${styles[type]}`}>
      <strong className="block font-semibold mb-1">{title}</strong>
      <span className="opacity-80">{children}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <span className={`text-slate-500 font-mono text-lg transition-transform flex-shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="mt-3 text-sm text-slate-400 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: a }} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('onboarding');

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />

      <div className="flex pt-16 sm:pt-20">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 min-h-screen sticky top-16 sm:top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r border-white/5 bg-[#020617] flex-shrink-0 pb-8">
          <div className="px-5 pt-6 pb-2">
            <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase font-mono mb-1">Centre d'aide</div>
            <div className="text-[10px] text-slate-600 font-mono">v2.0 · Documentation officielle</div>
          </div>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="px-5 pt-5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
                {section.label}
              </div>
              {section.links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-all border-l-2 ${
                    activeSection === link.href.slice(1)
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeSection === link.href.slice(1) ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                  {link.text}
                </a>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 max-w-3xl mx-auto px-6 sm:px-10 py-10 pb-20">

          {/* Hero */}
          <div className="mb-12 pb-10 border-b border-white/8">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Documentation officielle</div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-4">
              Centre d'aide<br />Konza RH
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-xl">
              Tout ce qu'il vous faut pour configurer votre espace, gérer vos équipes et générer votre première paie — sans contacter le support.
            </p>
          </div>

          {/* ═══ 01 GUIDE DÉMARRAGE ═══ */}
          <section id="onboarding" className="mb-16 scroll-mt-24">
            <SectionHeader num="01" title="Guide de démarrage" badge={{ text: 'Obligatoire', type: 'required' }} />
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              En tant que nouvel administrateur, suivez ces 5 étapes dans l'ordre. Chaque étape débloque la suivante — ne sautez pas la configuration entreprise,car c'est le fondement
            </p>
            <div className="relative pl-8 space-y-0">
              <div className="absolute left-[11px] top-10 bottom-10 w-px bg-gradient-to-b from-cyan-500 via-cyan-500/40 to-transparent" />
              {[
                { title: 'Configurer votre entreprise', desc: 'Renseignez le nom légal, le RCCM, le logo, l\'adresse et les coordonnées. Ces infos apparaissent sur tous les bulletins de paie.', link: '#entreprise' },
                { title: 'Créer vos départements', desc: 'Organisez la structure de votre société. Chaque employé sera rattaché à un département lors de sa création.', link: '#departements' },
                { title: 'Ajouter vos employés', desc: 'Créez les dossiers manuellement ou importez un fichier Excel. Chaque dossier contient identité, contrat, salaire de base et documents RH.', link: '#employes' },
                { title: 'Générer votre première paie', desc: 'Rendez-vous dans Paie pour créer un bulletin individuel ou lancer la paie en masse pour tout un département.', link: '#paie' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 py-4">
                  <div className="w-6 h-6 rounded-full bg-[#020617] border border-cyan-500/40 flex items-center justify-center text-[10px] font-mono text-cyan-400 flex-shrink-0 mt-0.5 z-10">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                    <a href={step.link} className="text-xs text-cyan-500 hover:underline mt-1 inline-block">→ Voir le guide</a>
                  </div>
                </div>
              ))}
            </div>
            <InfoBlock type="tip" title="Conseil">
              Pour un premier test, créez un seul département + un seul employé fictif, puis générez son bulletin. Cela vous permet de valider la configuration avant l'import de masse.
            </InfoBlock>
          </section>

          {/* ═══ 02 RÔLES ═══ */}
          <section id="roles" className="mb-16 scroll-mt-24">
            <SectionHeader num="02" title="Rôles & permissions" />
            <p className="text-sm text-slate-400 mb-5">Konza RH dispose de 4 rôles. L'accès aux modules dépend du rôle assigné lors de la création du compte utilisateur.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                { name: 'ADMIN', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', perms: ['Accès total', 'Configuration système', 'Gestion paie', 'Gestion utilisateurs'] },
                { name: 'RH MANAGER', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', perms: ['Gestion employés', 'Bulletins de paie', 'Présences & congés', 'Prêts & avances'] },
                { name: 'MANAGER', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', perms: ['Voir son équipe', 'Valider congés', 'Pointage équipe', 'Mes présences'] },
                { name: 'EMPLOYÉ', color: 'text-slate-400 bg-white/5 border-white/10', perms: ['Ma fiche paie', 'Mes présences', 'Pointeuse GPS', 'Mes demandes de congé'] },
              ].map(role => (
                <div key={role.name} className="bg-white/4 border border-white/8 rounded-xl p-4">
                  <span className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded border mb-3 ${role.color}`}>{role.name}</span>
                  <ul className="space-y-1">
                    {role.perms.map(p => (
                      <li key={p} className="text-xs text-slate-400 before:content-['◦_'] before:text-cyan-500">{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <InfoBlock type="info" title="Comment créer un utilisateur">
              Allez dans <code className="bg-white/8 px-1.5 py-0.5 rounded text-cyan-300 text-xs">Paramètres → Gestion Utilisateurs → Inviter un utilisateur</code>. Saisissez l'email, choisissez le rôle et validez. L'utilisateur recevra un email d'invitation.
            </InfoBlock>
          </section>

          {/* ═══ 03 ENTREPRISE / PME ═══ */}
          <section id="entreprise" className="mb-16 scroll-mt-24">
            <SectionHeader num="03" title="Entreprise / PME" badge={{ text: 'Priorité 1', type: 'required' }} />
            <PathCrumb path="Paramètres → Entreprise" />
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Que vous soyez une entreprise classique ou une PME gérée via un Cabinet, cette section centralise toutes vos informations légales et opérationnelles. Ces données apparaissent sur chaque bulletin de paie et déclaration CNSS.
            </p>
            <GuideCard icon="🏢" title="Informations légales & paramètres" steps={[
              'Renseignez la <strong class="text-white">raison sociale</strong> telle qu\'elle apparaît sur vos documents officiels.',
              'Entrez le <strong class="text-white">RCCM / NIF</strong> de votre société (utilisé sur les déclarations CNSS).',
              'Saisissez l\'<strong class="text-white">adresse complète</strong> et les coordonnées (téléphone, email RH).',
              'Téléversez votre <strong class="text-white">logo</strong> (format PNG recommandé, fond transparent). Il apparaîtra sur les bulletins.',
              'Configurez la <strong class="text-white">localisation GPS autorisée</strong> — rayon en mètres depuis vos locaux.',
              'Cliquez sur <strong class="text-white">Enregistrer</strong>. Ces paramètres prennent effet immédiatement.',
            ]} />
            <InfoBlock type="warn" title="Attention">
              Si vous ne configurez pas la localisation GPS, le module de pointage GPS sera désactivé pour tous vos employés.
            </InfoBlock>
          </section>

          {/* ═══ 04 MODE CABINET ═══ */}
          <section id="cabinet" className="mb-16 scroll-mt-24">
            <SectionHeader num="04" title="Mode Cabinet — gérer plusieurs PME" badge={{ text: 'Multi-entreprises', type: 'optional' }} />
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Si vous êtes un cabinet RH, un comptable ou un consultant gérant plusieurs sociétés, le <strong className="text-white">Mode Cabinet</strong> vous permet de centraliser toutes vos PME dans un seul tableau de bord, sans changer de compte.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <GuideCard icon="🏛️" title="Créer un cabinet" steps={[
                'Depuis votre compte, allez dans <strong class="text-white">Cabinet → Créer mon cabinet</strong>.',
                'Donnez un nom à votre structure (ex : "Cabinet Dupont RH").',
                'Votre compte devient le compte principal du cabinet avec accès total.',
                'Votre tableau de bord affiche maintenant toutes les PME rattachées.',
              ]} />
              <GuideCard icon="🏢" title="Ajouter une PME" steps={[
                'Dans le dashboard cabinet, cliquez <strong class="text-white">Ajouter une PME</strong>.',
                'Renseignez les infos légales de la PME : raison sociale, RCCM, adresse.',
                'Chaque PME dispose de sa propre configuration, ses employés et sa paie.',
                'Basculez entre les PME via le <strong class="text-white">sélecteur d\'entreprise</strong> en haut à gauche.',
              ]} />
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-base">🔄</span> Flux de travail Cabinet
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-400">
                {['Connexion Cabinet', '→', 'Sélection PME', '→', 'Gestion RH isolée', '→', 'Retour Dashboard', '→', 'PME suivante'].map((step, i) => (
                  <span key={i} className={step === '→' ? 'text-slate-600 hidden sm:inline' : 'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg'}>
                    {step}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">Chaque PME est totalement isolée : ses employés, sa paie, ses documents et sa configuration sont indépendants.</p>
            </div>

            <InfoBlock type="info" title="Cas d'usage Cabinet">
              Idéal pour les cabinets d'expertise comptable, DRH externalisées ou groupes de sociétés. Un seul abonnement Cabinet couvre toutes les PME rattachées.
            </InfoBlock>
          </section>

          {/* ═══ 05 DÉPARTEMENTS ═══ */}
          <section id="departements" className="mb-16 scroll-mt-24">
            <SectionHeader num="05" title="Créer des départements" badge={{ text: 'Priorité 2', type: 'required' }} />
            <PathCrumb path="Paramètres → Départements" />
            <GuideCard icon="📂" title="Ajouter un département" steps={[
              'Cliquez sur <strong class="text-white">Nouveau département</strong>.',
              'Saisissez le <strong class="text-white">nom du service</strong> (ex : Direction, RH, Comptabilité, Terrain).',
              'Assignez un <strong class="text-white">Manager responsable</strong> si l\'utilisateur existe déjà.',
              'Sauvegardez. Le département est immédiatement disponible lors de la création d\'un employé.',
            ]} />
            <InfoBlock type="tip" title="Bonne pratique">
              Créez au moins un département avant d'importer vos employés via Excel, sinon le rattachement échouera.
            </InfoBlock>
          </section>

          {/* ═══ 06 UTILISATEURS ═══ */}
          <section id="utilisateurs" className="mb-16 scroll-mt-24">
            <SectionHeader num="06" title="Gestion des utilisateurs" />
            <PathCrumb path="Paramètres → Gestion Utilisateurs" />
            <GuideCard icon="👥" title="Inviter un utilisateur" steps={[
              'Cliquez sur <strong class="text-white">Inviter un utilisateur</strong>.',
              'Saisissez l\'adresse email et choisissez le <strong class="text-white">rôle</strong> approprié.',
              'Validez. L\'utilisateur reçoit un email d\'invitation avec un lien d\'activation valable 24h.',
              'Pour réinitialiser un mot de passe : options <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">⋯</code> → "Envoyer un lien de réinitialisation".',
            ]} />
          </section>

          {/* ═══ 07 EMPLOYÉS ═══ */}
          <section id="employes" className="mb-16 scroll-mt-24">
            <SectionHeader num="07" title="Créer un employé manuellement" />
            <PathCrumb path="Employés → Nouveau → Formulaire" />
            <GuideCard icon="👤" title="Formulaire en 4 étapes" steps={[
              '<strong class="text-white">Identité</strong> — Nom, prénom, date de naissance, photo, nationalité.',
              '<strong class="text-white">Situation familiale</strong> — Situation matrimoniale, nombre d\'enfants (impacte les calculs ITS).',
              '<strong class="text-white">Poste & contrat</strong> — Département, poste, type de contrat (CDI / CDD / Stage), date d\'embauche, salaire de base.',
              '<strong class="text-white">Validation</strong> — Vérifiez le récapitulatif avant de confirmer la création.',
            ]} />
          </section>

          {/* ═══ 08 IMPORT EXCEL ═══ */}
          <section id="import" className="mb-16 scroll-mt-24">
            <SectionHeader num="08" title="Import en masse via Excel" badge={{ text: 'Recommandé', type: 'optional' }} />
            <PathCrumb path="Employés → Importer" />
            <GuideCard icon="📊" title="Procédure d'import" steps={[
              'Téléchargez le <strong class="text-white">modèle Excel</strong> fourni sur la page d\'import.',
              'Remplissez les colonnes obligatoires : <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">prénom</code>, <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">nom</code>, <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">département</code>, <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">salaire_base</code>.',
              'Vérifiez que les <strong class="text-white">noms de départements</strong> correspondent exactement à ceux créés dans Paramètres.',
              'Glissez le fichier dans la zone d\'import ou cliquez pour le sélectionner.',
              'L\'interface affiche un <strong class="text-white">rapport de validation</strong> avec les lignes en erreur avant confirmation.',
            ]} />
            <InfoBlock type="warn" title="Format requis">
              Seul le format <code className="bg-white/8 px-1 rounded text-cyan-300 text-xs">.xlsx</code> est accepté. Les lignes avec un département inexistant seront rejetées.
            </InfoBlock>
          </section>

          {/* ═══ 09 CONTRATS ═══ */}
          <section id="contrats" className="mb-16 scroll-mt-24">
            <SectionHeader num="09" title="Gestion des contrats" />
            <PathCrumb path="Employé → Fiche → Contrat" />
            <div className="grid sm:grid-cols-2 gap-4">
              <GuideCard icon="📄" title="Créer un contrat" steps={[
                'Ouvrez la fiche de l\'employé concerné.',
                'Dans l\'onglet Contrat, cliquez <strong class="text-white">Nouveau contrat</strong>.',
                'Choisissez le type (CDI, CDD…), la date de début et la durée si CDD.',
                'Téléversez le document signé en PDF.',
              ]} />
              <GuideCard icon="✂️" title="Rupture de contrat" steps={[
                'Depuis la fiche employé, cliquez <strong class="text-white">Rompre le contrat</strong>.',
                'Sélectionnez le motif (démission, licenciement, fin CDD…).',
                'Indiquez la date de fin effective.',
                'Le statut de l\'employé passe automatiquement à <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">Suspendu</code>.',
              ]} />
            </div>
            <InfoBlock type="tip" title="Alertes d'expiration">
              Konza affiche automatiquement une alerte lorsqu'un contrat CDD arrive à échéance dans les 30 jours.
            </InfoBlock>
          </section>

          {/* ═══ 10 POINTAGE GPS ═══ */}
          <section id="pointage" className="mb-16 scroll-mt-24">
            <SectionHeader num="10" title="Pointage GPS" />
            <PathCrumb path="Présences → Ma Pointeuse GPS" />
            <GuideCard icon="📍" title="Comment pointer (employé / manager)" steps={[
              'Ouvrez Konza RH sur votre téléphone ou navigateur depuis les locaux.',
              'Autorisez la <strong class="text-white">géolocalisation</strong> du navigateur quand la demande apparaît.',
              'L\'application vérifie votre distance par rapport au périmètre autorisé.',
              'Si validé, cliquez <strong class="text-white">Pointer l\'arrivée</strong>. En fin de journée, revenez pour <strong class="text-white">Pointer le départ</strong>.',
              'La présence est enregistrée en temps réel dans la vue journalière.',
            ]} />
            <InfoBlock type="warn" title="Pointage hors zone">
              Si un employé est hors périmètre, l'application bloque le pointage. L'admin peut corriger via le Pointage manuel.
            </InfoBlock>
            <InfoBlock type="info" title="Mode hors-ligne (PWA)">
              L'app fonctionne hors connexion. Le pointage est mis en file d'attente et synchronisé dès que la connexion revient. Une bannière orange indique l'état hors-ligne.
            </InfoBlock>
          </section>

          {/* ═══ 11 POINTAGE MANUEL ═══ */}
          <section id="pointage-manuel" className="mb-16 scroll-mt-24">
            <SectionHeader num="11" title="Pointage manuel" />
            <PathCrumb path="Présences → Pointage Manuel" />
            <GuideCard icon="✏️" title="Saisir ou corriger une présence" steps={[
              'Sélectionnez l\'<strong class="text-white">employé</strong> concerné dans la liste.',
              'Choisissez la <strong class="text-white">date</strong> à corriger ou à compléter.',
              'Saisissez l\'heure d\'<strong class="text-white">arrivée</strong> et l\'heure de <strong class="text-white">départ</strong>.',
              'Ajoutez une <strong class="text-white">note de justification</strong> (obligatoire pour les corrections).',
              'Enregistrez. La correction apparaît avec la mention <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">Manuel</code>.',
            ]} />
          </section>

          {/* ═══ 12 SHIFTS ═══ */}
          <section id="shifts" className="mb-16 scroll-mt-24">
            <SectionHeader num="12" title="Planning de shifts" />
            <PathCrumb path="Présences → Shifts" />
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <GuideCard icon="📅" title="Créer un shift" steps={[
                'Cliquez sur <strong class="text-white">Nouveau shift</strong>.',
                'Nommez le shift (ex : <code class="bg-white/8 px-1 rounded text-cyan-300 text-xs">Matin 7h–15h</code>) et définissez les horaires.',
                'Activez <strong class="text-white">Shift de nuit</strong> si applicable pour déclencher la prime.',
                'Choisissez une couleur et sauvegardez.',
              ]} />
              <GuideCard icon="👤" title="Assigner un shift" steps={[
                'Cliquez sur <strong class="text-white">Assigner</strong> en haut de la page.',
                'Sélectionnez le shift, puis l\'employé dans la liste.',
                'Choisissez <strong class="text-white">Date précise</strong> ou <strong class="text-white">Récurrent</strong> (par jour de semaine).',
                'Confirmez — l\'employé apparaît aussitôt dans l\'onglet <strong class="text-white">Employés & Plannings</strong>.',
              ]} />
            </div>
            <InfoBlock type="info" title="Onglet Employés & Plannings">
              Par défaut, cet onglet n'affiche que les employés qui ont un shift assigné. Utilisez le bouton <strong>Shiftés seulement / Shiftés + Globaux</strong> pour inclure ou masquer les employés sans planning spécifique.
            </InfoBlock>
          </section>

          {/* ═══ 13 BULLETIN INDIVIDUEL ═══ */}
          <section id="paie" className="mb-16 scroll-mt-24">
            <SectionHeader num="13" title="Bulletin de paie individuel" />
            <PathCrumb path="Paie → Nouveau bulletin" />
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Les calculs de paie (CNSS, ITS, TOL, CAMU) sont entièrement automatisés selon la législation congolaise. Vous n'avez rien à configurer manuellement — l'app applique les barèmes officiels en vigueur.
            </p>
            <GuideCard icon="💸" title="Générer un bulletin" steps={[
              'Cliquez sur <strong class="text-white">Nouveau bulletin</strong> dans le menu Paie.',
              'Sélectionnez l\'<strong class="text-white">employé</strong> et le <strong class="text-white">mois de paie</strong>.',
              'Le système pré-remplit le salaire de base depuis la fiche employé.',
              'Ajoutez les <strong class="text-white">heures supplémentaires</strong>, <strong class="text-white">primes</strong> ou <strong class="text-white">déductions</strong> si applicable.',
              'Vérifiez l\'<strong class="text-white">aperçu du bulletin</strong> avec CNSS, ITS et net à payer calculés automatiquement.',
              'Confirmez. L\'employé consulte son bulletin dans son espace <strong class="text-white">Ma Paie</strong>.',
            ]} />
            <InfoBlock type="info" title="Calculs automatiques intégrés">
              CNSS salarial & patronal, ITS par tranches, TOL, CAMU et allocations familiales sont calculés automatiquement selon les textes légaux congolais. Aucune saisie de taux requise.
            </InfoBlock>
          </section>

          {/* ═══ 14 PAIE EN MASSE ═══ */}
          <section id="paie-masse" className="mb-16 scroll-mt-24">
            <SectionHeader num="14" title="Paie en masse" badge={{ text: 'Gain de temps', type: 'optional' }} />
            <PathCrumb path="Paie → Paie en masse" />
            <GuideCard icon="⚡" title="Lancer une paie groupée" steps={[
              '<strong class="text-white">Étape 1 — Période</strong> : Choisissez le mois et l\'année de paie.',
              '<strong class="text-white">Étape 2 — Sélection</strong> : Filtrez par département ou sélectionnez tous les employés.',
              '<strong class="text-white">Étape 3 — Traitement</strong> : Konza calcule automatiquement tous les bulletins.',
              'Une fenêtre de succès récapitule la <strong class="text-white">masse salariale totale</strong>.',
              'Tous les bulletins sont disponibles dans <strong class="text-white">Paie → Historique</strong>.',
            ]} />
            <InfoBlock type="tip" title="Simulateur de paie">
              Avant de lancer la paie, utilisez <code className="bg-white/8 px-1 rounded text-cyan-300 text-xs">Paie → Simulateur</code> pour tester un scénario sans générer de bulletins réels.
            </InfoBlock>
          </section>

          {/* ═══ 15 PRÊTS & AVANCES ═══ */}
          <section id="loans" className="mb-16 scroll-mt-24">
            <SectionHeader num="15" title="Prêts & avances sur salaire" />
            <PathCrumb path="Avances & Prêts → Nouveau financement" />
            <GuideCard icon="🤝" title="Enregistrer un prêt" steps={[
              'Cliquez sur <strong class="text-white">Nouveau Financement</strong>.',
              'Sélectionnez l\'<strong class="text-white">employé bénéficiaire</strong> et le type : avance ponctuelle ou prêt échelonné.',
              'Saisissez le <strong class="text-white">montant</strong> et, pour les prêts, le nombre de mensualités.',
              'Le remboursement sera <strong class="text-white">déduit automatiquement</strong> du bulletin chaque mois.',
            ]} />
          </section>

          {/* ═══ 16 IMPAYÉS ═══ */}
          <section id="impayes" className="mb-16 scroll-mt-24">
            <SectionHeader num="16" title="Gestion des impayés" />
            <PathCrumb path="Paie → Impayés" />
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Cette section liste tous les bulletins générés dont le paiement n'a pas encore été confirmé. Marquez les paiements comme <code className="bg-white/8 px-1 rounded text-cyan-300 text-xs">Réglés</code> une fois le virement effectué.
            </p>
            <InfoBlock type="warn" title="Impact comptable">
              Un bulletin marqué comme impayé apparaît dans les rapports comptables et peut impacter la déclaration CNSS.
            </InfoBlock>
          </section>

          {/* ═══ 17 CONGÉS ═══ */}
          <section id="conges" className="mb-16 scroll-mt-24">
            <SectionHeader num="17" title="Gestion des congés" />
            <div className="grid sm:grid-cols-2 gap-4">
              <GuideCard icon="🌴" title="Employé — faire une demande" steps={[
                'Allez dans <strong class="text-white">Mes Demandes</strong>.',
                'Cliquez <strong class="text-white">Nouvelle demande</strong>, choisissez les dates.',
                'Sélectionnez le type (congé annuel, maladie…).',
                'Soumettez. Le manager est notifié.',
              ]} />
              <GuideCard icon="✅" title="Manager/Admin — valider" steps={[
                'Allez dans <strong class="text-white">Validation Congés</strong>.',
                'Consultez la liste des demandes en attente.',
                'Approuvez ou refusez avec une note.',
                'L\'employé reçoit une notification du résultat.',
              ]} />
            </div>
          </section>

          {/* ═══ 18 CNSS ═══ */}
          <section id="cnss" className="mb-16 scroll-mt-24">
            <SectionHeader num="18" title="Déclaration CNSS" />
            <PathCrumb path="Rapports → Déclarations" />
            <GuideCard icon="🏛️" title="Générer la déclaration mensuelle" steps={[
              'Assurez-vous que tous les bulletins du mois sont générés et validés.',
              'Allez dans <strong class="text-white">Déclarations</strong> et sélectionnez le mois concerné.',
              'Konza calcule automatiquement les cotisations patronales et salariales.',
              'Exportez le fichier au format requis (PDF ou Excel).',
            ]} />
          </section>

          {/* ═══ 19 RECRUTEMENT ═══ */}
          <section id="recrutement" className="mb-16 scroll-mt-24">
            <SectionHeader num="19" title="Recrutement" />
            <PathCrumb path="Recrutement" />
            <div className="grid sm:grid-cols-2 gap-4">
              <GuideCard icon="📋" title="Mode manuel" steps={[
                'Créez une <strong class="text-white">offre d\'emploi</strong> avec intitulé, description, critères.',
                'Gérez les candidatures reçues dans le kanban.',
                'Faites progresser les candidats par étapes jusqu\'à l\'embauche.',
              ]} />
              <GuideCard icon="🤖" title="Mode IA" steps={[
                'Activez le <strong class="text-white">mode IA</strong> pour un scoring automatique des CVs.',
                'L\'IA analyse les compétences et classe les candidats.',
                'Consultez les analytics pour optimiser vos offres.',
              ]} />
            </div>
          </section>

          {/* ═══ 20 FORMATION ═══ */}
          <section id="formation" className="mb-16 scroll-mt-24">
            <SectionHeader num="20" title="Formation" />
            <PathCrumb path="Formation" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Gérez le plan de formation de vos équipes : créez des sessions, assignez des participants et suivez les compétences développées. Les formations terminées sont consignées dans le dossier de chaque employé.
            </p>
          </section>

          {/* ═══ 21 MATÉRIEL ═══ */}
          <section id="materiel" className="mb-16 scroll-mt-24">
            <SectionHeader num="21" title="Gestion du matériel" />
            <PathCrumb path="Matériel" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Enregistrez les équipements attribués à chaque employé (ordinateur, véhicule, téléphone…). Lors d'une rupture de contrat, la liste du matériel à restituer est automatiquement générée.
            </p>
          </section>

          {/* ═══ FAQ ═══ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <SectionHeader num="—" title="Questions fréquentes" />
            <div className="bg-white/4 border border-white/8 rounded-2xl px-6 py-2">
              {[
                {
                  q: "Pourquoi mon bulletin de paie a un montant incorrect ?",
                  a: "Ouvrez la fiche de l'employé concerné et confirmez que son salaire de base est correct. Vérifiez ensuite les primes et déductions ajoutées manuellement. Vous pouvez modifier un bulletin déjà généré via <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Paie → [bulletin] → Modifier</code>."
                },
                {
                  q: "Un employé ne peut pas pointer en GPS — que faire ?",
                  a: "Vérifiez que la localisation GPS est activée dans <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Paramètres → Entreprise</code> et que le rayon autorisé est suffisant. Assurez-vous que l'employé autorise la géolocalisation dans son navigateur. En dernier recours, utilisez le Pointage Manuel."
                },
                {
                  q: "Comment réinitialiser le mot de passe d'un utilisateur ?",
                  a: "Allez dans <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Paramètres → Gestion Utilisateurs</code>, trouvez l'utilisateur et cliquez sur les options <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>⋯</code>. Sélectionnez 'Envoyer un lien de réinitialisation'. Le lien est valable 24h."
                },
                {
                  q: "Peut-on gérer plusieurs entreprises depuis un seul compte ?",
                  a: "Oui, via le module Cabinet. Allez dans <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Cabinet → Créer mon cabinet</code>, puis ajoutez vos PME. Chaque PME dispose de sa propre configuration, employés et paie, accessibles depuis un tableau de bord central."
                },
                {
                  q: "Comment exporter les données pour la comptabilité ?",
                  a: "Allez dans <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Rapports → Comptabilité</code>. Vous pouvez exporter le journal de paie, le récapitulatif des cotisations et le grand livre RH au format Excel ou PDF."
                },
                {
                  q: "Les données sont-elles sauvegardées automatiquement ?",
                  a: "Oui. Toutes les données sont sauvegardées en temps réel sur nos serveurs. Le mode PWA stocke temporairement les pointages en local et les synchronise dès que la connexion revient. Aucune donnée n'est perdue en cas de coupure réseau."
                },
                {
                  q: "Comment changer le logo sur les bulletins de paie ?",
                  a: "Allez dans <code class='bg-white/8 px-1 rounded text-cyan-300 text-xs'>Paramètres → Entreprise</code>, cliquez sur l'image du logo actuel pour la remplacer. Uploadez votre nouveau logo (PNG fond transparent recommandé, taille max 2 Mo). Le changement s'applique sur les prochains bulletins générés uniquement."
                },
                {
                  q: "J'assigne un shift à un employé mais je ne le vois pas dans la liste — pourquoi ?",
                  a: "L'onglet 'Employés & Plannings' affiche par défaut uniquement les employés qui ont un shift assigné. Si vous venez tout juste d'assigner, l'onglet se rafraîchit automatiquement après confirmation. Si l'employé n'apparaît toujours pas, cliquez sur le bouton rafraîchir (🔄) en haut à droite."
                },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>

          {/* Footer doc */}
          <div className="pt-8 border-t border-white/8 flex items-center justify-between text-xs text-slate-600">
            <span>Konza RH · Centre d'aide v2.0</span>
            <span>Besoin d'aide ? Contactez le support via l'application.</span>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}