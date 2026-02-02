export enum Subject {
  MATHS = 'Maths',
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  OTHER = 'Other'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED_ON_TIME = 'completed_ontime',
  COMPLETED_DELAYED = 'completed_delayed',
  PAUSED = 'paused'
}

export interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // ISO Date string
  totalStudyMinutes: number;
  tasksCompleted: number;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  subject: Subject;
  estimatedMinutes: number;
  actualMinutes: number;
  status: TaskStatus;
  startedAt?: number; // Timestamp
  lastPausedAt?: number; // Timestamp
  completedAt?: number; // Timestamp
  elapsedSeconds: number; // Track accumulated time
  taskDate: string; // YYYY-MM-DD
  createdAt: number;
}

export interface DailySummary {
  id: string;
  userId: string;
  date: string;
  mathsProblems: number;
  physicsProblems: number;
  chemistryProblems: number;
  topicsCovered: string;
  totalStudyHours: number;
  notes: string;
  selfRating: number;
  tasksCompleted: number;
  successRate: number;
}

export interface ActiveSession {
  userId: string;
  taskId: string | null;
  lastSeen: number;
}