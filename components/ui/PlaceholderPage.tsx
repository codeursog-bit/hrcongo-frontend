
import React from 'react';
import { LucideIcon, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 relative"
      >
        <div className="absolute inset-0 border-4 border-sky-100 dark:border-sky-900/30 rounded-full animate-ping opacity-20"></div>
        <Icon size={48} className="text-gray-400 dark:text-gray-500" />
        <div className="absolute -bottom-2 -right-2 bg-sky-500 text-white p-2 rounded-full border-4 border-white dark:border-gray-900">
          <Construction size={20} />
        </div>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {title}
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <button className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform">
          Me prévenir
        </button>
        <button className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </button>
      </motion.div>
    </div>
  );
};
