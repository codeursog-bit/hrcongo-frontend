// ============================================================================
// 📁 app/jobs/ia/[id]/test/[candidateId]/page.tsx — Test technique candidat
// Page liée à l'entreprise : on affiche SON logo, pas celui de Konza.
// Logique inchangée : questions, minuteur, anti-triche (3 changements d'onglet),
// envoi des réponses, disqualification.
// ============================================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ACCENT, CompanyTopBar, JobPageShell, PageSpinner, useJobOffer } from '@/components/jobs/job-kit';
import { recruitmentTestRequest } from '@/lib/recruitment-test';

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
  // L'offre sert uniquement à afficher le logo et le nom de l'entreprise
  const { job } = useJobOffer(params.id);

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
      exitFullscreen();

      const testDuration = Math.floor((Date.now() - startTime) / 1000);

      try {
        await recruitmentTestRequest(params.id, params.candidateId, true, {
          answers: disqualified ? {} : testState.answers,
          tabSwitchCount: disqualified ? Math.max(MAX_TAB_SWITCHES, testState.tabSwitchCount) : testState.tabSwitchCount,
          testDuration,
        });
        setTestState(prev => ({ ...prev, isCompleted: true, isDisqualified: disqualified }));
      } catch (e) {
        console.error('❌ Erreur envoi réponses:', e);
        alert(e instanceof Error ? e.message : 'Réponses non enregistrées. Réessayez.');
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
      const response = await recruitmentTestRequest<TestQuestionsResponse>(params.id, params.candidateId);
      setQuestions(response.questions || []);
      const duration = response.config?.duration || 10;
      const totalPoints = response.questions?.reduce((sum: number, q: TestQuestion) => sum + q.points, 0) || 0;
      setTestConfig({ duration, totalPoints });
      setTestState(prev => ({ ...prev, timeRemaining: duration * 60 }));
    } catch (e) {
      console.error('❌ Erreur chargement questions:', e);
      alert(e instanceof Error ? e.message : 'Erreur lors du chargement du test');
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

  const card = 'rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-7 sm:p-10';
  const btnPrimary = 'w-full rounded-xl bg-[#FAFAFA] py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white';
  const btnGhost = 'w-full rounded-xl border border-white/10 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/25 hover:bg-white/[0.04]';

  const Screen = ({ children }: { children: React.ReactNode }) => (
    <JobPageShell>
      <CompanyTopBar company={job?.company} />
      <main className="mx-auto flex max-w-xl items-center px-6 py-14" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className={`${card} w-full text-center`}>{children}</div>
      </main>
    </JobPageShell>
  );

  /* ─── Chargement ─── */
  if (isLoadingQuestions) return <PageSpinner />;

  if (questions.length === 0) {
    return (
      <Screen>
        <h1 className="mb-3 text-[24px] font-semibold">Aucun test disponible</h1>
        <p className="text-[15px] text-[#9a9a9a]">Cette offre ne comporte pas de test technique.</p>
      </Screen>
    );
  }

  /* ─── Disqualification ─── */
  if (testState.isCompleted && testState.isDisqualified) {
    return (
      <Screen>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <XCircle size={28} className="text-red-400" />
        </div>
        <h1 className="mb-3 text-[28px] font-semibold">Test annulé</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#9a9a9a]">
          Vous avez changé d’onglet <strong className="text-red-300">{MAX_TAB_SWITCHES} fois</strong>. Votre test a été annulé automatiquement et votre candidature disqualifiée.
        </p>
        <p className="mb-8 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 text-left text-[13.5px] leading-relaxed text-[#d6d6d6]">
          Cette décision a été enregistrée. Si vous pensez qu’il s’agit d’une erreur, contactez directement le recruteur.
        </p>
        <button type="button" onClick={() => { exitFullscreen(); router.push('/jobs/portal'); }} className={btnGhost}>
          Voir d’autres offres
        </button>
      </Screen>
    );
  }

  /* ─── Présentation ─── */
  if (!testState.isStarted) {
    return (
      <Screen>
        <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>Étape 2 sur 2</div>
        <h1 className="mb-3 text-[30px] font-bold tracking-[-0.02em] sm:text-[36px]">Test technique</h1>
        <p className="mb-8 text-[15px] text-[#9a9a9a]">Évaluez vos compétences pour finaliser votre candidature.</p>

        <div className="mb-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-white/[0.08] p-4">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#6f6f6f]">Durée</p>
            <p className="text-[18px] font-semibold">{testConfig.duration} minutes</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] p-4">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#6f6f6f]">Questions</p>
            <p className="text-[18px] font-semibold">{total} QCM ({testConfig.totalPoints} pts)</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border p-5 text-left" style={{ borderColor: `${ACCENT}44`, background: `${ACCENT}0d` }}>
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
            <AlertTriangle size={15} /> Règles anti-triche
          </h3>
          <ul className="space-y-2 text-[14px] leading-relaxed text-[#d6d6d6]">
            <li>Maximum <strong>{MAX_TAB_SWITCHES} changements</strong> d’onglet : au-delà, le test est annulé automatiquement.</li>
            <li>Le copier-coller est désactivé.</li>
            <li>Toute activité suspecte est signalée au recruteur.</li>
          </ul>
        </div>

        <button type="button" onClick={startTest} className={btnPrimary}>Commencer le test</button>
      </Screen>
    );
  }

  /* ─── Terminé ─── */
  if (testState.isCompleted) {
    return (
      <Screen>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}14` }}>
          <CheckCircle2 size={28} style={{ color: ACCENT }} />
        </div>
        <h1 className="mb-3 text-[28px] font-semibold">Test terminé</h1>
        <p className="mb-6 text-[15px] text-[#9a9a9a]">Vos réponses ont été envoyées avec succès.</p>

        <div className="mb-8 rounded-xl border border-white/[0.08] p-5 text-left">
          <p className="mb-1.5 text-[14px] font-semibold">Prochaines étapes</p>
          <p className="text-[13.5px] leading-relaxed text-[#9a9a9a]">
            Vos résultats sont analysés et votre score final est calculé. Vous recevrez un e-mail sous 24 à 48 h avec le statut de votre candidature.
          </p>
        </div>

        <div className="space-y-3">
          <button type="button" onClick={() => { exitFullscreen(); router.push('/jobs/portal'); }} className={btnPrimary}>
            Voir d’autres offres
          </button>
          <button type="button" onClick={() => { exitFullscreen(); window.close(); }} className={btnGhost}>
            Fermer cette fenêtre
          </button>
        </div>
        <p className="mt-6 text-[12.5px] text-[#6f6f6f]">Merci d’avoir postulé.</p>
      </Screen>
    );
  }

  /* ─── Test en cours ─── */
  return (
    <JobPageShell>
      <CompanyTopBar
        company={job?.company}
        right={
          <>
            {testState.tabSwitchCount > 0 && (
              <span
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold ${
                  tabsLeft <= 1 ? 'border-red-500/40 bg-red-500/15 text-red-300' : 'border-white/15 text-[#d6d6d6]'
                }`}
              >
                <AlertTriangle size={13} /> {testState.tabSwitchCount}/{MAX_TAB_SWITCHES}
              </span>
            )}
            <span
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 ${
                timeIsLow ? 'border-red-500/40 bg-red-500/15' : 'border-white/15'
              }`}
              role="timer"
              aria-label="Temps restant"
            >
              <Clock size={16} className={timeIsLow ? 'text-red-300' : 'text-[#9a9a9a]'} />
              <span className={`font-mono text-[18px] font-semibold ${timeIsLow ? 'text-red-300' : ''}`}>
                {formatTime(testState.timeRemaining)}
              </span>
            </span>
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
        <div className={card}>
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#9a9a9a]">
              Question {currentIdx + 1} sur {total}
            </span>
            <span className="rounded-lg border border-white/10 px-3 py-1 text-[13px] font-semibold" style={{ color: ACCENT }}>
              {currentQuestion.points} pts
            </span>
          </div>

          <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${((currentIdx + 1) / total) * 100}%`, background: ACCENT }}
            />
          </div>

          <h2 className="mb-8 text-[20px] font-semibold leading-relaxed sm:text-[24px]">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectAnswer(option)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors sm:p-5 ${
                    isSelected ? 'bg-[#FF9A62]/10' : 'border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                  }`}
                  style={isSelected ? { borderColor: ACCENT } : undefined}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold"
                    style={isSelected ? { background: ACCENT, color: '#000' } : { background: 'rgba(255,255,255,0.08)', color: '#9a9a9a' }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`text-[15px] leading-snug sm:text-[16px] ${isSelected ? 'font-medium' : 'text-[#d6d6d6]'}`}>{option}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={nextQuestion}
              disabled={!selectedAnswer}
              className="rounded-xl bg-[#FAFAFA] px-8 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#6f6f6f]"
            >
              {currentIdx === total - 1 ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </main>

      {/* Avertissement changement d'onglet */}
      {testState.tabSwitchCount > 0 && !testState.isCompleted && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-50 w-[90vw] -translate-x-1/2 sm:w-auto">
          <div
            className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[14px] font-semibold shadow-2xl ${
              tabsLeft <= 1 ? 'border-red-500/50 bg-red-950/90 text-red-200' : 'border-white/20 bg-[#0c0c0d] text-[#F2F2F2]'
            }`}
          >
            <AlertTriangle size={16} />
            {tabsLeft <= 1
              ? 'Dernier avertissement : encore 1 changement d’onglet et vous êtes disqualifié'
              : `${testState.tabSwitchCount}/${MAX_TAB_SWITCHES} changement${testState.tabSwitchCount > 1 ? 's' : ''} d’onglet détecté${testState.tabSwitchCount > 1 ? 's' : ''}`}
          </div>
        </div>
      )}
    </JobPageShell>
  );
}