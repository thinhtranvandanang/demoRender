
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  questions: Question[];
  createdAt: number;
  authorId?: string;
}

export interface GradingResult {
  score: number;
  totalQuestions: number;
  feedback: string;
  corrections: {
    questionIndex: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    comment: string;
  }[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CREATE_EXAM = 'CREATE_EXAM',
  TAKE_EXAM = 'TAKE_EXAM',
  GRADING = 'GRADING',
}
