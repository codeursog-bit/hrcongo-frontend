'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, CheckCircle2, Shield, Clock, Zap, 
  Menu, X, Play, Hexagon, CreditCard, Layout, Globe, Star
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- Components (Navbar locale pour la landing, à extraire idéalement) ---

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Hexagon size={24} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">HRCongo</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Témoignages</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-900 font-bold hover:text-sky-600 transition-colors">
              Se connecter
            </Link>
            <Link 
              href="/auth/register"
              className="px-5 py-2.5 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-900/20"
            >
              Essai Gratuit
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full px-4 py-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Fonctionnalités</a>
            <a href="#pricing" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Tarifs</a>
            <Link href="/auth/login" className="text-gray-900 font-bold" onClick={() => setIsOpen(false)}>Se connecter</Link>
            <Link href="/auth/register" className="bg-sky-500 text-white px-4 py-3 rounded-xl text-center font-bold" onClick={() => setIsOpen(false)}>
              Commencer maintenant
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group"
  >
    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-sky-600 transition-colors">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </motion.div>
);

const PricingCard = ({ tier, price, features, recommended, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`
      relative p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full
      ${recommended 
        ? 'border-sky-500 bg-white shadow-2xl shadow-sky-500/20 scale-105 z-10' 
        : 'border-gray-200 bg-white hover:border-sky-300 hover:shadow-xl'}
    `}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
        Recommandé
      </div>
    )}
    
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{tier}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-gray-900">{price}</span>
        {price !== 'Sur devis' && <span className="text-gray-500 font-medium">/mois</span>}
      </div>
      <p className="text-sm text-gray-500 mt-2">Pour les PME en croissance</p>
    </div>

    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feat: string, i: number) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          {feat}
        </li>
      ))}
    </ul>

    <Link href="/auth/register" className={`
      w-full py-4 rounded-xl font-bold text-center transition-all
      ${recommended 
        ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:shadow-lg hover:scale-[1.02]' 
        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
    `}>
      Choisir {tier}
    </Link>
  </motion.div>
);

