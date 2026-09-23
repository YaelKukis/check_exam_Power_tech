export interface BoundingBox {
  ymin: number; // 0 to 1000
  xmin: number; // 0 to 1000
  ymax: number; // 0 to 1000
  xmax: number; // 0 to 1000
}

export interface WordToken {
  id: string;
  word: string;
  box: BoundingBox;
  lineIndex: number;
  confidence?: number;
  isStrikethrough?: boolean;
  isCustom?: boolean;
}

export interface SyntaxErrorItem {
  id: string;
  line?: number;
  codeSnippet?: string;
  error: string;
  penalty: number; // 1 point deduction per syntax error
  suggestion?: string;
}

export interface LogicErrorItem {
  id: string;
  description: string;
  penalty: number;
  severity: 'minor' | 'moderate' | 'major';
  impact?: string;
  suggestion?: string;
}

export interface TestCaseResult {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export interface ExamEvaluation {
  studentName: string;
  studentEmail: string;
  problemTitle: string;
  totalScore: number;
  maxScore: number;
  gradeLetter: string;
  passed: boolean;
  syntaxErrors: SyntaxErrorItem[];
  logicErrors: LogicErrorItem[];
  testCases: TestCaseResult[];
  overallFeedback: string;
  strengths: string[];
  recommendations: string[];
  rubric: {
    syntaxScore: number;
    syntaxMax: number;
    logicScore: number;
    logicMax: number;
    styleScore: number;
    styleMax: number;
  };
}

export interface ExamPageData {
  id: string;
  pageNumber: number;
  title: string;
  imageUrl: string;
  tokens: WordToken[];
  pythonCode: string;
  evaluation: ExamEvaluation;
}
