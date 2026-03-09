
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { useAreas } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { useToast } from '@/hooks/use-toast';
import { seedProcessMapAction, migrateAreaIconsAction, migrateAreaTypesAction } from '@/app/actions';
import { EntityOptionsDropdown } from '@/components/dashboard/EntityOptionsDropdown';
import { useAuth } from '@/lib/auth';

const AreaCard = ({ area }: { area: any }) => {
    const { toast } = useToast();
    const { userRole } = useAuth();
    const Icon = (area.icono && (Icons as any)[area.icono]) ? (Icons as any)[area.icono] : Icons.Building;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
             e.preventDefault();
             return;
        }

        if (!area || !area.id) {
            e.preventDefault();
            toast({
                variant: 'destructive',
                title: 'Elemento no encontrado',
                description: 'El área que intenta abrir ya no existe o no se pudo cargar.',
            });
        } else {
            window.location.href = `/inicio/documentos/area/${area.id}`;
        }
    };
    
    return (
        <div className="relative group">
            <Card 
                className="h-full flex flex-col items-center justify-center text-center p-6 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer" 
                onClick={handleClick}
            >
                <Icon className="h-16 w-16 text-primary mb-4" />
                <CardHeader className="p-0">
                    <CardTitle className="font-headline text-xl">{area.nombre}</CardTitle>
                </CardHeader>
            </Card>
             {userRole === 'superadmin' && (
                <div className="absolute top-2 right-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <EntityOptionsDropdown
                        entityId={area.id}
                        entityType="area"
                        entityName={area.nombre}
                    />
                </div>
            )}
        </div>
    );
}

export default function RepositoryAreasPage() {
  const { areas, isLoading } = useAreas();
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingAction, setIsSeedingAction] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    const ensureSeeded = async () => {
        if (!isLoading && areas && areas.length === 0 && userRole === 'superadmin' && !isSeedingAction) {
            setIsSeedingAction(true); // Prevent re-triggering
            toast({
                title: "Restaurando mapa de procesos...",
                description: "La base de datos está vacía. Se restaurarán los datos predeterminados.",
            });
            const result = await seedProcessMapAction();
            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error en la restauración',
                    description: result.error,
                });
            } else {
                 toast({
                    title: '¡Éxito!',
                    description: result.message,
                });
            }
            setIsSeedingAction(false);
        }
    };
    ensureSeeded();
  }, [isLoading, areas, toast, userRole, isSeedingAction]);

  useEffect(() => {
    const migrateIcons = async () => {
      if (userRole === 'superadmin' && areas && areas.some(area => !area.icono)) {
        await migrateAreaIconsAction();
        toast({
          title: 'Migración de Iconos Completa',
          description: 'Se han asignado iconos a las áreas que no tenían.',
        });
      }
    };
    migrateIcons();
  }, [areas, userRole, toast]);

  useEffect(() => {
    const migrateTypes = async () => {
      if (userRole === 'superadmin' && areas && areas.some(area => !area.tipo)) {
        await migrateAreaTypesAction();
        toast({
          title: 'Migración de Tipos de Área Completa',
          description: 'Se han asignado los tipos a las áreas que no tenían.',
        });
      }
    };
    migrateTypes();
  }, [areas, userRole, toast]);


  const showLoadingState = isLoading || isSeedingAction;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Mapa de Procesos</h1>
            <p className="text-muted-foreground">Seleccione un área para explorar su información y procesos asociados.</p>
        </div>
         {userRole === 'superadmin' && (
            <AddEntityForm 
                entityType="area" 
                isOpen={isAdding} 
                onOpenChange={setIsAdding}
            >
                <Button onClick={() => setIsAdding(true)}>
                    <Icons.PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Área
                </Button>
            </AddEntityForm>
        )}
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        {showLoadingState && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
        ))}
        {!showLoadingState && areas?.map((area) => (
            <AreaCard key={area.id} area={area} />
        ))}
      </div>
       {!showLoadingState && areas?.length === 0 && (
            <div className="col-span-full text-center py-10">
                 <Card className="max-w-lg mx-auto p-8 text-center shadow-md">
                    <p className="text-lg font-medium">No hay áreas definidas</p>
                    <p className="mt-2 text-muted-foreground">
                        {userRole === 'superadmin' ? 'Para comenzar a construir el mapa de procesos, por favor agregue una nueva área.' : 'Actualmente no hay áreas configuradas en el sistema.'}
                    </p>
                </Card>
            </div>
       )}
    </div>
  );
}
