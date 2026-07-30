
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ErrorLayoutProps {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  gradient?: string;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({ 
  code, 
  title, 
  description, 
  icon: Icon, 
  children,
  gradient = "from-sky-500 to-emerald-500"
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full text-center">
        
        {/* Illustration Area */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-40 h-40 mx-auto mb-8"
        >
          <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} opacity-20 rounded-full blur-2xl animate-pulse`}></div>
          <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
            <Icon size={64} className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient}`} />
          </div>
          {/* Decorative small bubbles */}
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 3 }}
            className={`absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white dark:border-gray-900 text-sm`}
          >
            {code}
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            {title}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {children}
          </div>
        </motion.div>

        {/* Footer Brand */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-gray-300 dark:text-gray-700 font-bold uppercase tracking-widest text-xs"
        >
          HRCongo System
        </motion.div>
      </div>
    </div>
  );
};
