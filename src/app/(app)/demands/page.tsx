'use client';
import { DemandsTable } from '@/components/demands/DemandsTable';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function DemandsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 h-full flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Carregando quadro de demandas...</span>
          </div>
        </div>
      }
    >
      <DemandsTable />
    </Suspense>
  );
}
