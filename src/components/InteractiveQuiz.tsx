'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Award, Lightbulb, Video } from 'lucide-react';
import QuestionBookmarkButton from '@/components/QuestionBookmarkButton';
import StudentActivityTracker from '@/components/StudentActivityTracker';
import VideoPlayer from '@/components/VideoPlayer';
import { getMedicalTier } from '@/lib/medical-encouragement';
import CircularProgressRing from '@/components/CircularProgressRing';
import CelebratoryConfetti from '@/components/CelebratoryConfetti';

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  lectureTitle?: string;
  lectureId?: string;
}

export default function InteractiveQuiz({ questions, lectureTitle = 'المحاضرة', lectureId = 'general' }: InteractiveQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [activeVideoQuestionId, setActiveVideoQuestionId] = useState<number | null>(null);

  if (!questions || questions.length === 0) return null;

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);
  const quizTier = getMedicalTier(percentage);

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="w-full my-12 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl transition-colors duration-200" dir="rtl">
      {/* ⏱️ Quiz Active Solving & Duration Tracker */}
      <StudentActivityTracker
        key={`quiz-tracker-${lectureId}`}
        targetType="quiz"
        targetId={lectureId || 'general-quiz'}
        targetTitle={lectureTitle || 'كويز تفاعلي'}
        resourceTitle="الكويز التجريبي التفاعلي ❓"
        details={{
          questionsCount: questions.length,
          answeredCount: Object.keys(selectedAnswers).length,
          score: showResults ? score : undefined,
          percentage: showResults ? percentage : undefined,
          completed: showResults,
        }}
      />
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              <Award className="w-6 h-6" />
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              الكويز التجريبي التفاعلي (Interactive Nursing Quiz)
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            اختبر مدى استيعابك لنقاط {lectureTitle} مع الشرح والتصحيح النموذجي الفوري
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
            عدد الأسئلة: {questions.length}
          </span>
          {showResults && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-bold transition border border-teal-200 dark:border-teal-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة الاختبار</span>
            </button>
          )}
        </div>
      </div>

      {/* Celebratory Confetti for Tier 10 (>= 91%) */}
      {showResults && quizTier.confetti && <CelebratoryConfetti />}

      {/* Score Summary Banner if submitted - 10 Precise Medical Tiers */}
      {showResults && (
        <div
          className={`my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${quizTier.theme.bgLight} ${quizTier.theme.bgDark} border-2 ${quizTier.theme.borderLight} ${quizTier.theme.borderDark} shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95 duration-300`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right flex-1">
            <CircularProgressRing
              percentage={percentage}
              size={120}
              strokeWidth={9}
              gradientColors={quizTier.theme.strokeGradient}
              glowColor={quizTier.theme.glowColor}
              subLabel={quizTier.emoji}
              uniqueId={`quiz-${lectureId || 'general'}`}
            />

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${quizTier.theme.pillBg} ${quizTier.theme.pillText}`}
                >
                  {quizTier.badge}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  نتيجة الكويز التفاعلي 🎯
                </span>
              </div>

              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                {quizTier.headline}
              </h4>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
                {quizTier.subtext}
              </p>

              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>
                  أجبت على <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{score}</strong> من إجمالي{' '}
                  <strong>{questions.length}</strong> أسئلة
                </span>
                <span>•</span>
                <span>
                  نسبة الإتقان: <strong className="font-mono font-bold">{percentage}%</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-800 dark:text-slate-200 font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-teal-600" />
              <span>إعادة الاختبار 🔄</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-8 mt-6">
        {questions.map((q, qIndex) => {
          const userAnswer = selectedAnswers[q.id];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {qIndex + 1}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed pt-0.5 whitespace-pre-line">{cleanLatexMath(q.question)}</h4>
                </div>
                <div className="self-end sm:self-start flex-shrink-0">
                  <QuestionBookmarkButton questionId={q.id} questionText={q.question} lectureId={lectureId} />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5 mr-0 sm:mr-10">
                {q.options.map((option, optIndex) => {
                  const isSelected = userAnswer === optIndex;
                  const isThisCorrect = optIndex === q.correctIndex;

                  let optionStyle = 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/30';

                  if (showResults) {
                    if (isThisCorrect) {
                      optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold';
                    } else if (isSelected && !isThisCorrect) {
                      optionStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-950 dark:text-rose-200 line-through';
                    } else {
                      optionStyle = 'bg-white/60 dark:bg-slate-900/40 border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-600';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-teal-50 dark:bg-teal-950 border-teal-600 dark:border-teal-500 text-teal-900 dark:text-teal-200 font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      disabled={showResults}
                      className={`w-full text-right p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{cleanLatexMath(option)}</span>
                      </span>

                      {showResults && isThisCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mr-2" />
                      )}
                      {showResults && isSelected && !isThisCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mr-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* In-depth pedagogical explanation */}
              {showResults && (
                <div className="mt-4 mr-0 sm:mr-10 p-4 rounded-xl bg-white dark:bg-slate-800 border border-teal-100 dark:border-teal-900 shadow-sm text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-teal-900 dark:text-teal-300 block mb-0.5">التصحيح والتعليل الطبي:</span>
                      <p className="leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">{cleanLatexMath(q.explanation)}</p>
                    </div>
                  </div>

                  {q.pearl && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2 text-amber-800 dark:text-amber-300">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">نصيحة ونقطة هامة للامتحان:</span>
                        <p className="leading-relaxed whitespace-pre-line">{cleanLatexMath(q.pearl)}</p>
                      </div>
                    </div>
                  )}

                  {q.videoUrl && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveVideoQuestionId(activeVideoQuestionId === q.id ? null : q.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition"
                      >
                        <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{activeVideoQuestionId === q.id ? 'إخفاء فيديو الشرح ✕' : 'فيديو شرح وتوضيح السؤال 🎬'}</span>
                      </button>
                      {activeVideoQuestionId === q.id && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-indigo-500/30">
                          <VideoPlayer
                            videoUrl={q.videoUrl}
                            title={`شرح السؤال ${qIndex + 1}: ${q.question.slice(0, 45)}`}
                            lectureId={lectureId}
                            duration={q.videoDuration}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Submit button */}
      {!showResults && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            أجبت على {Object.keys(selectedAnswers).length} من {questions.length} أسئلة
          </p>

          <button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(selectedAnswers).length === 0}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
              Object.keys(selectedAnswers).length > 0
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            تصحيح الكويز وإظهار النتيجة 🚀
          </button>
        </div>
      )}
    </div>
  );
}
