import { Operation, Status } from '@/types';

export const OPERATIONS: Operation[] = [
  'Cielo', 'Onfly', 'Bradesco', 'Luxottica', 'Claro',
  'Banese', 'Banco BV', 'Pluxee', 'Outro'
];

export const STATUSES: Status[] = [
  'Pendente', 'Em andamento', 'Concluído', 'Cancelado'
];

export const OPERATION_COLORS: Record<Operation, { bg: string; text: string; dot: string }> = {
  Cielo:      { bg: 'bg-sky-100 dark:bg-sky-900/40',       text: 'text-sky-700 dark:text-sky-300',       dot: 'bg-sky-500' },
  Onfly:      { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  Bradesco:   { bg: 'bg-red-950/80 dark:bg-red-950/60',    text: 'text-red-100',                         dot: 'bg-red-900' },
  Luxottica:  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  Claro:      { bg: 'bg-red-100 dark:bg-red-900/40',       text: 'text-red-600 dark:text-red-300',       dot: 'bg-red-500' },
  Banese:     { bg: 'bg-green-950/80 dark:bg-green-950/60',text: 'text-green-100',                       dot: 'bg-green-900' },
  'Banco BV': { bg: 'bg-blue-950/80 dark:bg-blue-950/60', text: 'text-blue-100',                        dot: 'bg-blue-900' },
  Pluxee:     { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500' },
  Outro:      { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-600 dark:text-gray-300',     dot: 'bg-gray-500' },
};

export const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  'Pendente':    { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Em andamento':{ bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  'Concluído':   { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
  'Cancelado':   { bg: 'bg-red-100 dark:bg-red-900/40',      text: 'text-red-600 dark:text-red-400',      dot: 'bg-red-500' },
};

export const ACTIVE_STATUSES: Status[] = ['Pendente', 'Em andamento'];
export const DONE_STATUSES: Status[] = ['Concluído', 'Cancelado'];

export const DEBOUNCE_MS = 2000;