const StepCard = ({ number, title, desc, image }: any) => (
  <div className="flex flex-col md:flex-row items-center gap-12 mb-24 last:mb-0">
    <div className={`flex-1 ${number % 2 === 0 ? 'md:order-2' : ''}`}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 text-sky-600 font-bold text-xl mb-6">
        {number}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-lg text-gray-500 leading-relaxed mb-6">
        {desc}
      </p>
      <div className="flex items-center gap-2 text-sky-600 font-bold cursor-pointer hover:gap-4 transition-all">
        Voir comment faire <ArrowRight size={18} />
      </div>
    </div>
    <div className={`flex-1 ${number % 2 === 0 ? 'md:order-1' : ''}`}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
      >
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="aspect-video bg-gray-100 relative overflow-hidden group">
           <div className="absolute inset-0 flex items-center justify-center">
              {image === 'setup' && <Layout size={64} className="text-gray-300" />}
              {image === 'payroll' && <CreditCard size={64} className="text-gray-300" />}
              {image === 'report' && <Globe size={64} className="text-gray-300" />}
           </div>
           <div className="absolute inset-4 bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 opacity-90">
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="flex-1"></div>
              <div className="h-10 bg-sky-500 rounded-lg w-full opacity-20"></div>
           </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div>
      <Navbar />

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-sky-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-sky-700 font-bold text-sm mb-8 border border-sky-100"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Nouveau : Barèmes ITS 2025 intégrés
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6"
            >
              La Paie Congolaise,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">Enfin Simplifiée.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Générez vos bulletins conformes CNSS & ITS en quelques clics. 
              Fini Excel, fini les erreurs. Concentrez-vous sur vos équipes.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold text-lg shadow-xl shadow-sky-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Essayer Gratuitement <ArrowRight size={20} />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Play size={20} className="fill-current" /> Voir la démo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 flex items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
            >
               <span className="font-bold text-xl text-gray-400">TotalEnergies</span>
               <span className="font-bold text-xl text-gray-400">MTN Congo</span>
               <span className="font-bold text-xl text-gray-400">Canal+</span>
               <span className="font-bold text-xl text-gray-400">Bolloré</span>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 overflow-hidden">
         <div className="max-w-7xl mx-auto px-4">
            <motion.div 
               style={{ y }}
               className="relative rounded-3xl shadow-2xl border-8 border-white bg-white overflow-hidden max-w-5xl mx-auto"
            >
               <img 
                  src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?q=80&w=2070&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto opacity-90"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent flex items-end justify-center pb-10">
                  <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl flex items-center gap-6">
                     <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Masse Salariale</p>
                        <p className="text-2xl font-bold text-gray-900">15.8 M</p>
                     </div>
                     <div className="w-px h-10 bg-gray-200"></div>
                     <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Employés</p>
                        <p className="text-2xl font-bold text-gray-900">48</p>
                     </div>
                     <div className="w-px h-10 bg-gray-200"></div>
                     <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
                        <CheckCircle2 size={20} /> Paie Validée
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sky-500 font-bold tracking-wide uppercase text-sm mb-3">Pourquoi HRCongo ?</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 mb-6">Tout ce dont vous avez besoin pour gérer vos équipes.</h3>
            <p className="text-xl text-gray-500">
               Une plateforme conçue spécifiquement pour le contexte légal et fiscal du Congo-Brazzaville.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Shield} 
              title="100% Conforme" 
              desc="Barèmes ITS, CNSS patronale et salariale mis à jour automatiquement. Génération des déclarations officielles."
              delay={0.1}
            />
            <FeatureCard 
              icon={Zap} 
              title="Paie en 30 Minutes" 
              desc="Automatisez les calculs, les fiches de paie et les virements. Gagnez 15h de travail par mois."
              delay={0.2}
            />
            <FeatureCard 
              icon={Clock} 
              title="Gestion des Temps" 
              desc="Suivi des présences, congés et heures supplémentaires connecté directement à la paie."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
               <h2 className="text-3xl font-bold text-gray-900">Comment ça marche ?</h2>
            </div>
            
            <div className="max-w-5xl mx-auto">
               <StepCard 
                  number={1} 
                  title="Importez vos employés" 
                  desc="Ajoutez vos collaborateurs un par un ou importez un fichier Excel. Nous configurons automatiquement les profils fiscaux."
                  image="setup"
               />
               <StepCard 
                  number={2} 
                  title="Saisissez les variables" 
                  desc="Primes, absences, heures supplémentaires... Saisissez-les en quelques clics ou laissez les employés faire leurs demandes."
                  image="payroll"
               />
               <StepCard 
                  number={3} 
                  title="Générez et Payez" 
                  desc="Validez la paie. Le système génère les bulletins PDF, les ordres de virement et les déclarations fiscales instantanément."
                  image="report"
               />
            </div>
         </div>
      </section>

      <section id="pricing" className="py-24 bg-white relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Des tarifs transparents</h2>
               <p className="text-xl text-gray-500">Pas de frais cachés. Annulez à tout moment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
               <PricingCard 
                  tier="Découverte"
                  price="Gratuit"
                  features={['Jusqu\'à 5 employés', 'Calcul de paie basique', 'Bulletins PDF', 'Support Email']}
                  delay={0.1}
               />
               <PricingCard 
                  tier="PME Standard"
                  price="15.000 F"
                  features={['Jusqu\'à 20 employés', 'Déclarations CNSS & ITS', 'Gestion des Congés', 'Support Prioritaire', 'Export Excel']}
                  recommended={true}
                  delay={0.2}
               />
               <PricingCard 
                  tier="Entreprise"
                  price="45.000 F"
                  features={['Employés illimités', 'Gestion des Temps & Pointage', 'Rapports Avancés', 'API Access', 'Account Manager dédié']}
                  delay={0.3}
               />
            </div>
         </div>
      </section>

      <section id="testimonials" className="py-24 bg-sky-900 text-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-bold mb-8">Ils nous font confiance.</h2>
                  <p className="text-xl text-sky-100 mb-8 leading-relaxed">
                     "Depuis que nous utilisons HRCongo, la paie n'est plus une corvée de 3 jours mais une formalité de 2 heures. La conformité avec les impôts est un vrai soulagement."
                  </p>
                  <div>
                     <p className="font-bold text-lg">Patrick Okemba</p>
                     <p className="text-sky-300">DG, TechSolutions Brazza</p>
                  </div>
                  <div className="flex gap-2 mt-6">
                     {[1,2,3,4,5].map(i => <Star key={i} className="fill-yellow-400 text-yellow-400" size={20} />)}
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-800/50 p-6 rounded-2xl backdrop-blur-sm border border-sky-700/50">
                     <p className="italic text-sm mb-4">"Interface incroyable, mes employés adorent pouvoir télécharger leurs bulletins eux-mêmes."</p>
                     <p className="font-bold text-xs">Sarah M.</p>
                  </div>
                  <div className="bg-sky-800/50 p-6 rounded-2xl backdrop-blur-sm border border-sky-700/50 mt-8">
                     <p className="italic text-sm mb-4">"Le support client est très réactif et connaît vraiment la loi congolaise."</p>
                     <p className="font-bold text-xs">Jean-Claude N.</p>
                  </div>
                  <div className="bg-sky-800/50 p-6 rounded-2xl backdrop-blur-sm border border-sky-700/50">
                     <p className="italic text-sm mb-4">"Le meilleur investissement RH que nous ayons fait cette année."</p>
                     <p className="font-bold text-xs">Marie-France L.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <section className="py-24 bg-white text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Prêt à simplifier votre gestion RH ?</h2>
            <p className="text-xl text-gray-500 mb-10">Rejoignez plus de 500 entreprises congolaises modernes.</p>
            <Link 
               href="/auth/register"
               className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-full font-bold text-xl shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-105"
            >
               Commencer l'essai gratuit <ArrowRight size={24} />
            </Link>
            <p className="mt-4 text-sm text-gray-400">30 jours offerts • Sans carte bancaire • Annulation facile</p>
         </div>
      </section>

      <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                        <Hexagon size={18} fill="currentColor" />
                     </div>
                     <span className="text-lg font-bold text-gray-900">HRCongo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                     La solution RH de référence pour les entreprises du Congo-Brazzaville.
                  </p>
                  <div className="flex gap-4">
                     <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-sky-500 transition-colors cursor-pointer"></div>
                     <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-sky-500 transition-colors cursor-pointer"></div>
                     <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-sky-500 transition-colors cursor-pointer"></div>
                  </div>
               </div>
               
               <div>
                  <h4 className="font-bold text-gray-900 mb-4">Produit</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                     <li><a href="#" className="hover:text-sky-600">Fonctionnalités</a></li>
                     <li><a href="#" className="hover:text-sky-600">Tarifs</a></li>
                     <li><a href="#" className="hover:text-sky-600">Mises à jour</a></li>
                     <li><a href="#" className="hover:text-sky-600">Sécurité</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-gray-900 mb-4">Ressources</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                     <li><a href="#" className="hover:text-sky-600">Blog RH</a></li>
                     <li><a href="#" className="hover:text-sky-600">Guide CNSS</a></li>
                     <li><a href="#" className="hover:text-sky-600">Simulateur Salaire</a></li>
                     <li><a href="#" className="hover:text-sky-600">Centre d'aide</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-gray-900 mb-4">Paiements Acceptés</h4>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold border border-red-200">Airtel Money</span>
                     <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold border border-yellow-200">MTN MoMo</span>
                     <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200">Visa / MC</span>
                  </div>
               </div>
            </div>
            
            <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
               <p>&copy; 2025 HRCongo S.A.R.L. Tous droits réservés.</p>
               <div className="flex gap-6">
                  <a href="#" className="hover:text-gray-900">Confidentialité</a>
                  <a href="#" className="hover:text-gray-900">CGU</a>
                  <a href="#" className="hover:text-gray-900">Mentions Légales</a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}

