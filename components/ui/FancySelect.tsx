'use client';

// components/ui/FancySelect.tsx
// Liste déroulante de l'application. Même rendu que SearchSelect, PeriodSelector et les champs
// (voir select.css). Dans un <dialog>, le portail reste dans sa couche modale ;
// il s'ouvre vers le haut quand il manque de place en bas. Clavier : ↑ ↓ Début Fin Entrée Échap.
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import './select.css';

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

const MENU_MAX = 300;

export const FancySelect: React.FC<FancySelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  icon: Icon,
  className = '',
}) => {
  const uid = useId();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number }>({ left: 0, width: 0, top: 0, maxHeight: MENU_MAX });
  // Le portail ne se monte que côté client (évite l'erreur d'hydratation).
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const wanted = Math.min(MENU_MAX, options.length * 44 + 16);
    // In a dialog, prefer a scrollable menu below the field when three rows
    // fit, rather than jumping above the dialog for a few missing pixels.
    const minimumBelow = buttonRef.current?.closest('dialog') ? Math.min(wanted, 3 * 44 + 16) : wanted;
    const up = below < minimumBelow && above > below;
    setPos(up
      ? { left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 8, maxHeight: Math.min(MENU_MAX, above) }
      : { left: rect.left, width: rect.width, top: rect.bottom + 8, maxHeight: Math.min(MENU_MAX, Math.max(120, below)) });
  }, [options.length]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openMenu = useCallback(() => {
    place();
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [place, selectedIndex]);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onScroll = (event: Event) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const onResize = () => setIsOpen(false);
    const ownerDialog = buttonRef.current?.closest('dialog');
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    if (ownerDialog) observer?.observe(ownerDialog);
    if (buttonRef.current) observer?.observe(buttonRef.current);
    ownerDialog?.addEventListener('animationend', place);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
      ownerDialog?.removeEventListener('animationend', place);
    };
  }, [isOpen, place]);

  useEffect(() => {
    if (!isOpen) return;
    const menu = dropdownRef.current;
    const option = document.getElementById(`${uid}-opt-${active}`);
    if (!menu || !option) return;
    // Scroll only the list: scrollIntoView can also move the dialog or the page,
    // invalidating the position measured when the menu opened.
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  }, [active, isOpen, uid]);

  const choose = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!options.length) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) openMenu(); else setActive((i) => (i + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) openMenu(); else setActive((i) => (i - 1 + options.length) % options.length);
        break;
      case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
      case 'End': if (isOpen) { e.preventDefault(); setActive(options.length - 1); } break;
      case 'Enter':
      case ' ':
        if (isOpen) { e.preventDefault(); choose(options[active].value); }
        break;
      case 'Escape':
        if (isOpen) { e.preventDefault(); e.stopPropagation(); close(); }
        break;
      case 'Tab':
        if (isOpen) close();
        break;
    }
  };

  const listId = `${uid}-list`;
  // A body portal is behind a native modal's top layer and is inert there,
  // regardless of z-index. Keep the menu in the owning dialog instead.
  const portalHost = mounted ? buttonRef.current?.closest('dialog') || document.body : null;

  return (
    <div className={`k-select ${className}`} ref={containerRef}>
      {label && <label className="k-select-label" htmlFor={`${uid}-btn`}>{label}</label>}

      <button
        id={`${uid}-btn`}
        ref={buttonRef}
        type="button"
        className="k-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen ? `${uid}-opt-${active}` : undefined}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isOpen) close(); else openMenu();
        }}
      >
        {Icon && <Icon size={18} strokeWidth={1.5} className="k-select-icon" aria-hidden="true" />}
        <span className={`k-select-value ${selectedOption ? '' : 'is-placeholder'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} strokeWidth={1.5} className="k-select-chevron" aria-hidden="true" />
      </button>

      {/* The portal shares the native dialog's focus and stacking context. */}
      {portalHost && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              id={listId}
              role="listbox"
              aria-label={label || placeholder}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.15 }}
              onWheel={(e) => e.stopPropagation()}
              className="k-select-menu"
              style={{
                position: 'fixed',
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
                zIndex: 99999,
                pointerEvents: 'auto',
              }}
            >
              {options.map((option, i) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    id={`${uid}-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={i === active}
                    tabIndex={-1}
                    className="k-select-option"
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      choose(option.value);
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} strokeWidth={2} aria-hidden="true" />}
                  </button>
                );
              })}
              {options.length === 0 && <p className="k-select-empty">Aucune option</p>}
            </motion.div>
          )}
        </AnimatePresence>,
        portalHost
      )}
    </div>
  );
};
