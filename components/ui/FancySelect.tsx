'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Option {
  value: string;
  label: string;
  icon?: any;
}

interface FancySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: any;
  className?: string;
}

export const FancySelect: React.FC<FancySelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Sélectionner...", 
  icon: Icon,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px de gap
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Fermer si on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer au scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const DropdownPortal = () => {
    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999
            }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          >
            <div className="p-2 space-y-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      {option.label}
                    </div>
                    {isSelected && <Check size={16} className="text-sky-500" />}
                  </button>
                );
              })}
              {options.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 italic">Aucune option</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300
          bg-white dark:bg-gray-800/50 backdrop-blur-md
          ${isOpen 
            ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10' 
            : 'border-gray-200 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500/50'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && (
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} transition-colors`}>
              <Icon size={18} />
            </div>
          )}
          <span className={`text-sm font-medium truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} 
        />
      </button>

      <DropdownPortal />
    </div>
  );
};
// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { ChevronDown, Check } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface Option {
//   value: string;
//   label: string;
//   icon?: any; // Composant Lucide ou autre
// }

// interface FancySelectProps {
//   label?: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: Option[];
//   placeholder?: string;
//   icon?: any; // Icone principale du champ
//   className?: string;
// }

// export const FancySelect: React.FC<FancySelectProps> = ({ 
//   label, 
//   value, 
//   onChange, 
//   options, 
//   placeholder = "Sélectionner...", 
//   icon: Icon,
//   className 
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Fermer si on clique dehors
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const selectedOption = options.find(opt => opt.value === value);

//   return (
//     <div className={`relative ${className}`} ref={containerRef}>
//       {label && <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      
//       <button
//         type="button"
//         onClick={() => setIsOpen(!isOpen)}
//         className={`
//           w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300
//           bg-white dark:bg-gray-800/50 backdrop-blur-md
//           ${isOpen 
//             ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10' 
//             : 'border-gray-200 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500/50'}
//         `}
//       >
//         <div className="flex items-center gap-3 overflow-hidden">
//           {Icon && (
//             <div className={`p-2 rounded-lg ${isOpen ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} transition-colors`}>
//               <Icon size={18} />
//             </div>
//           )}
//           <span className={`text-sm font-medium truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
//             {selectedOption ? selectedOption.label : placeholder}
//           </span>
//         </div>
//         <ChevronDown 
//           size={18} 
//           className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} 
//         />
//       </button>

//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.98 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.98 }}
//             transition={{ duration: 0.2 }}
//             className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
//           >
//             <div className="p-2 space-y-1">
//               {options.map((option) => {
//                 const isSelected = option.value === value;
//                 return (
//                   <button
//                     key={option.value}
//                     type="button"
//                     onClick={() => {
//                       onChange(option.value);
//                       setIsOpen(false);
//                     }}
//                     className={`
//                       w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all
//                       ${isSelected 
//                         ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' 
//                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
//                     `}
//                   >
//                     <div className="flex items-center gap-3">
//                         {/* Petit indicateur visuel optionnel */}
//                         <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
//                         {option.label}
//                     </div>
//                     {isSelected && <Check size={16} className="text-sky-500" />}
//                   </button>
//                 );
//               })}
//               {options.length === 0 && (
//                   <div className="p-4 text-center text-xs text-gray-400 italic">Aucune option</div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };
