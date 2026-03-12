'use client';

import { useParams } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import EntradasSalidasPanel from '@/components/dashboard/EntradasSalidasPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useSubproceso, useProceso, useArea } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

export default function SubprocesoIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);

  const isLoading = isLoadingArea || isLoadingProceso || isLoadingSubproceso;

  if (isLoading || !areaId || !procesoId || !subprocesoId) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!area || !proceso || !subproceso) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Subproceso no encontrado</h2>
        <p className="text-muted-foreground mb-6">El subproceso que busca no existe, ha sido eliminado o la ruta es incorrecta.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <CaracterizacionPanel
        idEntidad={subproceso.id}
        tipo="subproceso"
        areaId={area.id}
        procesoId={proceso.id}
      />


      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subproceso.id} />
    </div>
  );
}
