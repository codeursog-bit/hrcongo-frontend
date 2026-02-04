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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Fermer si on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fermer au scroll de la page
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    console.log('Option clicked:', optionValue); // Debug
    onChange(optionValue);
    setIsOpen(false);
  };

  const DropdownPortal = () => {
    if (typeof window === 'undefined' || !isOpen) return null;

    return createPortal(
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 99999,
          maxHeight: '300px',
          pointerEvents: 'auto' // IMPORTANT !
        }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-y-auto"
      >
        <div className="p-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Empêche la perte de focus
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer
                  ${isSelected 
                    ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
              >
                <span className="text-left">{option.label}</span>
                {isSelected && <Check size={16} className="text-sky-500 flex-shrink-0" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">Aucune option</div>
          )}
        </div>
      </motion.div>,
      document.body
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all
          bg-white dark:bg-gray-800
          ${isOpen 
            ? 'border-sky-500 ring-2 ring-sky-500/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-sky-400'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && (
            <Icon size={18} className={isOpen ? 'text-sky-500' : 'text-gray-400'} />
          )}
          <span className={`text-sm font-medium truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && <DropdownPortal />}
      </AnimatePresence>
    </div>
  );
};