'use client';

import { useParams } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import EntradasSalidasPanel from '@/components/dashboard/EntradasSalidasPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useArea, useProcesos } from '@/hooks/use-areas-data';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

export default function AreaIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { procesos, isLoading: isLoadingProcesos } = useProcesos(areaId);
  const { userRole } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const isLoading = isLoadingArea || isLoadingProcesos;
  const canAdd = userRole === 'superadmin' || userRole === 'admin';

  if (!areaId || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Área no encontrada</h2>
        <p className="text-muted-foreground mb-6">El área que busca no existe o ha sido eliminada.</p>
      </div>
    );
  }

  const hasProcesos = procesos && procesos.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <CaracterizacionPanel
        idEntidad={area.id}
        tipo="area"
        showAddChildButton={!hasProcesos && canAdd}
        onAddChildClick={() => setIsAdding(true)}
      />

      {canAdd && (
        <AddEntityForm
          entityType="process"
          parentId={area.id}
          isOpen={isAdding}
          onOpenChange={setIsAdding}
        />
      )}

      {hasProcesos && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full border-b pb-2">
            <h2 className="text-2xl font-bold tracking-tight font-headline">Procesos</h2>
            {canAdd && (
              <AddEntityForm entityType="process" parentId={area.id}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Proceso
                </Button>
              </AddEntityForm>
            )}
          </div>
          <ProcesoCards areaId={area.id} procesos={procesos} />
        </div>
      )}

      <RepoEmbed areaId={area.id} />
    </div>
  );
}
