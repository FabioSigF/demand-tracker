'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDuration } from '@/lib/utils';

interface ChartData {
  date: string;
  seconds: number;
}

interface TimeByDayChartProps {
  data: ChartData[];
}

export function TimeByDayChart({ data }: TimeByDayChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Carregando gráfico...</div>;
  }

  // Sort daily data chronologically for neat display
  const chartData = [...data]
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      return monthA - monthB || dayA - dayB;
    })
    .map((d) => ({
      ...d,
      valueInHours: Math.round((d.seconds / 3600) * 100) / 100, // round to 2 decimals
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
      <h3 className="text-sm font-bold text-foreground mb-3">Tempo Registrado por Dia</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip
              formatter={(value: any) => [`${formatDuration(value * 3600)}`, 'Tempo Total']}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="valueInHours" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
