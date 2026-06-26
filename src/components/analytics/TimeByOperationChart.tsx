'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatDuration } from '@/lib/utils';

interface ChartData {
  operation: string;
  seconds: number;
}

interface TimeByOperationChartProps {
  data: ChartData[];
}

const COLORS = [
  '#0ea5e9', // Cielo -> Light Blue
  '#a855f7', // Onfly -> Purple
  '#b91c1c', // Bradesco -> Dark Red
  '#f97316', // Luxottica -> Orange
  '#ef4444', // Claro -> Light Red
  '#15803d', // Banese -> Dark Green
  '#1e3a8a', // Banco BV -> Dark Blue
  '#22c55e', // Pluxee -> Light Green
  '#6b7280', // Outro -> Gray
];

export function TimeByOperationChart({ data }: TimeByOperationChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Carregando gráfico...</div>;
  }

  // Filter out zero-time items to keep chart readable
  const chartData = data
    .filter((d) => d.seconds > 0)
    .map((d) => ({
      name: d.operation,
      value: d.seconds,
      durationStr: formatDuration(d.seconds),
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
        Nenhum dado de tempo registrado no período
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
      <h3 className="text-sm font-bold text-foreground mb-3">Tempo Gasto por Operação</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [formatDuration(value), 'Duração']}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
