'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Clock, Target, CheckCircle2, Loader2, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '@/services/api';

interface TestQuestion {
  id: string;
  text: string;
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
}

export default function TestIAPage({ params }: { params: { id: string; candidateId: string } }) {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [testConfig, setTestConfig] = useState({ duration: 30, totalPoints: 0 });

  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 30 * 60,
    tabSwitchCount: 0,
    isStarted: false,
    isCompleted: false
  });

  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    fetchQuestions();
    
    // Anti-triche : Détection changement d'onglet
    const handleVisibilityChange = () => {
      if (document.hidden && testState.isStarted && !testState.isCompleted) {
        setTestState(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount + 1 }));
      }
    };

    // Désactiver copier-coller
    const preventCopy = (e: Event) => e.preventDefault();
    const preventContextMenu = (e: Event) => e.preventDefault();

    if (testState.isStarted && !testState.isCompleted) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('copy', preventCopy);
      document.addEventListener('paste', preventCopy);
      document.addEventListener('contextmenu', preventContextMenu);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [testState.isStarted, testState.isCompleted]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get<TestQuestionsResponse>(`/public/jobs/${params.id}/test-questions`);
      setQuestions(response.questions || []);
      const duration = response.config?.duration || 30;
      const totalPoints = response.questions?.reduce((sum: number, q: TestQuestion) => sum + q.points, 0) || 0;
      setTestConfig({ duration, totalPoints });
      setTestState(prev => ({ ...prev, timeRemaining: duration * 60 }));
    } catch (e) {
      console.error(e);
      alert("Erreur lors du chargement du test");
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

  const completeTest = useCallback(async () => {
    setTestState(prev => ({ ...prev, isCompleted: true }));
    
    const testDuration = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await api.post(`/public/jobs/${params.id}/candidates/${params.candidateId}/submit-test`, {
        answers: testState.answers,
        tabSwitchCount: testState.tabSwitchCount,
        testDuration
      });
    } catch (e) {
      console.error("Erreur envoi réponses:", e);
    }
  }, [params.id, params.candidateId, testState.answers, testState.tabSwitchCount, startTime]);

  const selectAnswer = (option: string) => {
    setTestState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: option }
    }));
  };

  const nextQuestion = () => {
    if (currentIdx === total - 1) {
      completeTest();
    } else {
      setTestState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    }
  };

  // Timer
  useEffect(() => {
    if (!testState.isStarted || testState.isCompleted) return;
    
    const timer = setInterval(() => {
      setTestState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          completeTest();
          return { ...prev, timeRemaining: 0, isCompleted: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.isStarted, testState.isCompleted, completeTest]);

  // LOADING
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  // PAS DE QUESTIONS
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Aucun test disponible</h1>
          <p className="text-slate-400">Cette offre ne comporte pas de test technique.</p>
        </div>
      </div>
    );
  }

  // ÉCRAN D'ACCUEIL
  if (!testState.isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center relative z-10 shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
            <BrainCircuit size={40} className="text-white" />
          </div>
          
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Test Technique IA</h1>
          <p className="text-slate-400 text-lg mb-10">Évaluez vos compétences pour finaliser votre candidature</p>
          
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 space-y-4 border border-white/5">
            <div className="flex items-center gap-4 justify-center">
              <Clock size={24} className="text-cyan-400" />
              <div className="text-left">
                <p className="text-slate-500 text-xs uppercase font-bold">Durée</p>
                <p className="text-white text-xl font-bold">{testConfig.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <Target size={24} className="text-purple-400" />
              <div className="text-left">
                <p className="text-slate-500 text-xs uppercase font-bold">Questions</p>
                <p className="text-white text-xl font-bold">{total} QCM ({testConfig.totalPoints} pts)</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={20} className="text-yellow-400 mt-0.5 shrink-0"/>
              <h3 className="text-sm font-bold text-yellow-400 uppercase">Règles Anti-Triche</h3>
            </div>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Ne changez pas d'onglet pendant le test</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Le copier-coller est désactivé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Toute activité suspecte sera signalée</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={startTest} 
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-cyan-500/30 text-lg flex items-center justify-center gap-3"
          >
            <Zap size={24}/>
            Commencer le Test
          </button>
        </motion.div>
      </div>
    );
  }

  // ÉCRAN FIN
  if (testState.isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        
        {/* Success Glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px] animate-pulse"></div>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl p-12 text-center relative z-10 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/50"
          >
            <CheckCircle2 size={56} className="text-white" />
          </motion.div>
          
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Test Terminé !</h1>
          <p className="text-slate-400 text-lg mb-6">
            Bravo ! Vos réponses ont été envoyées avec succès.
          </p>
          
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles size={24} className="text-cyan-400"/>
              <p className="text-white font-bold text-lg">Prochaines Étapes</p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Notre IA va maintenant analyser vos résultats et calculer votre score final. 
              Vous recevrez une notification par email sous 24-48h avec le statut de votre candidature.
            </p>
          </div>

          <button 
            onClick={() => window.close()} 
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
          >
            Fermer cette fenêtre
          </button>
          
          <p className="text-xs text-slate-500 mt-6">
            Merci d'avoir postulé chez nous ! 🚀
          </p>
        </motion.div>
      </div>
    );
  }

  // TEST EN COURS
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <span className="text-2xl font-bold text-white">
                {currentIdx + 1}<span className="text-slate-600">/{total}</span>
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500 uppercase font-bold">Question</p>
              <p className="text-sm text-slate-400">{currentQuestion.points} points</p>
            </div>
          </div>
          
          <div className={`px-6 py-3 rounded-xl font-mono text-2xl font-bold backdrop-blur-sm ${
            testState.timeRemaining < 300 
              ? 'text-red-400 bg-red-500/10 border-2 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20' 
              : 'text-cyan-400 bg-cyan-500/10 border-2 border-cyan-500/30'
          }`}>
            <Clock size={20} className="inline mr-2"/>
            {formatTime(testState.timeRemaining)}
          </div>
        </div>

        {/* QUESTION */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx} 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl mb-8"
          >
            <h3 className="text-3xl font-bold mb-10 text-white leading-relaxed">
              {currentQuestion.text}
            </h3>
            
            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <motion.button 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAnswer(option)} 
                  className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                    selectedAnswer === option 
                      ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white shadow-lg shadow-cyan-500/20' 
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-500/50 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedAnswer === option
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1 font-medium">{option}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
              <div className="text-sm">
                {testState.tabSwitchCount > 0 && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle size={16}/>
                    <span className="font-bold">{testState.tabSwitchCount} changement(s) d'onglet détecté(s)</span>
                  </div>
                )}
              </div>
              <button 
                onClick={nextQuestion} 
                disabled={!selectedAnswer} 
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none flex items-center gap-2"
              >
                {currentIdx === total - 1 ? (
                  <>
                    <CheckCircle2 size={20}/>
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <Zap size={20}/>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* PROGRESS BAR */}
        <div className="relative h-3 bg-slate-900/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
          <motion.div 
            animate={{ width: `${((currentIdx + 1) / total) * 100}%` }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-lg"
            transition={{ duration: 0.3 }}
          />
        </div>

      </div>
    </div>
  );
}



// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import { BrainCircuit, Clock, Target, CheckCircle2, Loader2, Zap, AlertTriangle, Sparkles } from 'lucide-react';
// import { api } from '@/services/api';

// interface TestQuestion {
//   id: string;
//   text: string;
//   options: string[];
//   points: number;
// }

// interface TestState {
//   currentQuestionIndex: number;
//   answers: Record<string, string>;
//   timeRemaining: number;
//   tabSwitchCount: number;
//   isStarted: boolean;
//   isCompleted: boolean;
// }

// export default function TestIAPage({ params }: { params: { id: string; candidateId: string } }) {
//   const router = useRouter();
  
//   const [questions, setQuestions] = useState<TestQuestion[]>([]);
//   const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
//   const [testConfig, setTestConfig] = useState({ duration: 30, totalPoints: 0 });

//   const [testState, setTestState] = useState<TestState>({
//     currentQuestionIndex: 0,
//     answers: {},
//     timeRemaining: 30 * 60,
//     tabSwitchCount: 0,
//     isStarted: false,
//     isCompleted: false
//   });

//   const [startTime, setStartTime] = useState<number>(0);

//   useEffect(() => {
//     fetchQuestions();
    
//     // Anti-triche : Détection changement d'onglet
//     const handleVisibilityChange = () => {
//       if (document.hidden && testState.isStarted && !testState.isCompleted) {
//         setTestState(prev => ({ ...prev, tabSwitchCount: prev.tabSwitchCount + 1 }));
//       }
//     };

