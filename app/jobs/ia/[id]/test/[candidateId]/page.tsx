'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Clock, Target, CheckCircle2, Loader2, Zap, AlertTriangle, Sparkles, XCircle } from 'lucide-react';
import { api } from '@/services/api';

interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  points: number;
}

interface TestConfig {
  duration: number;
}

interface TestQuestionsResponse {
  questions: TestQuestion[];
  config: TestConfig;
}

interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeRemaining: number;
  tabSwitchCount: number;
  isStarted: boolean;
  isCompleted: boolean;
  isDisqualified: boolean;
}

const MAX_TAB_SWITCHES = 3;

export default function TestIAPage({ params }: { params: { id: string; candidateId: string } }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [testConfig, setTestConfig] = useState({ duration: 10, totalPoints: 0 });

  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 10 * 60,
    tabSwitchCount: 0,
    isStarted: false,
    isCompleted: false,
    isDisqualified: false,
  });

  const [startTime, setStartTime] = useState<number>(0);

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const completeTest = useCallback(
    async (disqualified = false) => {
      setTestState(prev => ({ ...prev, isCompleted: true, isDisqualified: disqualified }));
      exitFullscreen();

      const testDuration = Math.floor((Date.now() - startTime) / 1000);

      try {
        await api.post(`/public/jobs/${params.id}/candidates/${params.candidateId}/submit-test`, {
          answers: disqualified ? {} : testState.answers,
          tabSwitchCount: testState.tabSwitchCount,
          testDuration,
          autoDisqualified: disqualified,
        });
      } catch (e) {
        console.error('❌ Erreur envoi réponses:', e);
      }
    },
    [params.id, params.candidateId, testState.answers, testState.tabSwitchCount, startTime],
  );

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!testState.isStarted || testState.isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTestState(prev => {
          const newCount = prev.tabSwitchCount + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            // Disqualify immediately
            completeTest(true);
            return { ...prev, tabSwitchCount: newCount, isCompleted: true, isDisqualified: true };
          }
          return { ...prev, tabSwitchCount: newCount };
        });
      }
    };

    const preventCopy = (e: Event) => e.preventDefault();
    const preventContextMenu = (e: Event) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [testState.isStarted, testState.isCompleted, completeTest]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get<TestQuestionsResponse>(`/public/jobs/${params.id}/test-questions`);
      setQuestions(response.questions || []);
      const duration = response.config?.duration || 10;
      const totalPoints = response.questions?.reduce((sum: number, q: TestQuestion) => sum + q.points, 0) || 0;
      setTestConfig({ duration, totalPoints });
      setTestState(prev => ({ ...prev, timeRemaining: duration * 60 }));
    } catch (e) {
      console.error('❌ Erreur chargement questions:', e);
      alert('Erreur lors du chargement du test');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const currentIdx = testState.currentQuestionIndex;
  const total = questions.length;
  const currentQuestion = questions[currentIdx];
  const selectedAnswer = currentQuestion ? testState.answers[currentQuestion.id] : undefined;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setTestState(prev => ({ ...prev, isStarted: true }));
    setStartTime(Date.now());
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const selectAnswer = (option: string) => {
    if (!currentQuestion) return;
    setTestState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: option },
    }));
  };

  const nextQuestion = () => {
    if (currentIdx === total - 1) {
      completeTest(false);
    } else {
      setTestState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    }
  };

  useEffect(() => {
    if (!testState.isStarted || testState.isCompleted) return;

    const timer = setInterval(() => {
      setTestState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          completeTest(false);
          return { ...prev, timeRemaining: 0, isCompleted: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.isStarted, testState.isCompleted, completeTest]);

  const timeIsLow = testState.timeRemaining < 60;
  const tabsLeft = MAX_TAB_SWITCHES - testState.tabSwitchCount;

  /* ─── Loading ─────────────────────────────────────────── */
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
          <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Aucun test disponible</h1>
          <p className="text-slate-400">Cette offre ne comporte pas de test technique.</p>
        </div>
      </div>
    );
  }

  /* ─── Disqualification screen ─────────────────────────── */
  if (testState.isCompleted && testState.isDisqualified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-red-500/20 rounded-full blur-[150px] animate-pulse" />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-8 sm:p-12 text-center relative z-10 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/50"
          >
            <XCircle size={44} className="text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Test Annulé</h1>
          <p className="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed">
            Vous avez changé d'onglet <span className="text-red-400 font-bold">{MAX_TAB_SWITCHES} fois</span>. Votre test a été automatiquement annulé et votre candidature disqualifiée.
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm text-slate-300 leading-relaxed">
              Cette décision a été enregistrée. Si vous pensez qu'il s'agit d'une erreur, contactez directement le recruteur.
            </p>
          </div>
          <button
            onClick={() => { exitFullscreen(); router.push('/'); }}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  /* ─── Intro screen ────────────────────────────────────── */
  if (!testState.isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center relative z-10 shadow-2xl"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
            <BrainCircuit size={32} className="text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">Test Technique IA</h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8">Évaluez vos compétences pour finaliser votre candidature</p>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-5 mb-6 space-y-3 border border-white/5">
            <div className="flex items-center gap-4 justify-center">
              <Clock size={20} className="text-cyan-400 shrink-0" />
              <div className="text-left">
                <p className="text-slate-500 text-xs uppercase font-bold">Durée</p>
                <p className="text-white text-lg sm:text-xl font-bold">{testConfig.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <Target size={20} className="text-purple-400 shrink-0" />
              <div className="text-left">
                <p className="text-slate-500 text-xs uppercase font-bold">Questions</p>
                <p className="text-white text-lg sm:text-xl font-bold">{total} QCM ({testConfig.totalPoints} pts)</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5 mb-8 text-left">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />
              <h3 className="text-sm font-bold text-yellow-400 uppercase">Règles Anti-Triche</h3>
            </div>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>Maximum <strong className="text-yellow-300">{MAX_TAB_SWITCHES} changements</strong> d'onglet autorisés — au-delà, le test est annulé automatiquement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>Le copier-coller est désactivé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>Toute activité suspecte est signalée au recruteur</span>
              </li>
            </ul>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 sm:py-5 rounded-xl transition-all shadow-xl shadow-cyan-500/30 text-base sm:text-lg flex items-center justify-center gap-3"
          >
            <Zap size={22} />
            Commencer le Test
          </button>
        </motion.div>
      </div>
    );
  }

  /* ─── Completed screen ────────────────────────────────── */
  if (testState.isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[600px] sm:h-[600px] bg-emerald-500/20 rounded-full blur-[150px] animate-pulse" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl p-8 sm:p-12 text-center relative z-10 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/50"
          >
            <CheckCircle2 size={48} className="text-white" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">Test Terminé !</h1>
          <p className="text-slate-400 text-base sm:text-lg mb-6">Bravo ! Vos réponses ont été envoyées avec succès.</p>

          <div className="bg-black/40 backdrop-blur-sm p-5 rounded-2xl border border-white/5 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles size={22} className="text-cyan-400" />
              <p className="text-white font-bold text-base sm:text-lg">Prochaines Étapes</p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Notre IA va analyser vos résultats et calculer votre score final. Vous recevrez une notification par email sous 24-48h avec le statut de votre candidature.
            </p>
          </div>

          <button
            onClick={() => { exitFullscreen(); router.push('/'); }}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-cyan-500/30 mb-3"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => { exitFullscreen(); window.close(); }}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
          >
            Fermer cette fenêtre
          </button>
          <p className="text-xs text-slate-500 mt-5">Merci d'avoir postulé chez nous ! 🚀</p>
        </motion.div>
      </div>
    );
  }

  /* ─── Test in progress ────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header — responsive */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Test Technique</h1>
            <p className="text-slate-400 text-xs hidden sm:block">Restez concentré et bonne chance !</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Tab switch counter */}
            {testState.tabSwitchCount > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                tabsLeft <= 1
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
              }`}>
                <AlertTriangle size={14} />
                <span className="hidden sm:inline">{testState.tabSwitchCount}/{MAX_TAB_SWITCHES} changement{testState.tabSwitchCount > 1 ? 's' : ''}</span>
                <span className="sm:hidden">{testState.tabSwitchCount}/{MAX_TAB_SWITCHES}</span>
              </div>
            )}

            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl border ${
              timeIsLow
                ? 'bg-red-500/20 border-red-500/40'
                : 'bg-cyan-500/20 border-cyan-500/30'
            }`}>
              <Clock size={18} className={timeIsLow ? 'text-red-400' : 'text-cyan-400'} />
              <span className={`text-lg sm:text-2xl font-bold font-mono ${timeIsLow ? 'text-red-300' : 'text-white'}`}>
                {formatTime(testState.timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">

            {/* Progress row */}
            <div className="flex items-center justify-between mb-5 sm:mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                  <span className="text-cyan-400 font-bold text-sm sm:text-lg">{currentIdx + 1}/{total}</span>
                </div>
                <div className="bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hidden sm:block">
                  <span className="text-slate-400 text-xs sm:text-sm uppercase font-bold">Question {currentIdx + 1}</span>
                </div>
              </div>
              <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                <span className="text-purple-400 font-bold text-sm">{currentQuestion.points} pts</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/50 h-1.5 sm:h-2 rounded-full mb-6 sm:mb-10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIdx + 1) / total) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Question Text */}
            <div className="mb-6 sm:mb-10">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 sm:space-y-4">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const label = String.fromCharCode(65 + idx);

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => selectAnswer(option)}
                    className={`w-full text-left p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold shrink-0 text-sm sm:text-base ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                        {label}
                      </div>
                      <span className={`text-sm sm:text-lg font-medium leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {option}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 sm:mt-10 flex justify-end">
              <button
                onClick={nextQuestion}
                disabled={!selectedAnswer}
                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center gap-2 sm:gap-3 ${
                  selectedAnswer
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/30 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {currentIdx === total - 1 ? (
                  <>
                    <CheckCircle2 size={20} />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Switch Warning toast */}
      <AnimatePresence>
        {testState.tabSwitchCount > 0 && !testState.isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90vw] sm:w-auto"
          >
            <div className={`backdrop-blur-xl border px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl text-center sm:text-left ${
              tabsLeft <= 1
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-yellow-500/20 border-yellow-500/50'
            }`}>
              <p className={`font-bold flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
                tabsLeft <= 1 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                <AlertTriangle size={18} />
                {tabsLeft <= 1
                  ? `⚠️ Dernier avertissement ! Encore 1 changement = disqualification`
                  : `${testState.tabSwitchCount}/${MAX_TAB_SWITCHES} changement${testState.tabSwitchCount > 1 ? 's' : ''} d'onglet détecté${testState.tabSwitchCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}