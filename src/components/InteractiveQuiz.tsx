'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { cleanLatexMath } from '@/lib/text-cleaner';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Award, Lightbulb } from 'lucide-react';
import QuestionBookmarkButton from '@/components/QuestionBookmarkButton';

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  lectureTitle?: string;
  lectureId?: string;
}

export default function InteractiveQuiz({ questions, lectureTitle = 'المحاضرة', lectureId = 'general' }: InteractiveQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

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

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="w-full my-12 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl transition-colors duration-200" dir="rtl">
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

      {/* Score Summary Banner if submitted */}
      {showResults && (
        <div
          className={`my-6 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${
            percentage >= 70
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                percentage >= 70 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {percentage}%
            </div>
            <div>
              <h4 className="text-base font-bold">
                {percentage >= 90
                  ? '🌟 ممتاز جداً! استيعاب متكامل وشامل للمحاضرة.'
                  : percentage >= 70
                  ? '👏 نتيجة جيدة جداً! مراجعة النقاط ستجعلك في المقدمة.'
                  : '💡 بحاجة لمراجعة بعض المفاهيم، راجع الشرح النموذجي بالأسفل.'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                حصلت على {score} إجابات صحيحة من إجمالي {questions.length} أسئلة
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            إعادة المحاولة من البداية
          </button>
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