//     // Désactiver copier-coller
//     const preventCopy = (e: Event) => e.preventDefault();
//     const preventContextMenu = (e: Event) => e.preventDefault();

//     if (testState.isStarted && !testState.isCompleted) {
//       document.addEventListener('visibilitychange', handleVisibilityChange);
//       document.addEventListener('copy', preventCopy);
//       document.addEventListener('paste', preventCopy);
//       document.addEventListener('contextmenu', preventContextMenu);
//     }

//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//       document.removeEventListener('copy', preventCopy);
//       document.removeEventListener('paste', preventCopy);
//       document.removeEventListener('contextmenu', preventContextMenu);
//     };
//   }, [testState.isStarted, testState.isCompleted]);

//   const fetchQuestions = async () => {
//     try {
//       const response = await api.get<any>(`/public/jobs/${params.id}/test-questions`);
//       setQuestions(response.questions || []);
//       const duration = response.config?.duration || 30;
//       const totalPoints = response.questions?.reduce((sum: number, q: any) => sum + q.points, 0) || 0;
//       setTestConfig({ duration, totalPoints });
//       setTestState(prev => ({ ...prev, timeRemaining: duration * 60 }));
//     } catch (e) {
//       console.error(e);
//       alert("Erreur lors du chargement du test");
//     } finally {
//       setIsLoadingQuestions(false);
//     }
//   };

//   const currentIdx = testState.currentQuestionIndex;
//   const total = questions.length;
//   const currentQuestion = questions[currentIdx];
//   const selectedAnswer = currentQuestion ? testState.answers[currentQuestion.id] : undefined;

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const startTest = () => {
//     setTestState(prev => ({ ...prev, isStarted: true }));
//     setStartTime(Date.now());
//     document.documentElement.requestFullscreen?.().catch(() => {});
//   };

//   const completeTest = useCallback(async () => {
//     setTestState(prev => ({ ...prev, isCompleted: true }));
    
//     const testDuration = Math.floor((Date.now() - startTime) / 1000);
    
//     try {
//       await api.post(`/public/jobs/${params.id}/candidates/${params.candidateId}/submit-test`, {
//         answers: testState.answers,
//         tabSwitchCount: testState.tabSwitchCount,
//         testDuration
//       });
//     } catch (e) {
//       console.error("Erreur envoi réponses:", e);
//     }
//   }, [params.id, params.candidateId, testState.answers, testState.tabSwitchCount, startTime]);

//   const selectAnswer = (option: string) => {
//     setTestState(prev => ({
//       ...prev,
//       answers: { ...prev.answers, [currentQuestion.id]: option }
//     }));
//   };

//   const nextQuestion = () => {
//     if (currentIdx === total - 1) {
//       completeTest();
//     } else {
//       setTestState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
//     }
//   };

//   // Timer
//   useEffect(() => {
//     if (!testState.isStarted || testState.isCompleted) return;
    
//     const timer = setInterval(() => {
//       setTestState(prev => {
//         const newTime = prev.timeRemaining - 1;
//         if (newTime <= 0) {
//           completeTest();
//           return { ...prev, timeRemaining: 0, isCompleted: true };
//         }
//         return { ...prev, timeRemaining: newTime };
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [testState.isStarted, testState.isCompleted, completeTest]);

