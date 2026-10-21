'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DemandDrawer } from '@/components/demands/DemandDrawer';
import { useDemand } from '@/hooks/useDemand';

export default function DemandDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { demand, loading, editDemand } = useDemand(id);

  const handleClose = useCallback(() => router.push('/demands'), [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
        <p className="text-sm text-muted-foreground">Demanda não encontrada ou sem permissão de acesso.</p>
        <Link href="/demands" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao quadro
        </Link>
      </div>
    );
  }

  return (
    <DemandDrawer
      variant="page"
      demand={demand}
      isOpen
      onClose={handleClose}
      onUpdate={editDemand}
    />
  );
}
