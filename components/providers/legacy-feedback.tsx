'use client';
// Rendu antérieur réservé à /admin et /cabinet. Ne pas moderniser pendant cette phase.
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, UserCheck, GraduationCap, FileText, Ticket, Calendar, AlarmClock, Clock3, ShieldAlert, ArrowRight, MessageCircle, Heart } from 'lucide-react';
type AlertType = 'success' | 'error' | 'warning' | 'info';
interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}
export function LegacyAlerts({alerts,removeAlert}:{alerts:Alert[];removeAlert:(id:string)=>void}) {
const getAlertConfig = (type: AlertType) => {
    const configs = {
      success: {
        icon: CheckCircle,
        bgGradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-900 dark:text-emerald-100',
        iconColor: 'text-emerald-600 dark:text-emerald-400'
      },
      error: {
        icon: XCircle,
        bgGradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-900 dark:text-red-100',
        iconColor: 'text-red-600 dark:text-red-400'
      },
      warning: {
        icon: AlertTriangle,
        bgGradient: 'from-orange-500 to-amber-600',
        bgLight: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-900 dark:text-orange-100',
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      info: {
        icon: Info,
        bgGradient: 'from-sky-500 to-blue-600',
        bgLight: 'bg-sky-50 dark:bg-sky-900/20',
        borderColor: 'border-sky-200 dark:border-sky-800',
        textColor: 'text-sky-900 dark:text-sky-100',
        iconColor: 'text-sky-600 dark:text-sky-400'
      }
    };
    return configs[type];
  };
return (<div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`
                  pointer-events-auto
                  ${config.bgLight}
                  backdrop-blur-xl
                  border-2 ${config.borderColor}
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  relative
                  group
                `}
              >
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: (alert.duration || 4000) / 1000, ease: 'linear' }}
                  className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${config.bgGradient}`}
                />

                <div className="p-4 flex gap-4 items-start">
                  <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className={`font-bold text-sm ${config.textColor} mb-1`}>
                      {alert.title}
                    </h4>
                    {alert.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {alert.message}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeAlert(alert.id)}
                    className={`shrink-0 p-1.5 rounded-lg ${config.iconColor} hover:bg-white/20 dark:hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>);
}
type NotificationType = 'CHECK_IN' | 'ALERT' | 'INFO' | 'TRAINING' | 'SUCCESS' | 'ABSENCE' | 'PERMISSION' | 'LEAVE';
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  time: string;
  link?: string; // chemin (relatif, sans basePath) vers la page de gestion concernée
}
export function LegacyNotifications({notifications,handleClick,muteForToday,removeNotification}:{notifications:Notification[];handleClick:(n:Notification)=>void;muteForToday:()=>void;removeNotification:(id:string)=>void}){
const iconFor = (n: Notification) => {
    if (n.avatar) return <img src={n.avatar} className="w-full h-full rounded-full object-cover" alt="" />;
    if (n.type === 'SUCCESS') return <CheckCircle size={22} />;
    if (n.type === 'ABSENCE') return <FileText size={22} />;
    if (n.type === 'PERMISSION') return <Ticket size={22} />;
    if (n.type === 'LEAVE') return <Calendar size={22} />;
    if (n.title?.includes('Formation')) return <GraduationCap size={22} />;
    if (n.type === 'ALERT') return <AlertTriangle size={22} />;
    if (n.type === 'INFO') return <Info size={22} />;
    return <UserCheck size={22} />;
  };
const colorFor = (n: Notification) => {
    if (n.type === 'ALERT') return { bg: 'bg-red-100 text-red-600', bar: 'bg-red-500' };
    if (n.type === 'SUCCESS') return { bg: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' };
    if (n.type === 'ABSENCE') return { bg: 'bg-orange-100 text-orange-600', bar: 'bg-orange-500' };
    if (n.type === 'PERMISSION') return { bg: 'bg-violet-100 text-violet-600', bar: 'bg-violet-500' };
    if (n.type === 'LEAVE') return { bg: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' };
    return { bg: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' };
  };
return (<div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => {
            const c = colorFor(n);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                layout
                onClick={() => handleClick(n)}
                className={`pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-4 rounded-2xl shadow-2xl shadow-sky-500/10 flex gap-4 relative overflow-hidden group ${n.link ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}`}
              >
                <motion.div
                  initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 12, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${c.bar}`}
                />

                <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${c.bg}`}>
                  {iconFor(n)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</h4>
                    <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug font-medium">{n.message}</p>

                  <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.link && <span className="text-[10px] font-bold text-sky-500">Voir →</span>}
                    <button onClick={(e) => { e.stopPropagation(); muteForToday(); }} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      Ne plus afficher ajd.
                    </button>
                  </div>
                </div>

                <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>);
}
interface ReminderToastProps {
  visible: boolean;
  urgency: 'info' | 'warning';
  daysLeft: number;
  kind: 'essai' | 'abonnement';
  onClose: () => void;
  onRenew: () => void;
}
interface ReminderModalProps {
  isOpen: boolean;
  kind: 'essai' | 'abonnement';
  planName?: string;
  onClose: () => void;
  onRenew: () => void;
}
export const LegacyReminderToast: React.FC<ReminderToastProps> = ({
  visible,
  urgency,
  daysLeft,
  kind,
  onClose,
  onRenew,
}) => {
  const isWarning = urgency === 'warning';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, x: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-4 right-4 z-[9997] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10 relative overflow-hidden">
            <div
              className={`absolute inset-0 pointer-events-none ${
                isWarning
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5'
                  : 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5'
              }`}
            />
            <div className="relative z-10 flex gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isWarning
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                }`}
              >
                {isWarning ? (
                  <AlarmClock size={18} className="text-white" />
                ) : (
                  <Clock3 size={18} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {kind === 'essai' ? 'Votre essai gratuit' : 'Votre abonnement'} se
                  termine dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Pensez à renouveler pour ne pas perdre l'accès complet.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={onRenew}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-[1.03] ${
                      isWarning
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                  >
                    Renouveler
                  </button>
                  <button
                    onClick={onClose}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 transition-colors h-fit"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export const LegacyLastCallModal: React.FC<ReminderModalProps> = ({
  isOpen,
  kind,
  planName,
  onClose,
  onRenew,
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md pointer-events-auto"
          >
            <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10 pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-10"
              >
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>

              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <ShieldAlert size={32} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 text-slate-900 dark:text-white">
                  Dernier jour avant échéance
                </h3>
                <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
                  {kind === 'essai'
                    ? "Votre essai gratuit se termine demain."
                    : `Votre abonnement ${planName ? `« ${planName} »` : ''} se termine demain.`}{' '}
                  Sans renouvellement, votre entreprise repassera automatiquement sur le
                  plan Gratuit : ajout d'employé, paie groupée et pointage au-delà du
                  quota inclus seront alors limités pour votre équipe.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={onRenew}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Renouveler maintenant
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
export function LegacyEndedBanner({visible,isAdmin,planName,close,goRenew}:{visible:boolean;isAdmin:boolean;planName?:string;close:()=>void;goRenew:()=>void}) { return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -40, y: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="fixed bottom-4 left-4 z-[9996] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10 relative overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-400/10 via-pink-400/5 to-amber-300/10" />

            <div className="relative z-10 flex gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-amber-400">
                <Heart size={18} className="text-white" fill="white" />
              </div>

              <div className="flex-1 min-w-0">
                {isAdmin ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Votre abonnement est terminé
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Certaines fonctionnalités sont désormais limitées{planName ? ` (retour au plan ${planName})` : ''}.
                      Réactivez votre abonnement quand vous voulez pour retrouver un accès complet, en toute tranquillité.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={goRenew}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-rose-400 to-amber-400 transition-transform hover:scale-[1.03] flex items-center gap-1"
                      >
                        Renouveler
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={close}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                      >
                        Plus tard
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Un petit mot de votre entreprise
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      L'abonnement de votre entreprise est arrivé à échéance et certaines actions sont
                      temporairement limitées. N'hésitez pas à contacter votre RH ou administrateur pour
                      en savoir plus.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={close}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-rose-400 to-amber-400 transition-transform hover:scale-[1.03]"
                      >
                        J'ai compris
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={close}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 transition-colors h-fit"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ); }
interface BlockedDetail {
  message: string;
  audience: 'ADMIN' | 'EMPLOYEE';
}
export function LegacyBlockedModal({detail,isAdmin,close,goToSubscription}:{detail:BlockedDetail|null;isAdmin:boolean;close:()=>void;goToSubscription:()=>void}) { return (
    <AnimatePresence>
      {detail && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white dark:bg-slate-900 border border-white/20 dark:border-white/10 shadow-2xl">
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isAdmin
                      ? 'bg-gradient-to-br from-orange-500/10 via-red-500/5 to-amber-500/10'
                      : 'bg-gradient-to-br from-slate-500/10 via-slate-400/5 to-slate-500/10'
                  }`}
                />

                <button
                  onClick={close}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/60 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors z-10"
                >
                  <X size={18} className="text-slate-600 dark:text-slate-400" />
                </button>

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                      isAdmin
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/20'
                        : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
                    }`}
                  >
                    {isAdmin ? (
                      <AlertTriangle size={30} className="text-white" />
                    ) : (
                      <MessageCircle size={30} className="text-white" />
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">
                    {isAdmin ? 'Action bloquée' : 'Accès bloqué'}
                  </h3>

                  <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                    {detail.message}
                  </p>

                  <div className="space-y-3">
                    {isAdmin ? (
                      <button
                        onClick={goToSubscription}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                      >
                        Gérer mon abonnement
                        <ArrowRight size={17} />
                      </button>
                    ) : null}
                    <button
                      onClick={close}
                      className="w-full py-3 px-4 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                    >
                      {isAdmin ? 'Plus tard' : "J'ai compris"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  ); }

export function LegacySlideOver({
  open, onClose, title, subtitle, children, widthClass = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-0 right-0 h-full w-full ${widthClass} bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400 truncate">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
