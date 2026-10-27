import { addDays, addMonths, addWeeks, isWeekend, startOfDay } from 'date-fns';
import { TaskRecurrence } from '@/types/index';

function stepRecurrence(date: Date, recurrence: Exclude<TaskRecurrence, 'none'>): Date {
  switch (recurrence) {
    case 'daily':    return addDays(date, 1);
    case 'weekly':   return addWeeks(date, 1);
    case 'biweekly': return addWeeks(date, 2);
    case 'monthly':  return addMonths(date, 1);
    case 'weekdays': {
      let next = addDays(date, 1);
      while (isWeekend(next)) next = addDays(next, 1);
      return next;
    }
  }
}

/**
 * Próximo prazo a partir do prazo atual, avançando até cair depois de hoje.
 * Ex.: tarefa semanal de segunda concluída na quarta → próxima segunda
 * (e não 7 dias após a conclusão); tarefa diária atrasada → amanhã.
 */
export function getNextDueDate(
  dueDate: Date,
  recurrence: Exclude<TaskRecurrence, 'none'>,
  today: Date = new Date()
): Date {
  const limit = startOfDay(today).getTime();
  let next = stepRecurrence(dueDate, recurrence);
  while (startOfDay(next).getTime() <= limit) next = stepRecurrence(next, recurrence);
  return next;
}
