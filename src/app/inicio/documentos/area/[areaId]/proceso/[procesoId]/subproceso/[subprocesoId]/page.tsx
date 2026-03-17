'use client';

import { useParams } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import EntradasSalidasPanel from '@/components/dashboard/EntradasSalidasPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useSubproceso, useProceso, useArea } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useIndicadoresPorEntidad } from '@/hooks/use-indicadores';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function SubprocesoIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;
  const { userRole } = useAuth();

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);
  const { indicadores } = useIndicadoresPorEntidad(subprocesoId);
  const hasIndicadores = indicadores && indicadores.length > 0;

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

      {(hasIndicadores || userRole === 'superadmin') && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight font-headline">Indicadores</h2>
            {userRole === 'superadmin' && (
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Indicador
              </Button>
            )}
          </div>
          {!hasIndicadores && (
            <p className="text-muted-foreground text-sm">No hay indicadores registrados.</p>
          )}
        </div>
      )}

      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subproceso.id} />
    </div>
  );
}
