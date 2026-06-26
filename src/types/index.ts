import { Timestamp } from 'firebase/firestore';

export interface Operation {
  id: string;
  name: string;
  color?: string;
  userId: string | null;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  operation: string;
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

// Note: Duplicate TimerEntry is removed and defined fully below

export interface Alarm {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledAt: Timestamp;
  fired: boolean;
  isTriggered?: boolean;
  isAcknowledged?: boolean;
  triggeredAt?: Timestamp;
  acknowledgedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface AnalyticsData {
  timeByOperation: { operation: string; seconds: number }[];
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
  operation: string;
  title: string;
  description: string;
  status: TaskStatus;
  order: number;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotePage {
  id: string;
  userId: string;
  title: string;
  content: string; // HTML do Tiptap
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimerEntry {
  id: string;
  userId: string;
  demandId: string;
  demandTitle: string;   // ← novo: título da demanda no momento do start
  operation: string;
  startedAt: Timestamp | null;
  endedAt?: Timestamp;
  durationSeconds: number;
  status: TimerStatus;
  createdAt: Timestamp;
}

export type DocumentationCategory =
  | 'sistema'
  | 'processo'
  | 'requisito'
  | 'regra_negocio'
  | 'procedimento'
  | 'troubleshooting'
  | 'integracao'
  | 'geral';

export interface DocumentationPage {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: DocumentationCategory;
  operationIds: string[];
  relatedDemandIds?: string[];
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}