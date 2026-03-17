'use client';

import { useParams, useRouter } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useProceso, useArea, useSubprocesos } from '@/hooks/use-areas-data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useIndicadoresPorEntidad } from '@/hooks/use-indicadores';
import FormIndicador from '@/components/indicadores/FormIndicador';
import TablaIndicadores from '@/components/indicadores/TablaIndicadores';

export default function ProcesoIdPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingIndicador, setIsAddingIndicador] = useState(false);
  const { userRole } = useAuth();

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subprocesos, isLoading: isLoadingSubprocesos } = useSubprocesos(areaId, procesoId);
  const { indicadores } = useIndicadoresPorEntidad(procesoId);
  const hasIndicadores = indicadores && indicadores.length > 0;

  const isLoading = isLoadingArea || isLoadingProceso || isLoadingSubprocesos;
  const canAdd = userRole === 'superadmin' || userRole === 'admin';

  if (!areaId || !procesoId || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!area || !proceso) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Proceso no encontrado</h2>
        <p className="text-muted-foreground mb-6">El proceso que busca no existe, ha sido eliminado o el área es incorrecta.</p>
      </div>
    );
  }

  const hasSubprocesos = subprocesos && subprocesos.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <CaracterizacionPanel
        idEntidad={proceso.id}
        tipo="proceso"
        areaId={area.id}
        showAddChildButton={!hasSubprocesos && canAdd}
        onAddChildClick={() => setIsAdding(true)}
      />

      {canAdd && (
        <AddEntityForm
          entityType="subprocess"
          parentId={proceso.id}
          grandParentId={area.id}
          isOpen={isAdding}
          onOpenChange={setIsAdding}
        />
      )}

      {hasSubprocesos && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight font-headline">Sub-procesos</h2>
            {canAdd && (
              <AddEntityForm
                entityType="subprocess"
                parentId={proceso.id}
                grandParentId={area.id}
              >
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Subproceso
                </Button>
              </AddEntityForm>
            )}
          </div>
          <ProcesoCards areaId={areaId} procesoId={procesoId} subprocesos={subprocesos} />
        </div>
      )}

      {(hasIndicadores || userRole === 'superadmin') && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight font-headline">Indicadores</h2>
            {userRole === 'superadmin' && (
              <Button onClick={() => setIsAddingIndicador(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Indicador
              </Button>
            )}
          </div>
          {!isAddingIndicador && (
            <TablaIndicadores
              indicadores={indicadores ?? []}
              onVerDetalle={(id) =>
                router.push(`/inicio/documentos/area/${areaId}/proceso/${procesoId}/indicador/${id}`)
              }
            />
          )}
        </div>
      )}

      {isAddingIndicador && (
        <FormIndicador
          procesoId={procesoId}
          onSuccess={() => setIsAddingIndicador(false)}
          onCancel={() => setIsAddingIndicador(false)}
        />
      )}

      <RepoEmbed areaId={areaId} procesoId={procesoId} />
    </div>
  );
}