//   // LOADING
//   if (isLoadingQuestions) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//         <div className="relative">
//           <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
//           <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48} />
//         </div>
//       </div>
//     );
//   }

//   // PAS DE QUESTIONS
//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
//         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center max-w-md">
//           <h1 className="text-2xl font-bold text-white mb-4">Aucun test disponible</h1>
//           <p className="text-slate-400">Cette offre ne comporte pas de test technique.</p>
//         </div>
//       </div>
//     );
//   }

//   // ÉCRAN D'ACCUEIL
//   if (!testState.isStarted) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        
//         {/* Animated Background */}
//         <div className="fixed inset-0 pointer-events-none">
//           <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//         </div>

//         <motion.div 
//           initial={{ opacity: 0, y: 20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center relative z-10 shadow-2xl"
//         >
//           <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
//             <BrainCircuit size={40} className="text-white" />
//           </div>
          
//           <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Test Technique IA</h1>
//           <p className="text-slate-400 text-lg mb-10">Évaluez vos compétences pour finaliser votre candidature</p>
          
//           <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 space-y-4 border border-white/5">
//             <div className="flex items-center gap-4 justify-center">
//               <Clock size={24} className="text-cyan-400" />
//               <div className="text-left">
//                 <p className="text-slate-500 text-xs uppercase font-bold">Durée</p>
//                 <p className="text-white text-xl font-bold">{testConfig.duration} minutes</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4 justify-center">
//               <Target size={24} className="text-purple-400" />
//               <div className="text-left">
//                 <p className="text-slate-500 text-xs uppercase font-bold">Questions</p>
//                 <p className="text-white text-xl font-bold">{total} QCM ({testConfig.totalPoints} pts)</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 text-left">
//             <div className="flex items-start gap-3 mb-3">
//               <AlertTriangle size={20} className="text-yellow-400 mt-0.5 shrink-0"/>
//               <h3 className="text-sm font-bold text-yellow-400 uppercase">Règles Anti-Triche</h3>
//             </div>
//             <ul className="text-sm text-slate-300 space-y-2">
//               <li className="flex items-start gap-2">
//                 <span className="text-yellow-400">•</span>
//                 <span>Ne changez pas d'onglet pendant le test</span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-yellow-400">•</span>
//                 <span>Le copier-coller est désactivé</span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-yellow-400">•</span>
//                 <span>Toute activité suspecte sera signalée</span>
//               </li>
//             </ul>
//           </div>

//           <button 
//             onClick={startTest} 
//             className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-cyan-500/30 text-lg flex items-center justify-center gap-3"
//           >
//             <Zap size={24}/>
//             Commencer le Test
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   // ÉCRAN FIN
//   if (testState.isCompleted) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
        
//         {/* Success Glow */}
//         <div className="fixed inset-0 pointer-events-none">
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px] animate-pulse"></div>
//         </div>

//         <motion.div 
//           initial={{ scale: 0.9, opacity: 0 }} 
//           animate={{ scale: 1, opacity: 1 }} 
//           className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl p-12 text-center relative z-10 shadow-2xl"
//         >
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ type: "spring", duration: 0.6 }}
//             className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/50"
//           >
//             <CheckCircle2 size={56} className="text-white" />
//           </motion.div>
          
//           <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Test Terminé !</h1>
//           <p className="text-slate-400 text-lg mb-6">
//             Bravo ! Vos réponses ont été envoyées avec succès.
//           </p>
          
//           <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 mb-8">
//             <div className="flex items-center justify-center gap-3 mb-4">
//               <Sparkles size={24} className="text-cyan-400"/>
//               <p className="text-white font-bold text-lg">Prochaines Étapes</p>
//             </div>
//             <p className="text-slate-400 text-sm leading-relaxed">
//               Notre IA va maintenant analyser vos résultats et calculer votre score final. 
//               Vous recevrez une notification par email sous 24-48h avec le statut de votre candidature.
//             </p>
//           </div>

