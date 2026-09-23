import React from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Wrench,
  BookOpen,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { ExamEvaluation, SyntaxErrorItem } from '../types';

interface GradingDashboardProps {
  evaluation: ExamEvaluation;
  onApplySyntaxFix: (fix: SyntaxErrorItem) => void;
  onAutoFixAll: () => void;
}

export const GradingDashboard: React.FC<GradingDashboardProps> = ({
  evaluation,
  onApplySyntaxFix,
  onAutoFixAll,
}) => {
  const {
    studentName,
    studentEmail,
    problemTitle,
    totalScore,
    gradeLetter,
    passed,
    syntaxErrors,
    logicErrors,
    testCases,
    overallFeedback,
    strengths,
    recommendations,
    rubric,
  } = evaluation;

  // Grade color
  const gradeColor =
    totalScore >= 90
      ? 'from-emerald-500 to-teal-400 text-emerald-400'
      : totalScore >= 80
      ? 'from-blue-500 to-indigo-400 text-blue-400'
      : totalScore >= 70
      ? 'from-amber-500 to-yellow-400 text-amber-400'
      : 'from-rose-500 to-red-400 text-rose-400';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{problemTitle}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Exam Evaluation
              </span>
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                {studentName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                {studentEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Lenient Grading Policy Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-slate-200 font-medium">Lenient Grading: </span>
            <span className="text-slate-400">-1 pt per syntax slip, logic weighted</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {/* Score & Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Grade Card */}
          <div className="md:col-span-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-1">
              Final Grade
            </span>
            <div className={`text-4xl font-extrabold tracking-tight bg-gradient-to-r ${gradeColor} bg-clip-text text-transparent`}>
              {totalScore}
              <span className="text-lg text-slate-500 font-normal">/100</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                Grade {gradeLetter}
              </span>
              {passed ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pass
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Fail
                </span>
              )}
            </div>
          </div>

          {/* Rubric Breakdown Cards */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Syntax Card */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Syntax & Spelling</span>
                <span className="font-mono text-indigo-400">
                  {rubric.syntaxScore} / {rubric.syntaxMax}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(rubric.syntaxScore / rubric.syntaxMax) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {syntaxErrors.length === 0
                  ? 'No syntax errors detected.'
                  : `${syntaxErrors.length} minor slip(s) (-1 pt each)`}
              </p>
            </div>

            {/* Logic Card */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Algorithmic Logic</span>
                <span className="font-mono text-emerald-400">
                  {rubric.logicScore} / {rubric.logicMax}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(rubric.logicScore / rubric.logicMax) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {logicErrors.length === 0
                  ? 'Algorithm logic is sound & robust.'
                  : `${logicErrors.length} logical issue(s) found`}
              </p>
            </div>

            {/* Style & Code Structure Card */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Code Organization</span>
                <span className="font-mono text-teal-400">
                  {rubric.styleScore} / {rubric.styleMax}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(rubric.styleScore / rubric.styleMax) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Readable structure & clear variable names</p>
            </div>
          </div>
        </div>

        {/* Examiner's Feedback */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Examiner Notes & Feedback
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{overallFeedback}</p>

          {strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {strengths.map((str, i) => (
                <span
                  key={`str-${i}`}
                  className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {str}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Syntax Deductions Section with Client Help / Quick Fixes */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-100">
                Syntax & Transcription Issues
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                {syntaxErrors.length} {syntaxErrors.length === 1 ? 'error' : 'errors'}
              </span>
            </div>

            {syntaxErrors.length > 0 && (
              <button
                onClick={onAutoFixAll}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                title="Help the student by auto-correcting recognized typos"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Help / Fix All Typos</span>
              </button>
            )}
          </div>

          {syntaxErrors.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No syntax deductions! Code passes all grammar and convention checks.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {syntaxErrors.map((err) => (
                <div
                  key={err.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 gap-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      -{err.penalty} pt
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-200">
                        {err.error}
                      </div>
                      {err.codeSnippet && (
                        <code className="text-[11px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Line {err.line}: {err.codeSnippet}
                        </code>
                      )}
                      {err.suggestion && (
                        <div className="text-[11px] text-indigo-300 mt-1">
                          Fix suggestion: {err.suggestion}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onApplySyntaxFix(err)}
                    className="self-end sm:self-center px-2.5 py-1 text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Apply Fix</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logic Errors Section (if any) */}
        {logicErrors.length > 0 && (
          <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-semibold text-rose-300">
                Logic & Algorithmic Issues
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300">
                {logicErrors.length} issue(s)
              </span>
            </div>

            <div className="space-y-2">
              {logicErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-rose-200">{err.description}</span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded">
                      -{err.penalty} pts
                    </span>
                  </div>
                  {err.impact && <p className="text-slate-400 mt-1">{err.impact}</p>}
                  {err.suggestion && (
                    <p className="text-indigo-300 mt-1">Recommendation: {err.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unit Test Cases Suite */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Unit Test Verification Suite</span>
              <span className="text-xs text-slate-500">
                ({testCases.filter((t) => t.passed).length}/{testCases.length} Passed)
              </span>
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 select-none">
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Input (s)</th>
                  <th className="pb-2 font-medium">Expected</th>
                  <th className="pb-2 font-medium">Actual</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2">
                      {tc.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-slate-200">{tc.input}</td>
                    <td className="py-2 text-slate-400">{tc.expected}</td>
                    <td className="py-2 text-slate-300">{tc.actual}</td>
                    <td className="py-2 text-slate-500 text-[11px] hidden sm:table-cell">
                      {tc.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
