'use client';
import { TimeByDemand } from '@/hooks/useAnalytics';
import { OperationBadge } from '@/components/demands/OperationBadge';
import { formatDuration } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeByDemandTableProps {
  data: TimeByDemand[];
  totalSeconds: number;
}

export function TimeByDemandTable({ data, totalSeconds }: TimeByDemandTableProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
        Nenhum registro de tempo no período
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">Tempo por Demanda</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          Total: {formatDuration(totalSeconds)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              <th className="px-4 py-2.5 text-left">Operação</th>
              <th className="px-4 py-2.5 text-left">Demanda</th>
              <th className="px-4 py-2.5 text-right w-28">Tempo</th>
              <th className="px-4 py-2.5 text-right w-20">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((row) => {
              const pct = totalSeconds > 0
                ? Math.round((row.seconds / totalSeconds) * 100)
                : 0;

              return (
                <tr
                  key={row.demandId}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <OperationBadge operation={row.operation} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground truncate block max-w-xs">
                      {row.demandTitle || <span className="italic text-muted-foreground">Sem título</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground tabular-nums">
                    {formatDuration(row.seconds)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Barra de progresso inline */}
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}