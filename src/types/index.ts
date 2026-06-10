import { Timestamp } from 'firebase/firestore';

export type Operation =
  | 'Cielo'
  | 'Onfly'
  | 'Bradesco'
  | 'Luxottica'
  | 'Claro'
  | 'Banese'
  | 'Banco BV'
  | 'Pluxee'
  | 'Outro';

export type Status = 'Pendente' | 'Em andamento' | 'Concluído' | 'Cancelado';

export type TimerStatus = 'running' | 'paused' | 'stopped';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: Timestamp;
}

export interface Demand {
  id: string;
  userId: string;
  demandId: string;
  operation: Operation;
  task: string;
  startDate: Timestamp;
  deadline: Timestamp;
  status: Status;
  notes: string;
  history: string;
  order: number;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimerEntry {
  id: string;
  userId: string;
  demandId: string;
  operation: Operation;
  startedAt: Timestamp | null;
  endedAt?: Timestamp;
  durationSeconds: number;
  status: TimerStatus;
  createdAt: Timestamp;
}

export interface Alarm {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledAt: Timestamp;
  fired: boolean;
  createdAt: Timestamp;
}

export interface AnalyticsData {
  timeByOperation: { operation: Operation; seconds: number }[];
  timeByDay: { date: string; seconds: number }[];
  totalSeconds: number;
  inProgressCount: number;
  completedCount: number;
  delayedCount: number;
}

export type TaskStatus = 'Pendente' | 'Em andamento' | 'Cancelado' | 'Concluída';

export interface Task {
  id: string;
  userId: string;
  demandId: string;
  demandTitle: string;
  operation: Operation;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}