//           <button 
//             onClick={() => window.close()} 
//             className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
//           >
//             Fermer cette fenêtre
//           </button>
          
//           <p className="text-xs text-slate-500 mt-6">
//             Merci d'avoir postulé chez nous ! 🚀
//           </p>
//         </motion.div>
//       </div>
//     );
//   }

//   // TEST EN COURS
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
//       {/* Animated Background */}
//       <div className="fixed inset-0 pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//       </div>

//       <div className="w-full max-w-4xl relative z-10">
        
//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-8">
//           <div className="flex items-center gap-4">
//             <div className="px-5 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
//               <span className="text-2xl font-bold text-white">
//                 {currentIdx + 1}<span className="text-slate-600">/{total}</span>
//               </span>
//             </div>
//             <div className="text-left">
//               <p className="text-xs text-slate-500 uppercase font-bold">Question</p>
//               <p className="text-sm text-slate-400">{currentQuestion.points} points</p>
//             </div>
//           </div>
          
//           <div className={`px-6 py-3 rounded-xl font-mono text-2xl font-bold backdrop-blur-sm ${
//             testState.timeRemaining < 300 
//               ? 'text-red-400 bg-red-500/10 border-2 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20' 
//               : 'text-cyan-400 bg-cyan-500/10 border-2 border-cyan-500/30'
//           }`}>
//             <Clock size={20} className="inline mr-2"/>
//             {formatTime(testState.timeRemaining)}
//           </div>
//         </div>

//         {/* QUESTION */}
//         <AnimatePresence mode="wait">
//           <motion.div 
//             key={currentIdx} 
//             initial={{ opacity: 0, x: 50 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -50 }}
//             className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl mb-8"
//           >
//             <h3 className="text-3xl font-bold mb-10 text-white leading-relaxed">
//               {currentQuestion.text}
//             </h3>
            
//             <div className="space-y-4">
//               {currentQuestion.options.map((option, idx) => (
//                 <motion.button 
//                   key={idx}
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={() => selectAnswer(option)} 
//                   className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
//                     selectedAnswer === option 
//                       ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white shadow-lg shadow-cyan-500/20' 
//                       : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-500/50 hover:bg-white/10'
//                   }`}
//                 >
//                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
//                     selectedAnswer === option
//                       ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg'
//                       : 'bg-slate-800 text-slate-500'
//                   }`}>
//                     {String.fromCharCode(65 + idx)}
//                   </div>
//                   <span className="flex-1 font-medium">{option}</span>
//                 </motion.button>
//               ))}
//             </div>

//             <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
//               <div className="text-sm">
//                 {testState.tabSwitchCount > 0 && (
//                   <div className="flex items-center gap-2 text-yellow-400">
//                     <AlertTriangle size={16}/>
//                     <span className="font-bold">{testState.tabSwitchCount} changement(s) d'onglet détecté(s)</span>
//                   </div>
//                 )}
//               </div>
//               <button 
//                 onClick={nextQuestion} 
//                 disabled={!selectedAnswer} 
//                 className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none flex items-center gap-2"
//               >
//                 {currentIdx === total - 1 ? (
//                   <>
//                     <CheckCircle2 size={20}/>
//                     Terminer
//                   </>
//                 ) : (
//                   <>
//                     Suivant
//                     <Zap size={20}/>
//                   </>
//                 )}
//               </button>
//             </div>
//           </motion.div>
//         </AnimatePresence>

//         {/* PROGRESS BAR */}
//         <div className="relative h-3 bg-slate-900/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
//           <motion.div 
//             animate={{ width: `${((currentIdx + 1) / total) * 100}%` }}
//             className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-lg"
//             transition={{ duration: 0.3 }}
//           />
//         </div>

//       </div>
//     </div>
//   );
// }